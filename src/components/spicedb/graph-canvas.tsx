import {
	Background,
	Controls,
	MiniMap,
	Panel,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";

import { useTheme } from "#/components/theme/theme-provider";
import { Button } from "#/components/ui/button";
import type { SpiceDbGraph, SpiceDbGraphEdge } from "#/lib/spicedb-graph";

import { layoutGraph } from "./spicedb-graph-layout";
import { SpiceDbNode } from "./spicedb-node";
import type {
	FlowEdge,
	FlowNode,
	SelectedGraphItem,
} from "./spicedb-visualizer.types";

const nodeTypes = {
	spicedb: SpiceDbNode,
};

export function GraphSkeleton() {
	return (
		<div className="grid min-h-96 place-items-center rounded-5xl border border-border-default bg-surface-overlay-soft">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="size-12 animate-pulse rounded-full bg-surface-chip" />
				<p className="text-sm font-semibold text-text-caption">Loading graph</p>
			</div>
		</div>
	);
}

export function GraphCanvas({
	graph,
	onSelect,
	onSelectedRelationshipsChange,
	searchActive,
	searchMatches,
}: {
	graph: SpiceDbGraph;
	onSelect: (item: SelectedGraphItem) => void;
	onSelectedRelationshipsChange: (relationships: SpiceDbGraphEdge[]) => void;
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
			edges={flow.edges}
			nodes={flow.nodes}
			onSelect={onSelect}
			onSelectedRelationshipsChange={onSelectedRelationshipsChange}
		/>
	);
}

function DraggableGraph({
	edges: initialEdges,
	nodes: initialNodes,
	onSelect,
	onSelectedRelationshipsChange,
}: {
	edges: FlowEdge[];
	nodes: FlowNode[];
	onSelect: (item: SelectedGraphItem) => void;
	onSelectedRelationshipsChange: (relationships: SpiceDbGraphEdge[]) => void;
}) {
	const { theme } = useTheme();
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const organizeGraph = useCallback(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialEdges, initialNodes, setEdges, setNodes]);
	const handleSelectionChange = useCallback(
		({ edges: selectedEdges }: { edges: FlowEdge[] }) => {
			onSelectedRelationshipsChange(
				selectedEdges.flatMap((edge) =>
					edge.data?.kind === "relationship" ? [edge.data] : [],
				),
			);
		},
		[onSelectedRelationshipsChange],
	);

	useEffect(() => {
		setEdges(initialEdges);
	}, [initialEdges, setEdges]);

	useEffect(() => {
		setNodes((currentNodes) => {
			const currentNodeById = new Map(
				currentNodes.map((node) => [node.id, node]),
			);

			return initialNodes.map((node) => ({
				...node,
				position: currentNodeById.get(node.id)?.position ?? node.position,
			}));
		});
	}, [initialNodes, setNodes]);

	return (
		<ReactFlow
			colorMode={theme}
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
			onSelectionChange={handleSelectionChange}
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
