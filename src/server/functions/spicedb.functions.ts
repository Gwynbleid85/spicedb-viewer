import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	deleteAllRelationships,
	deleteRelationship,
	getRelationshipGraph,
	getSchemaGraph,
} from "#/server/repositories/spicedb.repository";
import { normalizeSpiceDbError } from "#/server/spicedb/client";

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

export const getSpiceDbGraph = createServerFn({ method: "GET" })
	.inputValidator(spiceDbGraphInputSchema)
	.handler(async ({ data }) => {
		try {
			if (data.mode === "relationships") {
				return getRelationshipGraph(data.limit);
			}

			return getSchemaGraph();
		} catch (error) {
			throw new Error(normalizeSpiceDbError(error));
		}
	});

export const deleteSpiceDbRelationship = createServerFn({ method: "POST" })
	.inputValidator(deleteRelationshipInputSchema)
	.handler(async ({ data }) => {
		try {
			await deleteRelationship(data);
			return { deleted: true };
		} catch (error) {
			throw new Error(normalizeSpiceDbError(error));
		}
	});

export const deleteSpiceDbRelationships = createServerFn({ method: "POST" })
	.inputValidator(z.object({}))
	.handler(async () => {
		try {
			return deleteAllRelationships();
		} catch (error) {
			throw new Error(normalizeSpiceDbError(error));
		}
	});
