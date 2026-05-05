import { graphlib, layout } from "@dagrejs/dagre";
import { MarkerType, Position } from "@xyflow/react";

import type { SpiceDbGraph, SpiceDbGraphNode } from "#/lib/spicedb-graph";
import { cn } from "#/lib/utils";
import { getObjectId, getObjectType } from "./spicedb-graph-node-utils";
import {
	componentGap,
	maxLayoutRowWidth,
	nodeCollisionGap,
	nodeColorByKind,
	nodeSizeByKind,
	objectColorScale,
} from "./spicedb-visualizer.constants";
import type { FlowNode, FlowNodeData } from "./spicedb-visualizer.types";

function createObjectColorIndex(nodes: SpiceDbGraphNode[]) {
	const objectTypes = Array.from(
		new Set(
			nodes
				.filter((node) => node.kind === "object")
				.map((node) => getObjectType(node)),
		),
	).sort((first, second) => first.localeCompare(second));

	return new Map(
		objectTypes.map((objectType, index) => [
			objectType,
			objectColorScale[index % objectColorScale.length],
		]),
	);
}

function getNodeColor(
	node: SpiceDbGraphNode,
	objectColorIndex: ReturnType<typeof createObjectColorIndex>,
) {
	if (node.kind !== "object") {
		return nodeColorByKind[node.kind];
	}

	return objectColorIndex.get(getObjectType(node)) ?? nodeColorByKind.object;
}

function nodeOverlaps(
	first: FlowNode,
	second: FlowNode,
	padding = nodeCollisionGap,
) {
	const firstWidth = Number(first.style?.width ?? 0);
	const firstHeight = Number(first.style?.height ?? 0);
	const secondWidth = Number(second.style?.width ?? 0);
	const secondHeight = Number(second.style?.height ?? 0);

	return (
		first.position.x < second.position.x + secondWidth + padding &&
		first.position.x + firstWidth + padding > second.position.x &&
		first.position.y < second.position.y + secondHeight + padding &&
		first.position.y + firstHeight + padding > second.position.y
	);
}

function positionNodesWithoutOverlap(
	nodes: FlowNode[],
	direction: "horizontal" | "vertical",
) {
	const positioned = nodes.map((node) => ({
		...node,
		position: { ...node.position },
	}));

	for (let pass = 0; pass < positioned.length; pass += 1) {
		let changed = false;

		for (let index = 0; index < positioned.length; index += 1) {
			for (
				let compareIndex = index + 1;
				compareIndex < positioned.length;
				compareIndex += 1
			) {
				const first = positioned[index];
				const second = positioned[compareIndex];

				if (!first || !second || !nodeOverlaps(first, second)) {
					continue;
				}

				const firstWidth = Number(first.style?.width ?? 0);
				const firstHeight = Number(first.style?.height ?? 0);
				const secondHeight = Number(second.style?.height ?? 0);

				if (direction === "horizontal") {
					const neededY = first.position.y + firstHeight + nodeCollisionGap;
					second.position.y = Math.max(second.position.y, neededY);
				} else {
					const neededX = first.position.x + firstWidth + nodeCollisionGap;
					second.position.x = Math.max(second.position.x, neededX);

					if (secondHeight > firstHeight) {
						second.position.y = Math.max(
							second.position.y,
							first.position.y - (secondHeight - firstHeight) / 2,
						);
					}
				}

				changed = true;
			}
		}

		if (!changed) {
			break;
		}
	}

	return positioned;
}

function createConnectedComponents(graph: SpiceDbGraph) {
	const nodeIds = new Set(graph.nodes.map((node) => node.id));
	const neighbors = new Map<string, Set<string>>(
		graph.nodes.map((node) => [node.id, new Set<string>()]),
	);

	for (const edge of graph.edges) {
		if (!(nodeIds.has(edge.source) && nodeIds.has(edge.target))) {
			continue;
		}

		neighbors.get(edge.source)?.add(edge.target);
		neighbors.get(edge.target)?.add(edge.source);
	}

	const seen = new Set<string>();
	const components: string[][] = [];

	for (const node of graph.nodes) {
		if (seen.has(node.id)) {
			continue;
		}

		const component: string[] = [];
		const pending = [node.id];
		seen.add(node.id);

		while (pending.length > 0) {
			const id = pending.pop();

			if (!id) {
				continue;
			}

			component.push(id);

			for (const neighbor of neighbors.get(id) ?? []) {
				if (!seen.has(neighbor)) {
					seen.add(neighbor);
					pending.push(neighbor);
				}
			}
		}

		components.push(component);
	}

	return components;
}

function getLayoutSortKey(node: SpiceDbGraphNode) {
	if (node.kind === "object") {
		return `${getObjectType(node)}:${getObjectId(node)}`;
	}

	return `${node.kind}:${node.label}`;
}

function sortComponentIds(
	componentIds: string[],
	graphNodeById: Map<string, SpiceDbGraphNode>,
	graph: SpiceDbGraph,
) {
	const degreeById = new Map(componentIds.map((id) => [id, 0]));

	for (const edge of graph.edges) {
		if (degreeById.has(edge.source)) {
			degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
		}

		if (degreeById.has(edge.target)) {
			degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
		}
	}

	return [...componentIds].sort((firstId, secondId) => {
		const degreeDelta =
			(degreeById.get(secondId) ?? 0) - (degreeById.get(firstId) ?? 0);

		if (degreeDelta !== 0) {
			return degreeDelta;
		}

		const firstNode = graphNodeById.get(firstId);
		const secondNode = graphNodeById.get(secondId);

		return getLayoutSortKey(
			firstNode ??
				({
					id: firstId,
					kind: "definition",
					label: firstId,
					metadata: {},
				} satisfies SpiceDbGraphNode),
		).localeCompare(
			getLayoutSortKey(
				secondNode ??
					({
						id: secondId,
						kind: "definition",
						label: secondId,
						metadata: {},
					} satisfies SpiceDbGraphNode),
			),
		);
	});
}

function getNodeBounds(nodes: FlowNode[]) {
	return nodes.reduce(
		(bounds, node) => {
			const width = Number(node.style?.width ?? 0);
			const height = Number(node.style?.height ?? 0);

			return {
				maxX: Math.max(bounds.maxX, node.position.x + width),
				maxY: Math.max(bounds.maxY, node.position.y + height),
				minX: Math.min(bounds.minX, node.position.x),
				minY: Math.min(bounds.minY, node.position.y),
			};
		},
		{ maxX: -Infinity, maxY: -Infinity, minX: Infinity, minY: Infinity },
	);
}

function packLayoutComponents(components: FlowNode[][]) {
	let cursorX = 0;
	let cursorY = 0;
	let rowHeight = 0;

	return components.flatMap((component) => {
		const bounds = getNodeBounds(component);
		const width = bounds.maxX - bounds.minX;
		const height = bounds.maxY - bounds.minY;

		if (cursorX > 0 && cursorX + width > maxLayoutRowWidth) {
			cursorX = 0;
			cursorY += rowHeight + componentGap;
			rowHeight = 0;
		}

		const offsetX = cursorX - bounds.minX;
		const offsetY = cursorY - bounds.minY;
		cursorX += width + componentGap;
		rowHeight = Math.max(rowHeight, height);

		return component.map((node) => ({
			...node,
			position: {
				x: node.position.x + offsetX,
				y: node.position.y + offsetY,
			},
		}));
	});
}

export function layoutGraph(
	graph: SpiceDbGraph,
	onSelect: FlowNodeData["onSelect"],
	searchMatches = new Set<string>(),
	searchActive = searchMatches.size > 0,
) {
	const layoutDirection = graph.mode === "schema" ? "horizontal" : "vertical";
	const rankdir = graph.mode === "schema" ? "LR" : "TB";
	const objectColorIndex = createObjectColorIndex(graph.nodes);
	const graphNodeById = new Map(graph.nodes.map((node) => [node.id, node]));
	const sourcePosition =
		layoutDirection === "horizontal" ? Position.Right : Position.Bottom;
	const targetPosition =
		layoutDirection === "horizontal" ? Position.Left : Position.Top;

	const components = createConnectedComponents(graph).map((componentIds) => {
		const orderedComponentIds = sortComponentIds(
			componentIds,
			graphNodeById,
			graph,
		);
		const componentIdSet = new Set(orderedComponentIds);
		const dagre = new graphlib.Graph().setDefaultEdgeLabel(() => ({}));
		dagre.setGraph({
			acyclicer: "greedy",
			edgesep: 48,
			nodesep: 112,
			ranker: "network-simplex",
			rankdir,
			ranksep: 168,
		});

		for (const id of orderedComponentIds) {
			const node = graphNodeById.get(id);

			if (!node) {
				continue;
			}

			dagre.setNode(id, nodeSizeByKind[node.kind]);
		}

		for (const edge of graph.edges) {
			if (componentIdSet.has(edge.source) && componentIdSet.has(edge.target)) {
				dagre.setEdge(edge.source, edge.target, {
					minlen: edge.kind === "relationship" ? 2 : 1,
					weight: edge.kind === "relationship" ? 2 : 1,
				});
			}
		}

		layout(dagre);

		const nodes: FlowNode[] = orderedComponentIds.flatMap((id) => {
			const node = graphNodeById.get(id);

			if (!node) {
				return [];
			}

			const size = nodeSizeByKind[node.kind];
			const positioned = dagre.node(id) as { x: number; y: number } | undefined;

			return {
				id: node.id,
				type: "spicedb",
				sourcePosition,
				targetPosition,
				position: {
					x: (positioned?.x ?? 0) - size.width / 2,
					y: (positioned?.y ?? 0) - size.height / 2,
				},
				style: {
					height: size.height,
					width: size.width,
				},
				data: {
					...node,
					color: getNodeColor(node, objectColorIndex),
					onSelect,
					searchActive,
					searchMatched: searchMatches.has(node.id),
				},
			};
		});

		return positionNodesWithoutOverlap(nodes, layoutDirection);
	});

	const edges = graph.edges.map((edge) => {
		const edgeMatched =
			searchMatches.has(edge.source) || searchMatches.has(edge.target);

		return {
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
			type: "straight",
			markerEnd: {
				type: MarkerType.ArrowClosed,
			},
			data: edge,
			className: cn(
				"text-text-caption transition-opacity",
				searchActive && !edgeMatched && "opacity-20",
			),
		};
	});

	return {
		nodes: packLayoutComponents(components),
		edges,
	};
}
