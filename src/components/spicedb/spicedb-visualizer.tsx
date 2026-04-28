import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { graphlib, layout } from "@dagrejs/dagre";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
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

function layoutGraph(graph: SpiceDbGraph, onSelect: FlowNodeData["onSelect"]) {
	const layoutDirection = graph.mode === "schema" ? "horizontal" : "vertical";
	const objectColorIndex = createObjectColorIndex(graph.nodes);
	const dagre = new graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	dagre.setGraph({
		rankdir: graph.mode === "schema" ? "LR" : "TB",
		nodesep: 84,
		ranksep: 132,
		edgesep: 36,
	});

	for (const node of graph.nodes) {
		const size = nodeSizeByKind[node.kind];
		dagre.setNode(node.id, size);
	}

	for (const edge of graph.edges) {
		dagre.setEdge(edge.source, edge.target);
	}

	layout(dagre);

	const nodes: FlowNode[] = graph.nodes.map((node) => {
		const size = nodeSizeByKind[node.kind];
		const positioned = dagre.node(node.id) as
			| { x: number; y: number }
			| undefined;

		return {
			id: node.id,
			type: "spicedb",
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
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
			},
		};
	});

	const edges: FlowEdge[] = graph.edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		label: edge.label,
		type: "straight",
		markerEnd: {
			type: MarkerType.ArrowClosed,
		},
		data: edge,
		className: "text-text-caption",
	}));

	return {
		nodes: positionNodesWithoutOverlap(nodes, layoutDirection),
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
		return (
			<aside className="rounded-5xl border border-border-default bg-surface-overlay-soft p-5">
				<p className="text-sm font-semibold text-text-caption">
					Select a node to inspect its metadata.
				</p>
			</aside>
		);
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
}: {
	graph: SpiceDbGraph;
	onSelect: (item: SelectedGraphItem) => void;
}) {
	const flow = useMemo(
		() => layoutGraph(graph, (node) => onSelect({ item: node, type: "node" })),
		[graph, onSelect],
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
	const [nodes, , onNodesChange] = useNodesState(initialNodes);
	const [edges, , onEdgesChange] = useEdgesState(initialEdges);

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
			<Background />
			<Controls />
			<MiniMap pannable zoomable />
		</ReactFlow>
	);
}

export function SpiceDbVisualizerPage() {
	const [mode, setMode] = useState<SpiceDbGraphMode>("schema");
	const [selected, setSelected] = useState<SelectedGraphItem | null>(null);
	const fetchGraph = useServerFn(getSpiceDbGraph);
	const graphQuery = useQuery({
		queryKey: ["spicedb-graph", mode],
		queryFn: () => fetchGraph({ data: { mode } }),
		staleTime: 30_000,
	});
	const graph = graphQuery.data;

	return (
		<main className="relative h-dvh w-full overflow-hidden">
			{/* Full-page canvas */}
			<div className="absolute inset-0">
				{graphQuery.isLoading ? (
					<GraphSkeleton />
				) : graph ? (
					<GraphCanvas graph={graph} onSelect={setSelected} />
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
