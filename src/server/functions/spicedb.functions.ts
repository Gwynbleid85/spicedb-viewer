import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	deleteAllRelationships,
	deleteRelationship,
	getRelationshipGraph,
	getSchemaGraph,
} from "#/server/repositories/spicedb.repository";
import {
	logSpiceDbError,
	logSpiceDbInfo,
	normalizeSpiceDbError,
} from "#/server/spicedb/client";

const spiceDbGraphInputSchema = z.object({
	mode: z.enum(["schema", "relationships"]),
	limit: z.number().int().min(1).max(10_000).optional(),
});

const deleteRelationshipInputSchema = z.object({
	resourceId: z.string().min(1),
	resourceType: z.string().min(1),
	relation: z.string().min(1),
	subjectId: z.string().min(1),
	subjectRelation: z.string().min(1).optional(),
	subjectType: z.string().min(1),
});

const deleteSelectedRelationshipsInputSchema = z.object({
	relationships: z.array(deleteRelationshipInputSchema).min(1).max(100),
});

export const getSpiceDbGraph = createServerFn({ method: "GET" })
	.inputValidator(spiceDbGraphInputSchema)
	.handler(async ({ data }) => {
		const start = performance.now();

		logSpiceDbInfo("operation started", {
			limit: data.limit,
			mode: data.mode,
			operation: "load graph",
		});

		try {
			const graph =
				data.mode === "relationships"
					? await getRelationshipGraph(data.limit)
					: await getSchemaGraph();

			logSpiceDbInfo("operation completed", {
				durationMs: Math.round(performance.now() - start),
				edgeCount: graph.stats.edgeCount,
				limit: graph.limit,
				mode: data.mode,
				nodeCount: graph.stats.nodeCount,
				operation: "load graph",
				readAt: graph.readAt,
				relationshipCount: graph.stats.relationshipCount,
				truncated: graph.truncated,
			});

			return graph;
		} catch (error) {
			logSpiceDbError("load graph", error, {
				durationMs: Math.round(performance.now() - start),
				limit: data.limit,
				mode: data.mode,
			});
			throw new Error(normalizeSpiceDbError(error));
		}
	});

export const deleteSpiceDbRelationship = createServerFn({ method: "POST" })
	.inputValidator(deleteRelationshipInputSchema)
	.handler(async ({ data }) => {
		const start = performance.now();

		try {
			await deleteRelationship(data);
			logSpiceDbInfo("operation completed", {
				durationMs: Math.round(performance.now() - start),
				operation: "delete relationship",
				relation: data.relation,
				resourceType: data.resourceType,
				subjectType: data.subjectType,
			});
			return { deleted: true };
		} catch (error) {
			logSpiceDbError("delete relationship", error, {
				durationMs: Math.round(performance.now() - start),
				relation: data.relation,
				resourceId: data.resourceId,
				resourceType: data.resourceType,
				subjectId: data.subjectId,
				subjectRelation: data.subjectRelation,
				subjectType: data.subjectType,
			});
			throw new Error(normalizeSpiceDbError(error));
		}
	});

export const deleteSpiceDbSelectedRelationships = createServerFn({
	method: "POST",
})
	.inputValidator(deleteSelectedRelationshipsInputSchema)
	.handler(async ({ data }) => {
		const start = performance.now();

		try {
			for (const relationship of data.relationships) {
				await deleteRelationship(relationship);
			}

			logSpiceDbInfo("operation completed", {
				durationMs: Math.round(performance.now() - start),
				operation: "delete selected relationships",
				relationshipCount: data.relationships.length,
			});

			return { deletedCount: data.relationships.length };
		} catch (error) {
			logSpiceDbError("delete selected relationships", error, {
				durationMs: Math.round(performance.now() - start),
				relationshipCount: data.relationships.length,
			});
			throw new Error(normalizeSpiceDbError(error));
		}
	});

export const deleteSpiceDbRelationships = createServerFn({ method: "POST" })
	.inputValidator(z.object({}))
	.handler(async () => {
		const start = performance.now();

		try {
			const result = await deleteAllRelationships();
			logSpiceDbInfo("operation completed", {
				durationMs: Math.round(performance.now() - start),
				operation: "delete all relationships",
				resourceTypeCount: result.resourceTypeCount,
			});
			return result;
		} catch (error) {
			logSpiceDbError("delete all relationships", error, {
				durationMs: Math.round(performance.now() - start),
			});
			throw new Error(normalizeSpiceDbError(error));
		}
	});
