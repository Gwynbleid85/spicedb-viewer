import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getCurrentSession } from "#/server/auth/session";
import {
	getRelationshipGraph,
	getSchemaGraph,
} from "#/server/repositories/spicedb.repository";
import { normalizeSpiceDbError } from "#/server/spicedb/client";

const spiceDbGraphInputSchema = z.object({
	mode: z.enum(["schema", "relationships"]),
	limit: z.number().int().min(1).max(10_000).optional(),
});

export const getSpiceDbGraph = createServerFn({ method: "GET" })
	.inputValidator(spiceDbGraphInputSchema)
	.handler(async ({ data }) => {
		const session = await getCurrentSession();

		if (!session) {
			throw new Error("You must be signed in to inspect SpiceDB data.");
		}

		try {
			if (data.mode === "relationships") {
				return getRelationshipGraph(data.limit);
			}

			return getSchemaGraph();
		} catch (error) {
			throw new Error(normalizeSpiceDbError(error));
		}
	});
