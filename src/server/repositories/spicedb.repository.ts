import { v1 } from "@authzed/authzed-node";

import {
	createRelationshipGraph,
	createSchemaGraph,
	type SpiceDbGraph,
} from "#/lib/spicedb-graph";
import { getSpiceDbClient, getSpiceDbConfig } from "#/server/spicedb/client";

async function readSchemaDependencies(
	client: v1.ZedClientInterface,
	reflection: v1.ReflectSchemaResponse,
) {
	const dependencies: Array<{
		permissionDefinitionName: string;
		permissionName: string;
		relation: v1.ReflectionRelationReference;
	}> = [];

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

async function exportRelationshipsWithLimit(
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

export async function getSchemaGraph(): Promise<SpiceDbGraph> {
	const client = getSpiceDbClient();
	const reflection = await client.promises.reflectSchema(
		v1.ReflectSchemaRequest.create({
			optionalFilters: [],
		}),
	);
	const dependencies = await readSchemaDependencies(client, reflection);

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
	const client = getSpiceDbClient();
	const configuredLimit = getSpiceDbConfig().relationshipExportLimit;
	const effectiveLimit = Math.min(limit ?? configuredLimit, configuredLimit);
	const { relationships, truncated } = await exportRelationshipsWithLimit(
		client,
		effectiveLimit,
	);

	return createRelationshipGraph({
		relationships,
		limit: effectiveLimit,
		truncated,
	});
}
