import { describe, expect, it } from "vitest";

import {
	layoutGraph,
	matchesNodeSearch,
} from "#/components/spicedb/spicedb-visualizer";
import type { SpiceDbGraph } from "#/lib/spicedb-graph";

function createRelationshipNode(index: number) {
	return {
		id: `object:document:${index}`,
		kind: "object" as const,
		label: `document:${index}`,
		metadata: {
			objectId: String(index),
			objectType: "document",
		},
	};
}

describe("matchesNodeSearch", () => {
	it("matches direct substrings in node metadata", () => {
		expect(
			matchesNodeSearch(
				{
					...createRelationshipNode(1),
					metadata: {
						objectId: "asdf-test-asdf",
						objectType: "document",
					},
				},
				"test",
			),
		).toBe(true);
	});

	it("does not fuzzy match non-contiguous characters", () => {
		expect(
			matchesNodeSearch(
				{
					...createRelationshipNode(1),
					metadata: {
						objectId: "t-e-s-t",
						objectType: "document",
					},
				},
				"test",
			),
		).toBe(false);
	});

	it("keeps separators significant for multi-part searches", () => {
		expect(
			matchesNodeSearch(
				{
					...createRelationshipNode(1),
					label:
						"broker:test-tenant-k-six-a_019d2a01-a009-7009-8009-a00000000009",
				},
				"test-tenant-a",
			),
		).toBe(false);
	});

	it("requires every search term to match", () => {
		expect(
			matchesNodeSearch(createRelationshipNode(1), "document missing"),
		).toBe(false);
	});
});

describe("layoutGraph", () => {
	it("keeps graph edges as straight lines", () => {
		const graph: SpiceDbGraph = {
			edges: [
				{
					id: "relationship:document:1:viewer:user:tom",
					kind: "relationship",
					label: "viewer",
					metadata: {},
					source: "object:document:1",
					target: "object:user:tom",
				},
			],
			mode: "relationships",
			nodes: [
				createRelationshipNode(1),
				{
					id: "object:user:tom",
					kind: "object",
					label: "user:tom",
					metadata: {
						objectId: "tom",
						objectType: "user",
					},
				},
			],
			stats: {
				caveatCount: 0,
				definitionCount: 0,
				edgeCount: 1,
				nodeCount: 2,
				permissionCount: 0,
				relationCount: 0,
				relationshipCount: 1,
			},
			truncated: false,
		};

		const flow = layoutGraph(
			graph,
			() => undefined,
			new Set(["object:document:1"]),
		);

		expect(flow.edges[0]?.type).toBe("straight");
		expect(flow.nodes[0]?.data.searchMatched).toBe(true);
	});

	it("packs disconnected relationship nodes into multiple rows", () => {
		const graph: SpiceDbGraph = {
			edges: [],
			mode: "relationships",
			nodes: Array.from({ length: 8 }, (_, index) =>
				createRelationshipNode(index),
			),
			stats: {
				caveatCount: 0,
				definitionCount: 0,
				edgeCount: 0,
				nodeCount: 8,
				permissionCount: 0,
				relationCount: 0,
				relationshipCount: 0,
			},
			truncated: false,
		};

		const flow = layoutGraph(graph, () => undefined);
		const rows = new Set(flow.nodes.map((node) => node.position.y));
		const maxX = Math.max(...flow.nodes.map((node) => node.position.x));

		expect(rows.size).toBeGreaterThan(1);
		expect(maxX).toBeLessThan(1200);
	});
});
