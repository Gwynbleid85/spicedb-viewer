import { describe, expect, it } from "vitest";

import {
	createRelationshipGraph,
	createSchemaGraph,
	type SpiceDbGraph,
} from "#/lib/spicedb-graph";

function ids(graph: SpiceDbGraph) {
	return {
		edges: graph.edges.map((edge) => edge.id).sort(),
		nodes: graph.nodes.map((node) => node.id).sort(),
	};
}

describe("createSchemaGraph", () => {
	it("maps reflected definitions as nodes and relations as caveated edges", () => {
		const graph = createSchemaGraph({
			readAt: "zed-token",
			caveats: [
				{
					name: "same_tenant",
					comment: "tenant caveat",
					expression: "tenant_id == request_tenant_id",
					parameters: [
						{
							name: "tenant_id",
							type: "string",
							parentCaveatName: "same_tenant",
						},
					],
				},
			],
			definitions: [
				{
					name: "user",
					comment: "",
					relations: [],
					permissions: [],
				},
				{
					name: "document",
					comment: "documents",
					relations: [
						{
							name: "viewer",
							comment: "viewers",
							parentDefinitionName: "document",
							subjectTypes: [
								{
									subjectDefinitionName: "user",
									optionalCaveatName: "same_tenant",
									typeref: {
										oneofKind: "isTerminalSubject",
										isTerminalSubject: true,
									},
								},
							],
						},
					],
					permissions: [
						{
							name: "read",
							comment: "read docs",
							parentDefinitionName: "document",
						},
					],
				},
			],
			dependencies: [
				{
					permissionDefinitionName: "document",
					permissionName: "read",
					relation: {
						definitionName: "document",
						relationName: "viewer",
						isPermission: false,
					},
				},
			],
		});

		expect(graph.mode).toBe("schema");
		expect(graph.readAt).toBe("zed-token");
		expect(graph.stats).toMatchObject({
			caveatCount: 1,
			definitionCount: 2,
			permissionCount: 1,
			relationCount: 1,
		});
		expect(ids(graph).nodes).toEqual([
			"definition:document",
			"definition:user",
		]);

		const documentNode = graph.nodes.find(
			(node) => node.id === "definition:document",
		);
		expect(documentNode?.metadata).toMatchObject({
			permissions: ["read"],
			permissionDependencies: ["read -> document#viewer"],
			permissionCount: 1,
			relationCount: 1,
			relations: ["viewer"],
		});

		const relationEdge = graph.edges.find(
			(edge) =>
				edge.source === "definition:document" &&
				edge.target === "definition:user",
		);
		expect(relationEdge).toMatchObject({
			label: "viewer [same_tenant]",
			kind: "allows",
			metadata: {
				caveat: "same_tenant",
				caveatExpression: "tenant_id == request_tenant_id",
				caveatParameters: ["tenant_id: string"],
				relation: "viewer",
				sourceDefinition: "document",
				subject: "user",
				subjectDefinition: "user",
			},
		});
	});
});

describe("createRelationshipGraph", () => {
	it("maps concrete relationships to object nodes and labeled edges", () => {
		const graph = createRelationshipGraph({
			limit: 1,
			truncated: true,
			relationships: [
				{
					relation: "viewer",
					resource: {
						objectType: "document",
						objectId: "roadmap",
					},
					subject: {
						object: {
							objectType: "user",
							objectId: "emilia",
						},
						optionalRelation: "",
					},
				},
			],
		});

		expect(graph.mode).toBe("relationships");
		expect(graph.truncated).toBe(true);
		expect(graph.stats.relationshipCount).toBe(1);
		expect(ids(graph).nodes).toEqual([
			"object:document:roadmap",
			"object:user:emilia",
		]);
		expect(graph.edges[0]).toMatchObject({
			source: "object:document:roadmap",
			target: "object:user:emilia",
			label: "viewer",
		});
	});
});
