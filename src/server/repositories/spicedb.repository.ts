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
			const response = await client.promises.dependentRelations(
				v1.DependentRelationsRequest.create({
					definitionName: definition.name,
					permissionName: permission.name,
				}),
			);

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
			const response = (await client.dependentRelations({
				definitionName: definition.name,
				permissionName: permission.name,
			})) as { relations?: SchemaDependency["relation"][] };

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

	if (config.protocol === "rest") {
		const reflection = (await getSpiceDbRestClient().reflectSchema({
			optionalFilters: [],
		})) as RestReflection;
		const dependencies = await readRestSchemaDependencies(reflection);

		return createSchemaGraph({
			definitions: reflection.definitions ?? [],
			caveats: reflection.caveats ?? [],
			dependencies,
			readAt: reflection.readAt?.token,
		});
	}

	const client = getSpiceDbGrpcClient();
	const reflection = await client.promises.reflectSchema(
		v1.ReflectSchemaRequest.create({
			optionalFilters: [],
		}),
	);
	const dependencies = await readGrpcSchemaDependencies(client, reflection);

	return createSchemaGraph({
		definitions: reflection.definitions,
		caveats: reflection.caveats,
		dependencies,
		readAt: reflection.readAt?.token,
	});
}

export async function getRelationshipGraph(
	limit?: number,
): Promise<SpiceDbGraph> {
	const config = getSpiceDbConfig();
	const configuredLimit = config.relationshipExportLimit;
	const effectiveLimit = Math.min(limit ?? configuredLimit, configuredLimit);
	const { relationships, truncated } =
		config.protocol === "rest"
			? await exportRestRelationshipsWithLimit(effectiveLimit)
			: await exportGrpcRelationshipsWithLimit(
					getSpiceDbGrpcClient(),
					effectiveLimit,
				);

	return createRelationshipGraph({
		relationships,
		limit: effectiveLimit,
		truncated,
	});
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
