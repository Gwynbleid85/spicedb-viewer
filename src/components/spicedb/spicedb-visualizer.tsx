import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	type NodeProps,
	Panel,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { graphlib, layout } from "@dagrejs/dagre";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import type {
	SpiceDbGraph,
	SpiceDbGraphEdge,
	SpiceDbGraphMode,
	SpiceDbGraphNode,
} from "#/lib/spicedb-graph";
import { cn } from "#/lib/utils";
import { getSpiceDbGraph } from "#/server/functions/spicedb.functions";

type FlowNodeData = SpiceDbGraphNode & {
	color: (typeof objectColorScale)[number];
	onSelect: (node: SpiceDbGraphNode) => void;
	searchActive: boolean;
	searchMatched: boolean;
};

type FlowNode = Node<FlowNodeData>;
type FlowEdge = Edge<SpiceDbGraphEdge>;
type SelectedGraphItem =
	| { item: SpiceDbGraphEdge; type: "edge" }
	| { item: SpiceDbGraphNode; type: "node" };

const nodeSizeByKind: Record<
	SpiceDbGraphNode["kind"],
	{ width: number; height: number }
> = {
	caveat: { width: 190, height: 66 },
	definition: { width: 200, height: 66 },
	object: { width: 220, height: 66 },
	permission: { width: 200, height: 66 },
	relation: { width: 200, height: 66 },
	wildcard: { width: 190, height: 66 },
};
const nodeCollisionGap = 32;
const componentGap = 96;
const maxLayoutRowWidth = 1200;

const nodeColorByKind: Record<
	SpiceDbGraphNode["kind"],
	{ badge: string; handle: string; node: string }
> = {
	caveat: {
		badge: "border-chart-4 bg-chart-4/20 text-text-heading",
		handle: "bg-chart-4",
		node: "border-chart-4 bg-chart-4/10",
	},
	definition: {
		badge: "border-chart-1 bg-chart-1/20 text-text-heading",
		handle: "bg-chart-1",
		node: "border-chart-1 bg-chart-1/10",
	},
	object: {
		badge: "border-chart-5 bg-chart-5/20 text-text-heading",
		handle: "bg-chart-5",
		node: "border-chart-5 bg-chart-5/10",
	},
	permission: {
		badge: "border-chart-3 bg-chart-3/20 text-text-heading",
		handle: "bg-chart-3",
		node: "border-chart-3 bg-chart-3/10",
	},
	relation: {
		badge: "border-chart-2 bg-chart-2/20 text-text-heading",
		handle: "bg-chart-2",
		node: "border-chart-2 bg-chart-2/10",
	},
	wildcard: {
		badge: "border-chart-6 bg-chart-6/20 text-text-heading",
		handle: "bg-chart-6",
		node: "border-chart-6 bg-chart-6/10",
	},
};

const objectColorScale = [
	{
		badge: "border-chart-1 bg-chart-1/20 text-text-heading",
		handle: "bg-chart-1",
		node: "border-chart-1 bg-chart-1/10",
	},
	{
		badge: "border-chart-2 bg-chart-2/20 text-text-heading",
		handle: "bg-chart-2",
		node: "border-chart-2 bg-chart-2/10",
	},
	{
		badge: "border-chart-3 bg-chart-3/20 text-text-heading",
		handle: "bg-chart-3",
		node: "border-chart-3 bg-chart-3/10",
	},
	{
		badge: "border-chart-4 bg-chart-4/20 text-text-heading",
		handle: "bg-chart-4",
		node: "border-chart-4 bg-chart-4/10",
	},
	{
		badge: "border-chart-5 bg-chart-5/20 text-text-heading",
		handle: "bg-chart-5",
		node: "border-chart-5 bg-chart-5/10",
	},
	{
		badge: "border-chart-6 bg-chart-6/20 text-text-heading",
		handle: "bg-chart-6",
		node: "border-chart-6 bg-chart-6/10",
	},
	{
		badge: "border-chart-7 bg-chart-7/20 text-text-heading",
		handle: "bg-chart-7",
		node: "border-chart-7 bg-chart-7/10",
	},
	{
		badge: "border-chart-8 bg-chart-8/20 text-text-heading",
		handle: "bg-chart-8",
		node: "border-chart-8 bg-chart-8/10",
	},
	{
		badge: "border-chart-9 bg-chart-9/20 text-text-heading",
		handle: "bg-chart-9",
		node: "border-chart-9 bg-chart-9/10",
	},
	{
		badge: "border-chart-10 bg-chart-10/20 text-text-heading",
		handle: "bg-chart-10",
		node: "border-chart-10 bg-chart-10/10",
	},
];

const nodeTypes = {
	spicedb: SpiceDbNode,
};

function normalizeSearchValue(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function fuzzyIncludes(text: string, query: string) {
	let queryIndex = 0;

	for (const character of text) {
		if (character === query[queryIndex]) {
			queryIndex += 1;
		}

		if (queryIndex === query.length) {
			return true;
		}
	}

	return false;
}

function metadataSearchValues(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(metadataSearchValues);
	}

	if (value && typeof value === "object") {
		return Object.values(value).flatMap(metadataSearchValues);
	}

	return value == null ? [] : [String(value)];
}

export function matchesNodeSearch(node: SpiceDbGraphNode, query: string) {
	const searchTerms = normalizeSearchValue(query).split(" ").filter(Boolean);

	if (searchTerms.length === 0) {
		return false;
	}

	const searchableText = normalizeSearchValue(
		[
			node.id,
			node.kind,
			node.label,
			node.description,
			...Object.entries(node.metadata).flatMap(([key, value]) => [
				key,
				...metadataSearchValues(value),
			]),
		]
			.filter(Boolean)
			.join(" "),
	);

	return searchTerms.every(
		(term) =>
			searchableText.includes(term) || fuzzyIncludes(searchableText, term),
	);
}

function getObjectType(node: SpiceDbGraphNode) {
	const objectType = node.metadata.objectType;

	return typeof objectType === "string" ? objectType : node.label;
}

function getObjectId(node: SpiceDbGraphNode) {
	const objectId = node.metadata.objectId;

	return typeof objectId === "string" ? objectId : node.label;
}

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
	objectColorIndex: Map<string, (typeof objectColorScale)[number]>,
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

	const edges: FlowEdge[] = graph.edges.map((edge) => {
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

function SpiceDbNode({ data, selected }: NodeProps<FlowNode>) {
	const color = data.color;
	const centerHandleClass =
		"!top-1/2 !left-1/2 !size-0 !border-0 !bg-transparent !opacity-0 !-translate-x-1/2 !-translate-y-1/2";
	const labelType = data.kind === "object" ? getObjectType(data) : data.kind;
	const labelId = data.kind === "object" ? getObjectId(data) : data.label;

	return (
		<button
			aria-label={`Inspect ${data.kind} ${data.label}`}
			onClick={() => data.onSelect(data)}
			type="button"
			className={cn(
				"w-full cursor-grab rounded-3xl border px-4 py-3 text-left text-text-heading shadow-brand-sm backdrop-blur transition active:cursor-grabbing hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring",
				color.node,
				data.searchActive && !data.searchMatched && "opacity-30",
				data.searchMatched &&
					"scale-105 ring-4 ring-focus-ring shadow-brand-glow",
				selected && "ring-4 ring-focus-ring",
			)}
		>
			<Handle
				className={cn(color.handle, centerHandleClass)}
				position={Position.Left}
				type="target"
			/>
			<div className="flex min-w-0 flex-col items-center justify-center text-center">
				<span className="max-w-full truncate text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
					{labelType}
				</span>
				<span className="mt-1 max-w-full truncate font-heading text-lg font-bold">
					{labelId}
				</span>
			</div>
			<Handle
				className={cn(color.handle, centerHandleClass)}
				position={Position.Right}
				type="source"
			/>
		</button>
	);
}

function GraphSkeleton() {
	return (
		<div className="grid min-h-96 place-items-center rounded-5xl border border-border-default bg-surface-overlay-soft">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="size-12 animate-pulse rounded-full bg-surface-chip" />
				<p className="text-sm font-semibold text-text-caption">Loading graph</p>
			</div>
		</div>
	);
}

function StatInline({ label, value }: { label: string; value?: number }) {
	if (value === undefined) {
		return null;
	}

	return (
		<div className="flex items-baseline gap-1.5">
			<span className="font-heading text-sm font-bold text-text-heading">
				{value}
			</span>
			<span className="text-xs text-text-caption">{label}</span>
		</div>
	);
}

function MetadataPanel({ selected }: { selected: SelectedGraphItem | null }) {
	if (!selected) {
		return;
	}

	if (selected.type === "edge") {
		return (
			<aside className="rounded-5xl border border-border-default bg-surface-overlay-soft p-5">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
						{selected.item.kind}
					</p>
					<h2 className="mt-1 font-heading text-2xl font-bold text-text-heading">
						{selected.item.label}
					</h2>
				</div>
				<Separator className="my-4" />
				<dl className="flex flex-col gap-3">
					{Object.entries(selected.item.metadata).map(([key, value]) => (
						<div className="min-w-0" key={key}>
							<dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
								{key}
							</dt>
							<dd className="mt-1 break-words font-mono text-sm text-text-heading">
								{Array.isArray(value)
									? value.join(", ")
									: String(value ?? "none")}
							</dd>
						</div>
					))}
				</dl>
			</aside>
		);
	}

	return (
		<aside className="rounded-5xl border border-border-default bg-surface-overlay-soft p-5">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
						{selected.item.kind}
					</p>
					<h2 className="mt-1 font-heading text-2xl font-bold text-text-heading">
						{selected.item.label}
					</h2>
				</div>
			</div>
			{selected.item.description ? (
				<p className="mt-3 text-sm leading-6 text-text-caption">
					{selected.item.description}
				</p>
			) : null}
			<Separator className="my-4" />
			<dl className="flex flex-col gap-3">
				{Object.entries(selected.item.metadata).map(([key, value]) => (
					<div className="min-w-0" key={key}>
						<dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
							{key}
						</dt>
						<dd className="mt-1 break-words font-mono text-sm text-text-heading">
							{Array.isArray(value)
								? value.join(", ")
								: String(value ?? "none")}
						</dd>
					</div>
				))}
			</dl>
		</aside>
	);
}

function GraphCanvas({
	graph,
	onSelect,
	searchActive,
	searchMatches,
}: {
	graph: SpiceDbGraph;
	onSelect: (item: SelectedGraphItem) => void;
	searchActive: boolean;
	searchMatches: Set<string>;
}) {
	const flow = useMemo(
		() =>
			layoutGraph(
				graph,
				(node) => onSelect({ item: node, type: "node" }),
				searchMatches,
				searchActive,
			),
		[graph, onSelect, searchActive, searchMatches],
	);

	if (graph.nodes.length === 0) {
		return (
			<div className="grid min-h-96 place-items-center rounded-5xl border border-border-default bg-surface-overlay-soft p-8 text-center">
				<div>
					<p className="font-heading text-3xl font-bold text-text-heading">
						No graph data
					</p>
					<p className="mt-2 text-sm text-text-caption">
						SpiceDB returned no nodes for this mode.
					</p>
				</div>
			</div>
		);
	}

	return (
		<DraggableGraph
			key={`${graph.mode}:${graph.readAt ?? "latest"}:${graph.nodes.length}:${graph.edges.length}`}
			edges={flow.edges}
			nodes={flow.nodes}
			onSelect={onSelect}
		/>
	);
}

function DraggableGraph({
	edges: initialEdges,
	nodes: initialNodes,
	onSelect,
}: {
	edges: FlowEdge[];
	nodes: FlowNode[];
	onSelect: (item: SelectedGraphItem) => void;
}) {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const organizeGraph = useCallback(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialEdges, initialNodes, setEdges, setNodes]);

	useEffect(() => {
		organizeGraph();
	}, [organizeGraph]);

	return (
		<ReactFlow
			colorMode="system"
			edges={edges}
			fitView
			minZoom={0.15}
			nodes={nodes}
			nodeTypes={nodeTypes}
			onEdgeClick={(_, edge) => {
				if (edge.data) {
					onSelect({ item: edge.data, type: "edge" });
				}
			}}
			onEdgesChange={onEdgesChange}
			onNodesChange={onNodesChange}
			proOptions={{ hideAttribution: true }}
		>
			<Panel position="bottom-center">
				<Button onClick={organizeGraph} type="button" variant="secondary">
					Organize
				</Button>
			</Panel>
			<Background />
			<Controls />
			<MiniMap pannable zoomable />
		</ReactFlow>
	);
}

export function SpiceDbVisualizerPage() {
	const [mode, setMode] = useState<SpiceDbGraphMode>("schema");
	const [selected, setSelected] = useState<SelectedGraphItem | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const fetchGraph = useServerFn(getSpiceDbGraph);
	const graphQuery = useQuery({
		queryKey: ["spicedb-graph", mode],
		queryFn: () => fetchGraph({ data: { mode } }),
		staleTime: 30_000,
	});
	const graph = graphQuery.data;
	const normalizedSearchQuery = searchQuery.trim();
	const searchMatches = useMemo(() => {
		if (!graph || normalizedSearchQuery.length === 0) {
			return new Set<string>();
		}

		return new Set(
			graph.nodes
				.filter((node) => matchesNodeSearch(node, normalizedSearchQuery))
				.map((node) => node.id),
		);
	}, [graph, normalizedSearchQuery]);
	const searchActive = normalizedSearchQuery.length > 0;

	return (
		<main className="relative h-dvh w-full overflow-hidden">
			{/* Full-page canvas */}
			<div className="absolute inset-0">
				{graphQuery.isLoading ? (
					<GraphSkeleton />
				) : graph ? (
					<GraphCanvas
						graph={graph}
						onSelect={setSelected}
						searchActive={searchActive}
						searchMatches={searchMatches}
					/>
				) : null}
			</div>

			{/* Floating header */}
			<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 bg-transparent shadow-none">
				<div className="pointer-events-auto flex flex-col gap-0 py-0">
					<div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.24em] text-text-kicker">
								SpiceDB
							</p>
							<h1 className="mt-1 font-heading text-3xl font-bold text-text-heading">
								Authorization graph
							</h1>
						</div>
						<div className="flex min-w-64 flex-col gap-1">
							<Input
								aria-label="Search graph nodes"
								className="min-h-10 rounded-2xl bg-surface-chip/500 py-2 text-sm shadow-brand-sm backdrop-blur-lg"
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Search in nodes..."
								type="search"
								value={searchQuery}
							/>
							{searchActive && graph ? (
								<p className="px-1 text-xs font-semibold text-text-caption">
									{searchMatches.size} of {graph.nodes.length} nodes matched
								</p>
							) : null}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								onClick={() => setMode("schema")}
								type="button"
								variant={mode === "schema" ? "default" : "outline"}
							>
								Schema
							</Button>
							<Button
								onClick={() => setMode("relationships")}
								type="button"
								variant={mode === "relationships" ? "default" : "outline"}
							>
								Relationships
							</Button>
							<Button
								disabled={graphQuery.isFetching}
								onClick={() => graphQuery.refetch()}
								type="button"
								variant="secondary"
							>
								{graphQuery.isFetching ? "Refreshing..." : "Refresh"}
							</Button>
						</div>
					</div>
				</div>

				{graphQuery.error ? (
					<Alert className="pointer-events-auto" variant="destructive">
						<AlertTitle>Unable to load SpiceDB graph</AlertTitle>
						<AlertDescription>{graphQuery.error.message}</AlertDescription>
					</Alert>
				) : null}

				{graph?.truncated && graph.message ? (
					<Alert className="pointer-events-auto">
						<AlertTitle>Relationship graph is capped</AlertTitle>
						<AlertDescription>{graph.message}</AlertDescription>
					</Alert>
				) : null}
			</div>

			{/* Floating stats card */}
			{graph ? (
				<div className="pointer-events-none absolute bottom-0 left-10 z-10 p-4">
					<div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-border-chip bg-surface-chip/80 px-4 py-2.5 backdrop-blur-lg">
						<StatInline label="Nodes" value={graph.stats.nodeCount} />
						<StatInline label="Edges" value={graph.stats.edgeCount} />
						<StatInline
							label="Definitions"
							value={graph.stats.definitionCount}
						/>
						<StatInline label="Relations" value={graph.stats.relationCount} />
						<StatInline
							label="Permissions"
							value={graph.stats.permissionCount}
						/>
						<StatInline
							label="Relationships"
							value={graph.stats.relationshipCount}
						/>
					</div>
				</div>
			) : null}

			{/* Floating metadata panel */}
			<div className="pointer-events-none absolute top-24 right-0 bottom-0 z-10 w-80 p-4">
				<div className="pointer-events-auto max-h-full overflow-y-auto">
					<MetadataPanel selected={selected} />
				</div>
			</div>
		</main>
	);
}
