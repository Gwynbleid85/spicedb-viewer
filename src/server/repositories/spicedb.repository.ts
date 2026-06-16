import { v1 } from "@authzed/authzed-node";

import {
	createRelationshipGraph,
	createSchemaGraph,
	type SpiceDbGraph,
} from "#/lib/spicedb-graph";
import {
	getSpiceDbConfig,
	getSpiceDbGrpcClient,
	getSpiceDbRestClient,
	logSpiceDbInfo,
} from "#/server/spicedb/client";

type SchemaDependency = {
	permissionDefinitionName: string;
	permissionName: string;
	relation: {
		definitionName: string;
		isPermission?: boolean;
		relationName: string;
	};
};

type RestReflection = {
	caveats?: v1.ReflectionCaveat[];
	definitions?: v1.ReflectionDefinition[];
	readAt?: { token?: string };
};

type RestRelationshipReadResult = {
	relationship?: v1.Relationship;
};

async function readGrpcSchemaDependencies(
	client: v1.ZedClientInterface,
	reflection: v1.ReflectSchemaResponse,
) {
	const dependencies: SchemaDependency[] = [];

	for (const definition of reflection.definitions) {
		for (const permission of definition.permissions) {
			const start = performance.now();
			logSpiceDbInfo("dependent relations request started", {
				definitionName: definition.name,
				permissionName: permission.name,
				protocol: "grpc",
			});

			const response = await client.promises.dependentRelations(
				v1.DependentRelationsRequest.create({
					definitionName: definition.name,
					permissionName: permission.name,
				}),
			);

			logSpiceDbInfo("dependent relations request completed", {
				definitionName: definition.name,
				durationMs: Math.round(performance.now() - start),
				permissionName: permission.name,
				protocol: "grpc",
				relationCount: response.relations.length,
			});

			dependencies.push(
				...response.relations.map((relation) => ({
					permissionDefinitionName: definition.name,
					permissionName: permission.name,
					relation,
				})),
			);
		}
	}

	return dependencies;
}

async function readRestSchemaDependencies(reflection: RestReflection) {
	const client = getSpiceDbRestClient();
	const dependencies: SchemaDependency[] = [];

	for (const definition of reflection.definitions ?? []) {
		for (const permission of definition.permissions) {
			const start = performance.now();
			logSpiceDbInfo("dependent relations request started", {
				definitionName: definition.name,
				permissionName: permission.name,
				protocol: "rest",
			});

			const response = (await client.dependentRelations({
				definitionName: definition.name,
				permissionName: permission.name,
			})) as { relations?: SchemaDependency["relation"][] };

			logSpiceDbInfo("dependent relations request completed", {
				definitionName: definition.name,
				durationMs: Math.round(performance.now() - start),
				permissionName: permission.name,
				protocol: "rest",
				relationCount: response.relations?.length ?? 0,
			});

			dependencies.push(
				...(response.relations ?? []).map((relation) => ({
					permissionDefinitionName: definition.name,
					permissionName: permission.name,
					relation,
				})),
			);
		}
	}

	return dependencies;
}

async function exportGrpcRelationshipsWithLimit(
	client: v1.ZedClientInterface,
	limit: number,
) {
	const relationships: v1.Relationship[] = [];
	let truncated = false;

	await new Promise<void>((resolve, reject) => {
		let settled = false;
		const stream = client.exportBulkRelationships(
			v1.ExportBulkRelationshipsRequest.create({
				optionalLimit: Math.min(limit, 500),
			}),
		);

		function finish() {
			if (!settled) {
				settled = true;
				resolve();
			}
		}

		stream.on("data", (page: v1.ExportBulkRelationshipsResponse) => {
			for (const relationship of page.relationships) {
				if (relationships.length >= limit) {
					truncated = true;
					stream.cancel();
					finish();
					return;
				}

				relationships.push(relationship);
			}
		});

		stream.on("end", finish);
		stream.on("error", (error) => {
			if (settled && truncated) {
				return;
			}

			reject(error);
		});
	});

	return {
		relationships,
		truncated,
	};
}

async function exportRestRelationshipsWithLimit(limit: number) {
	const client = getSpiceDbRestClient();
	const reflection = (await client.reflectSchema({
		optionalFilters: [],
	})) as RestReflection;
	const relationships: v1.Relationship[] = [];
	let truncated = false;

	for (const definition of reflection.definitions ?? []) {
		const remaining = limit - relationships.length;

		if (remaining < 1) {
			truncated = true;
			break;
		}

		const results = (await client.readRelationships({
			optionalLimit: remaining + 1,
			relationshipFilter: {
				resourceType: definition.name,
			},
		})) as RestRelationshipReadResult[];

		for (const result of results) {
			if (!result.relationship) {
				continue;
			}

			if (relationships.length >= limit) {
				truncated = true;
				break;
			}

			relationships.push(result.relationship);
		}

		if (truncated) {
			break;
		}
	}

	return {
		relationships,
		truncated,
	};
}

export async function getSchemaGraph(): Promise<SpiceDbGraph> {
	const config = getSpiceDbConfig();
	const start = performance.now();

	logSpiceDbInfo("schema reflection started", { protocol: config.protocol });

	if (config.protocol === "rest") {
		const reflection = (await getSpiceDbRestClient().reflectSchema({
			optionalFilters: [],
		})) as RestReflection;
		logSpiceDbInfo("schema reflection completed", {
			caveatCount: reflection.caveats?.length ?? 0,
			definitionCount: reflection.definitions?.length ?? 0,
			durationMs: Math.round(performance.now() - start),
			protocol: config.protocol,
			readAt: reflection.readAt?.token,
		});

		const dependencyStart = performance.now();
		const dependencies = await readRestSchemaDependencies(reflection);
		logSpiceDbInfo("schema dependencies completed", {
			dependencyCount: dependencies.length,
			durationMs: Math.round(performance.now() - dependencyStart),
			protocol: config.protocol,
		});

		const graph = createSchemaGraph({
			definitions: reflection.definitions ?? [],
			caveats: reflection.caveats ?? [],
			dependencies,
			readAt: reflection.readAt?.token,
		});
		logSpiceDbInfo("schema graph created", {
			durationMs: Math.round(performance.now() - start),
			edgeCount: graph.stats.edgeCount,
			nodeCount: graph.stats.nodeCount,
			protocol: config.protocol,
		});

		return graph;
	}

	const client = getSpiceDbGrpcClient();
	const reflection = await client.promises.reflectSchema(
		v1.ReflectSchemaRequest.create({
			optionalFilters: [],
		}),
	);
	logSpiceDbInfo("schema reflection completed", {
		caveatCount: reflection.caveats.length,
		definitionCount: reflection.definitions.length,
		durationMs: Math.round(performance.now() - start),
		protocol: config.protocol,
		readAt: reflection.readAt?.token,
	});

	const dependencyStart = performance.now();
	const dependencies = await readGrpcSchemaDependencies(client, reflection);
	logSpiceDbInfo("schema dependencies completed", {
		dependencyCount: dependencies.length,
		durationMs: Math.round(performance.now() - dependencyStart),
		protocol: config.protocol,
	});

	const graph = createSchemaGraph({
		definitions: reflection.definitions,
		caveats: reflection.caveats,
		dependencies,
		readAt: reflection.readAt?.token,
	});
	logSpiceDbInfo("schema graph created", {
		durationMs: Math.round(performance.now() - start),
		edgeCount: graph.stats.edgeCount,
		nodeCount: graph.stats.nodeCount,
		protocol: config.protocol,
	});

	return graph;
}

export async function getRelationshipGraph(
	limit?: number,
): Promise<SpiceDbGraph> {
	const config = getSpiceDbConfig();
	const start = performance.now();
	const configuredLimit = config.relationshipExportLimit;
	const effectiveLimit = Math.min(limit ?? configuredLimit, configuredLimit);

	logSpiceDbInfo("relationship export started", {
		configuredLimit,
		effectiveLimit,
		protocol: config.protocol,
		requestedLimit: limit,
	});

	const { relationships, truncated } =
		config.protocol === "rest"
			? await exportRestRelationshipsWithLimit(effectiveLimit)
			: await exportGrpcRelationshipsWithLimit(
					getSpiceDbGrpcClient(),
					effectiveLimit,
				);

	logSpiceDbInfo("relationship export completed", {
		durationMs: Math.round(performance.now() - start),
		effectiveLimit,
		protocol: config.protocol,
		relationshipCount: relationships.length,
		truncated,
	});

	const graph = createRelationshipGraph({
		relationships,
		limit: effectiveLimit,
		truncated,
	});
	logSpiceDbInfo("relationship graph created", {
		durationMs: Math.round(performance.now() - start),
		edgeCount: graph.stats.edgeCount,
		nodeCount: graph.stats.nodeCount,
		protocol: config.protocol,
		relationshipCount: graph.stats.relationshipCount,
	});

	return graph;
}

export type DeleteRelationshipInput = {
	resourceId: string;
	resourceType: string;
	relation: string;
	subjectId: string;
	subjectRelation?: string;
	subjectType: string;
};

function createRelationshipFilter(input: DeleteRelationshipInput) {
	return {
		optionalRelation: input.relation,
		optionalResourceId: input.resourceId,
		optionalSubjectFilter: {
			optionalRelation: input.subjectRelation
				? { relation: input.subjectRelation }
				: undefined,
			optionalSubjectId: input.subjectId,
			subjectType: input.subjectType,
		},
		resourceType: input.resourceType,
	};
}

export async function deleteRelationship(input: DeleteRelationshipInput) {
	const config = getSpiceDbConfig();

	if (config.protocol === "rest") {
		await getSpiceDbRestClient().deleteRelationships({
			relationshipFilter: createRelationshipFilter(input),
		});
		return;
	}

	const client = getSpiceDbGrpcClient();

	await client.promises.deleteRelationships(
		v1.DeleteRelationshipsRequest.create({
			relationshipFilter: v1.RelationshipFilter.create({
				optionalRelation: input.relation,
				optionalResourceId: input.resourceId,
				optionalSubjectFilter: v1.SubjectFilter.create({
					optionalRelation: input.subjectRelation
						? v1.SubjectFilter_RelationFilter.create({
								relation: input.subjectRelation,
							})
						: undefined,
					optionalSubjectId: input.subjectId,
					subjectType: input.subjectType,
				}),
				resourceType: input.resourceType,
			}),
		}),
	);
}

export async function deleteAllRelationships() {
	const config = getSpiceDbConfig();
	const resourceTypes =
		config.protocol === "rest"
			? ((
					(await getSpiceDbRestClient().reflectSchema({
						optionalFilters: [],
					})) as RestReflection
				).definitions?.map((definition) => definition.name) ?? [])
			: (
					await getSpiceDbGrpcClient().promises.reflectSchema(
						v1.ReflectSchemaRequest.create({
							optionalFilters: [],
						}),
					)
				).definitions.map((definition) => definition.name);

	for (const resourceType of resourceTypes) {
		if (config.protocol === "rest") {
			await getSpiceDbRestClient().deleteRelationships({
				relationshipFilter: { resourceType },
			});
			continue;
		}

		await getSpiceDbGrpcClient().promises.deleteRelationships(
			v1.DeleteRelationshipsRequest.create({
				relationshipFilter: v1.RelationshipFilter.create({
					resourceType,
				}),
			}),
		);
	}

	return {
		resourceTypeCount: resourceTypes.length,
	};
}
