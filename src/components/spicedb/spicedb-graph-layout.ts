import { MarkerType, Position } from "@xyflow/react";
import {
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type SimulationLinkDatum,
	type SimulationNodeDatum,
} from "d3-force";

import type {
	SpiceDbGraph,
	SpiceDbGraphEdge,
	SpiceDbGraphNode,
} from "#/lib/spicedb-graph";
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

type ForceLayoutNode = SimulationNodeDatum & {
	id: string;
	graphNode: SpiceDbGraphNode;
	height: number;
	targetX: number;
	targetY: number;
	width: number;
};

type ForceLayoutLink = SimulationLinkDatum<ForceLayoutNode> & {
	kind: SpiceDbGraphEdge["kind"];
	source: string;
	target: string;
};

type ForceLayoutTargets = Map<string, { x: number; y: number }>;

const schemaRankSpacing = 300;
const schemaNodeSpacing = 130;
const relationshipGroupSpacing = 180;
const relationshipNodeSpacing = 260;
const relationshipGroupColumns = 4;
const forceTickCount = 300;
const crossingReductionPasses = 8;

function createPositionIndex(layers: string[][]) {
	const positionById = new Map<string, number>();

	layers.forEach((ids) => {
		ids.forEach((id, index) => {
			positionById.set(id, index);
		});
	});

	return positionById;
}

function getAverageNeighborPosition(
	id: string,
	neighborById: Map<string, string[]>,
	positionById: Map<string, number>,
) {
	const positions = (neighborById.get(id) ?? []).flatMap((neighborId) => {
		const position = positionById.get(neighborId);
		return position === undefined ? [] : [position];
	});

	if (positions.length === 0) {
		return undefined;
	}

	return (
		positions.reduce((total, position) => total + position, 0) /
		positions.length
	);
}

function sortLayerByNeighborPosition(
	ids: string[],
	neighborById: Map<string, string[]>,
	positionById: Map<string, number>,
	originalIndexById: Map<string, number>,
) {
	return [...ids].sort((firstId, secondId) => {
		const firstAverage = getAverageNeighborPosition(
			firstId,
			neighborById,
			positionById,
		);
		const secondAverage = getAverageNeighborPosition(
			secondId,
			neighborById,
			positionById,
		);

		if (firstAverage !== undefined && secondAverage !== undefined) {
			const averageDelta = firstAverage - secondAverage;

			if (averageDelta !== 0) {
				return averageDelta;
			}
		}

		if (firstAverage !== undefined) {
			return -1;
		}

		if (secondAverage !== undefined) {
			return 1;
		}

		return (
			(originalIndexById.get(firstId) ?? 0) -
			(originalIndexById.get(secondId) ?? 0)
		);
	});
}

function reduceDirectedLayerCrossings(
	layers: string[][],
	componentEdges: SpiceDbGraphEdge[],
	originalIndexById: Map<string, number>,
) {
	const incomingById = new Map<string, string[]>();
	const outgoingById = new Map<string, string[]>();

	for (const edge of componentEdges) {
		incomingById.set(edge.target, [
			...(incomingById.get(edge.target) ?? []),
			edge.source,
		]);
		outgoingById.set(edge.source, [
			...(outgoingById.get(edge.source) ?? []),
			edge.target,
		]);
	}

	const orderedLayers = layers.map((ids) => [...ids]);

	for (let pass = 0; pass < crossingReductionPasses; pass += 1) {
		let positionById = createPositionIndex(orderedLayers);

		for (
			let layerIndex = 1;
			layerIndex < orderedLayers.length;
			layerIndex += 1
		) {
			orderedLayers[layerIndex] = sortLayerByNeighborPosition(
				orderedLayers[layerIndex] ?? [],
				incomingById,
				positionById,
				originalIndexById,
			);
			positionById = createPositionIndex(orderedLayers);
		}

		for (
			let layerIndex = orderedLayers.length - 2;
			layerIndex >= 0;
			layerIndex -= 1
		) {
			orderedLayers[layerIndex] = sortLayerByNeighborPosition(
				orderedLayers[layerIndex] ?? [],
				outgoingById,
				positionById,
				originalIndexById,
			);
			positionById = createPositionIndex(orderedLayers);
		}
	}

	return orderedLayers;
}

function createSchemaForceLayoutTargets(
	orderedComponentIds: string[],
	componentEdges: SpiceDbGraphEdge[],
) {
	const componentIdSet = new Set(orderedComponentIds);
	const indegreeById = new Map(orderedComponentIds.map((id) => [id, 0]));
	const outgoingById = new Map(
		orderedComponentIds.map((id) => [id, [] as string[]]),
	);

	for (const edge of componentEdges) {
		if (
			edge.source === edge.target ||
			!(componentIdSet.has(edge.source) && componentIdSet.has(edge.target))
		) {
			continue;
		}

		outgoingById.get(edge.source)?.push(edge.target);
		indegreeById.set(edge.target, (indegreeById.get(edge.target) ?? 0) + 1);
	}

	for (const targets of outgoingById.values()) {
		targets.sort(
			(first, second) =>
				orderedComponentIds.indexOf(first) -
				orderedComponentIds.indexOf(second),
		);
	}

	const depthById = new Map<string, number>();
	const queue = orderedComponentIds.filter((id) => indegreeById.get(id) === 0);

	for (const id of queue) {
		depthById.set(id, 0);
	}

	while (queue.length > 0) {
		const id = queue.shift();

		if (!id) {
			continue;
		}

		const nextDepth = (depthById.get(id) ?? 0) + 1;

		for (const target of outgoingById.get(id) ?? []) {
			if (!depthById.has(target)) {
				depthById.set(target, nextDepth);
				queue.push(target);
			}
		}
	}

	let fallbackDepth = Math.max(0, ...depthById.values());

	for (const id of orderedComponentIds) {
		if (!depthById.has(id)) {
			depthById.set(id, fallbackDepth);
			fallbackDepth += 1;
		}
	}

	const idsByDepth = new Map<number, string[]>();

	for (const id of orderedComponentIds) {
		const depth = depthById.get(id) ?? 0;
		idsByDepth.set(depth, [...(idsByDepth.get(depth) ?? []), id]);
	}

	const originalIndexById = new Map(
		orderedComponentIds.map((id, index) => [id, index]),
	);
	const depths = Array.from(idsByDepth.keys()).sort(
		(first, second) => first - second,
	);
	const layers = depths.map((depth) => idsByDepth.get(depth) ?? []);
	const orderedLayers = reduceDirectedLayerCrossings(
		layers,
		componentEdges,
		originalIndexById,
	);
	const targets: ForceLayoutTargets = new Map();

	orderedLayers.forEach((ids, depthIndex) => {
		ids.forEach((id, index) => {
			targets.set(id, {
				x: (depths[depthIndex] ?? depthIndex) * schemaRankSpacing,
				y: index * schemaNodeSpacing,
			});
		});
	});

	return targets;
}

function createRelationshipForceLayoutTargets(
	orderedComponentIds: string[],
	_graphNodeById: Map<string, SpiceDbGraphNode>,
	componentEdges: SpiceDbGraphEdge[],
) {
	const componentIdSet = new Set(orderedComponentIds);
	const indegreeById = new Map(orderedComponentIds.map((id) => [id, 0]));
	const outgoingById = new Map(
		orderedComponentIds.map((id) => [id, [] as string[]]),
	);

	for (const edge of componentEdges) {
		if (
			edge.source === edge.target ||
			!(componentIdSet.has(edge.source) && componentIdSet.has(edge.target))
		) {
			continue;
		}

		outgoingById.get(edge.source)?.push(edge.target);
		indegreeById.set(edge.target, (indegreeById.get(edge.target) ?? 0) + 1);
	}

	const depthById = new Map<string, number>();
	const queue = orderedComponentIds.filter((id) => indegreeById.get(id) === 0);

	for (const id of queue) {
		depthById.set(id, 0);
	}

	while (queue.length > 0) {
		const id = queue.shift();

		if (!id) {
			continue;
		}

		const nextDepth = (depthById.get(id) ?? 0) + 1;

		for (const target of outgoingById.get(id) ?? []) {
			if (!depthById.has(target)) {
				depthById.set(target, nextDepth);
				queue.push(target);
			}
		}
	}

	let fallbackDepth = Math.max(0, ...depthById.values());

	for (const id of orderedComponentIds) {
		if (!depthById.has(id)) {
			depthById.set(id, fallbackDepth);
			fallbackDepth += 1;
		}
	}

	const idsByDepth = new Map<number, string[]>();

	for (const id of orderedComponentIds) {
		const depth = depthById.get(id) ?? 0;
		idsByDepth.set(depth, [...(idsByDepth.get(depth) ?? []), id]);
	}

	const originalIndexById = new Map(
		orderedComponentIds.map((id, index) => [id, index]),
	);
	const depths = Array.from(idsByDepth.keys()).sort(
		(first, second) => first - second,
	);
	const layers = depths.map((depth) => idsByDepth.get(depth) ?? []);
	const orderedLayers = reduceDirectedLayerCrossings(
		layers,
		componentEdges,
		originalIndexById,
	);
	const widestLayerSize = Math.max(
		1,
		...orderedLayers.map((ids) => ids.length),
	);
	const targets: ForceLayoutTargets = new Map();

	orderedLayers.forEach((ids, depthIndex) => {
		const centeredLayerOffset =
			((widestLayerSize - ids.length) * relationshipNodeSpacing) / 2;

		ids.forEach((id, index) => {
			targets.set(id, {
				x: centeredLayerOffset + index * relationshipNodeSpacing,
				y: (depths[depthIndex] ?? depthIndex) * relationshipGroupSpacing,
			});
		});
	});

	return targets;
}

function createForceLayoutTargets(
	graph: SpiceDbGraph,
	orderedComponentIds: string[],
	graphNodeById: Map<string, SpiceDbGraphNode>,
	componentEdges: SpiceDbGraphEdge[],
) {
	if (graph.mode === "schema") {
		return createSchemaForceLayoutTargets(orderedComponentIds, componentEdges);
	}

	return createRelationshipForceLayoutTargets(
		orderedComponentIds,
		graphNodeById,
		componentEdges,
	);
}

function createForceSimulationNodes(
	orderedComponentIds: string[],
	graphNodeById: Map<string, SpiceDbGraphNode>,
	targets: ForceLayoutTargets,
) {
	return orderedComponentIds.flatMap((id, index) => {
		const graphNode = graphNodeById.get(id);

		if (!graphNode) {
			return [];
		}

		const size = nodeSizeByKind[graphNode.kind];
		const target = targets.get(id) ?? { x: index * schemaRankSpacing, y: 0 };
		const row = Math.floor(index / relationshipGroupColumns);
		const column = index % relationshipGroupColumns;

		return {
			id,
			graphNode,
			height: size.height,
			targetX: target.x,
			targetY: target.y,
			width: size.width,
			x: target.x + column * 12,
			y: target.y + row * 12,
		};
	});
}

function createForceSimulationLinks(componentEdges: SpiceDbGraphEdge[]) {
	return componentEdges.map((edge) => ({
		kind: edge.kind,
		source: edge.source,
		target: edge.target,
	}));
}

function runForceLayout(
	graph: SpiceDbGraph,
	nodes: ForceLayoutNode[],
	links: ForceLayoutLink[],
) {
	const linkDistance = (link: ForceLayoutLink) =>
		link.kind === "relationship" ? 240 : 200;
	const manyBodyStrength = graph.mode === "schema" ? -650 : -520;
	const xStrength = graph.mode === "schema" ? 0.3 : 0.18;
	const yStrength = graph.mode === "schema" ? 0.18 : 0.24;

	forceSimulation(nodes)
		.stop()
		.force(
			"link",
			forceLink<ForceLayoutNode, ForceLayoutLink>(links)
				.id((node) => node.id)
				.distance(linkDistance)
				.strength(0.45),
		)
		.force(
			"charge",
			forceManyBody<ForceLayoutNode>()
				.strength(manyBodyStrength)
				.distanceMax(900),
		)
		.force(
			"collide",
			forceCollide<ForceLayoutNode>(
				(node) => Math.hypot(node.width, node.height) / 2 + nodeCollisionGap,
			).iterations(3),
		)
		.force(
			"x",
			forceX<ForceLayoutNode>((node) => node.targetX).strength(xStrength),
		)
		.force(
			"y",
			forceY<ForceLayoutNode>((node) => node.targetY).strength(yStrength),
		)
		.tick(forceTickCount);

	return nodes;
}

function createFlowNode(
	node: ForceLayoutNode,
	objectColorIndex: ReturnType<typeof createObjectColorIndex>,
	onSelect: FlowNodeData["onSelect"],
	searchMatches: Set<string>,
	searchActive: boolean,
	sourcePosition: Position,
	targetPosition: Position,
): FlowNode {
	return {
		id: node.graphNode.id,
		type: "spicedb",
		sourcePosition,
		targetPosition,
		position: {
			x: (node.x ?? node.targetX) - node.width / 2,
			y: (node.y ?? node.targetY) - node.height / 2,
		},
		style: {
			height: node.height,
			width: node.width,
		},
		data: {
			...node.graphNode,
			color: getNodeColor(node.graphNode, objectColorIndex),
			onSelect,
			searchActive,
			searchMatched: searchMatches.has(node.graphNode.id),
		},
	};
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
		const componentEdges = graph.edges.filter(
			(edge) =>
				componentIdSet.has(edge.source) && componentIdSet.has(edge.target),
		);
		const targets = createForceLayoutTargets(
			graph,
			orderedComponentIds,
			graphNodeById,
			componentEdges,
		);
		const forceNodes = createForceSimulationNodes(
			orderedComponentIds,
			graphNodeById,
			targets,
		);
		const forceLinks = createForceSimulationLinks(componentEdges);
		const positionedNodes = runForceLayout(graph, forceNodes, forceLinks);
		const nodes = positionedNodes.map((node) =>
			createFlowNode(
				node,
				objectColorIndex,
				onSelect,
				searchMatches,
				searchActive,
				sourcePosition,
				targetPosition,
			),
		);

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
