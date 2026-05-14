import { describe, expect, it } from "vitest";

import {
	layoutGraph,
	matchesNodeSearch,
} from "#/components/spicedb/spicedb-visualizer";
import type { SpiceDbGraph } from "#/lib/spicedb-graph";

function createRelationshipNode(index: number) {
	return createObjectNode("document", String(index));
}

function createObjectNode(objectType: string, objectId: string) {
	return {
		id: `object:${objectType}:${objectId}`,
		kind: "object" as const,
		label: `${objectType}:${objectId}`,
		metadata: {
			objectId,
			objectType,
		},
	};
}

function createSchemaNode(name: string) {
	return {
		id: `definition:${name}`,
		kind: "definition" as const,
		label: name,
		metadata: {
			permissionCount: 0,
			permissions: [],
			relationCount: 0,
			relations: [],
		},
	};
}

function createGraphStats(graph: Pick<SpiceDbGraph, "edges" | "nodes">) {
	return {
		caveatCount: 0,
		definitionCount: graph.nodes.filter((node) => node.kind === "definition")
			.length,
		edgeCount: graph.edges.length,
		nodeCount: graph.nodes.length,
		permissionCount: 0,
		relationCount: 0,
		relationshipCount: graph.edges.filter(
			(edge) => edge.kind === "relationship",
		).length,
	};
}

function nodeRight(node: ReturnType<typeof layoutGraph>["nodes"][number]) {
	return node.position.x + Number(node.style?.width ?? 0);
}

function nodeBottom(node: ReturnType<typeof layoutGraph>["nodes"][number]) {
	return node.position.y + Number(node.style?.height ?? 0);
}

function nodesOverlap(
	first: ReturnType<typeof layoutGraph>["nodes"][number],
	second: ReturnType<typeof layoutGraph>["nodes"][number],
) {
	return (
		first.position.x < nodeRight(second) &&
		nodeRight(first) > second.position.x &&
		first.position.y < nodeBottom(second) &&
		nodeBottom(first) > second.position.y
	);
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

	it("returns deterministic positions for the same graph", () => {
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
				{
					id: "relationship:document:1:editor:user:anne",
					kind: "relationship",
					label: "editor",
					metadata: {},
					source: "object:document:1",
					target: "object:user:anne",
				},
			],
			mode: "relationships",
			nodes: [
				createRelationshipNode(1),
				{
					id: "object:user:tom",
					kind: "object",
					label: "user:tom",
					metadata: { objectId: "tom", objectType: "user" },
				},
				{
					id: "object:user:anne",
					kind: "object",
					label: "user:anne",
					metadata: { objectId: "anne", objectType: "user" },
				},
			],
			stats: {
				caveatCount: 0,
				definitionCount: 0,
				edgeCount: 2,
				nodeCount: 3,
				permissionCount: 0,
				relationCount: 0,
				relationshipCount: 2,
			},
			truncated: false,
		};

		const first = layoutGraph(graph, () => undefined);
		const second = layoutGraph(graph, () => undefined);

		expect(first.nodes.map((node) => node.position)).toEqual(
			second.nodes.map((node) => node.position),
		);
	});

	it("separates nodes in a dense component", () => {
		const nodes = Array.from({ length: 6 }, (_, index) =>
			createRelationshipNode(index),
		);
		const edges = nodes.flatMap((source, sourceIndex) =>
			nodes.slice(sourceIndex + 1).map((target) => ({
				id: `relationship:${source.id}:viewer:${target.id}`,
				kind: "relationship" as const,
				label: "viewer",
				metadata: {},
				source: source.id,
				target: target.id,
			})),
		);
		const graph: SpiceDbGraph = {
			edges,
			mode: "relationships",
			nodes,
			stats: createGraphStats({ edges, nodes }),
			truncated: false,
		};
		const flow = layoutGraph(graph, () => undefined);

		for (let index = 0; index < flow.nodes.length; index += 1) {
			const first = flow.nodes[index];

			if (!first) {
				continue;
			}

			for (
				let compareIndex = index + 1;
				compareIndex < flow.nodes.length;
				compareIndex += 1
			) {
				const second = flow.nodes[compareIndex];

				if (!second) {
					continue;
				}

				expect(nodesOverlap(first, second)).toBe(false);
			}
		}
	});

	it("keeps relationship hierarchy leaves below and near their parents", () => {
		const nodes = [
			createObjectNode("broker_pool", "root"),
			createObjectNode("broker", "left"),
			createObjectNode("broker", "right"),
			createObjectNode("identity_object", "left-leaf"),
			createObjectNode("identity_object", "right-leaf"),
		];
		const edges = [
			{
				id: "relationship:root:broker:left",
				kind: "relationship" as const,
				label: "broker",
				metadata: {},
				source: "object:broker_pool:root",
				target: "object:broker:left",
			},
			{
				id: "relationship:root:broker:right",
				kind: "relationship" as const,
				label: "broker",
				metadata: {},
				source: "object:broker_pool:root",
				target: "object:broker:right",
			},
			{
				id: "relationship:left:identity:left-leaf",
				kind: "relationship" as const,
				label: "identity",
				metadata: {},
				source: "object:broker:left",
				target: "object:identity_object:left-leaf",
			},
			{
				id: "relationship:right:identity:right-leaf",
				kind: "relationship" as const,
				label: "identity",
				metadata: {},
				source: "object:broker:right",
				target: "object:identity_object:right-leaf",
			},
		];
		const graph: SpiceDbGraph = {
			edges,
			mode: "relationships",
			nodes,
			stats: createGraphStats({ edges, nodes }),
			truncated: false,
		};
		const flow = layoutGraph(graph, () => undefined);
		const nodeById = new Map(flow.nodes.map((node) => [node.id, node]));
		const root = nodeById.get("object:broker_pool:root");
		const left = nodeById.get("object:broker:left");
		const right = nodeById.get("object:broker:right");
		const leftLeaf = nodeById.get("object:identity_object:left-leaf");
		const rightLeaf = nodeById.get("object:identity_object:right-leaf");

		if (!root || !left || !right || !leftLeaf || !rightLeaf) {
			throw new Error(
				"Expected all relationship hierarchy nodes to be positioned",
			);
		}

		expect(root.position.y).toBeLessThan(left.position.y);
		expect(root.position.y).toBeLessThan(right.position.y);
		expect(left.position.y).toBeLessThan(leftLeaf.position.y);
		expect(right.position.y).toBeLessThan(rightLeaf.position.y);
		expect(left.position.x).toBeLessThan(right.position.x);
		expect(leftLeaf.position.x).toBeLessThan(rightLeaf.position.x);
	});

	it("keeps schema dependencies ordered left to right", () => {
		const nodes = [
			createSchemaNode("A"),
			createSchemaNode("B"),
			createSchemaNode("C"),
		];
		const edges = [
			{
				id: "allows:definition:A:definition:B:view",
				kind: "allows" as const,
				label: "view",
				metadata: {},
				source: "definition:A",
				target: "definition:B",
			},
			{
				id: "allows:definition:B:definition:C:view",
				kind: "allows" as const,
				label: "view",
				metadata: {},
				source: "definition:B",
				target: "definition:C",
			},
		];
		const graph: SpiceDbGraph = {
			edges,
			mode: "schema",
			nodes,
			stats: createGraphStats({ edges, nodes }),
			truncated: false,
		};
		const flow = layoutGraph(graph, () => undefined);
		const nodeById = new Map(flow.nodes.map((node) => [node.id, node]));
		const nodeA = nodeById.get("definition:A");
		const nodeB = nodeById.get("definition:B");
		const nodeC = nodeById.get("definition:C");

		if (!nodeA || !nodeB || !nodeC) {
			throw new Error("Expected all schema nodes to be positioned");
		}

		expect(nodeA.position.x).toBeLessThan(nodeB.position.x);
		expect(nodeB.position.x).toBeLessThan(nodeC.position.x);
	});

	it("orders schema lanes to avoid crossing parallel edges", () => {
		const nodes = [
			createSchemaNode("A1"),
			createSchemaNode("A2"),
			createSchemaNode("B1"),
			createSchemaNode("B2"),
		];
		const edges = [
			{
				id: "allows:definition:A1:definition:B2:view",
				kind: "allows" as const,
				label: "view",
				metadata: {},
				source: "definition:A1",
				target: "definition:B2",
			},
			{
				id: "allows:definition:A2:definition:B1:view",
				kind: "allows" as const,
				label: "view",
				metadata: {},
				source: "definition:A2",
				target: "definition:B1",
			},
			{
				id: "allows:definition:A1:definition:B1:edit",
				kind: "allows" as const,
				label: "edit",
				metadata: {},
				source: "definition:A1",
				target: "definition:B1",
			},
		];
		const graph: SpiceDbGraph = {
			edges,
			mode: "schema",
			nodes,
			stats: createGraphStats({ edges, nodes }),
			truncated: false,
		};
		const flow = layoutGraph(graph, () => undefined);
		const nodeById = new Map(flow.nodes.map((node) => [node.id, node]));
		const nodeA1 = nodeById.get("definition:A1");
		const nodeA2 = nodeById.get("definition:A2");
		const nodeB1 = nodeById.get("definition:B1");
		const nodeB2 = nodeById.get("definition:B2");

		if (!nodeA1 || !nodeA2 || !nodeB1 || !nodeB2) {
			throw new Error("Expected all schema lane nodes to be positioned");
		}

		expect(nodeA1.position.y).toBeLessThan(nodeA2.position.y);
		expect(nodeB2.position.y).toBeLessThan(nodeB1.position.y);
	});
});
