import "@xyflow/react/dist/style.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import type { SpiceDbGraph, SpiceDbGraphMode } from "#/lib/spicedb-graph";
import {
	deleteSpiceDbRelationship,
	deleteSpiceDbRelationships,
	getSpiceDbGraph,
} from "#/server/functions/spicedb.functions";

import { GraphCanvas, GraphSkeleton } from "./graph-canvas";
import { MetadataPanel } from "./metadata-panel";
import { matchesNodeSearch } from "./spicedb-graph-node-utils";
import type {
	DeleteRelationshipMutationInput,
	SelectedGraphItem,
} from "./spicedb-visualizer.types";
import { StatsCard } from "./stats-card";
import { VisualizerHeader } from "./visualizer-header";

export { layoutGraph } from "./spicedb-graph-layout";
export { matchesNodeSearch } from "./spicedb-graph-node-utils";

export function SpiceDbVisualizerPage() {
	const [mode, setMode] = useState<SpiceDbGraphMode>("schema");
	const [selected, setSelected] = useState<SelectedGraphItem | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletedRelationshipIds, setDeletedRelationshipIds] = useState(
		() => new Set<string>(),
	);
	const queryClient = useQueryClient();
	const fetchGraph = useServerFn(getSpiceDbGraph);
	const deleteRelationship = useServerFn(deleteSpiceDbRelationship);
	const deleteRelationships = useServerFn(deleteSpiceDbRelationships);
	const graphQuery = useQuery({
		queryKey: ["spicedb-graph", mode],
		queryFn: () => fetchGraph({ data: { mode } }),
		staleTime: 30_000,
	});
	const deleteRelationshipMutation = useMutation({
		mutationFn: ({
			edgeId: _edgeId,
			...data
		}: DeleteRelationshipMutationInput) => deleteRelationship({ data }),
		onSuccess: (_result, deletedRelationship) => {
			setDeletedRelationshipIds(
				(previous) => new Set([...previous, deletedRelationship.edgeId]),
			);
			setSelected(null);
			setMode("relationships");
		},
	});
	const deleteRelationshipsMutation = useMutation({
		mutationFn: () => deleteRelationships({ data: {} }),
		onSuccess: async () => {
			setDeleteDialogOpen(false);
			setSelected(null);
			await queryClient.invalidateQueries({
				queryKey: ["spicedb-graph"],
				refetchType: "all",
			});
			setMode("relationships");
		},
	});
	const graph = graphQuery.data;
	const displayedGraph = useDisplayedGraph(graph, deletedRelationshipIds);
	const normalizedSearchQuery = searchQuery.trim();
	const searchMatches = useMemo(() => {
		if (!displayedGraph || normalizedSearchQuery.length === 0) {
			return new Set<string>();
		}

		return new Set(
			displayedGraph.nodes
				.filter((node) => matchesNodeSearch(node, normalizedSearchQuery))
				.map((node) => node.id),
		);
	}, [displayedGraph, normalizedSearchQuery]);
	const searchActive = normalizedSearchQuery.length > 0;
	const relationshipCount = displayedGraph?.stats.relationshipCount ?? 0;
	const deleteDescription =
		displayedGraph?.mode === "relationships"
			? `SpiceDB currently returned ${relationshipCount} relationships. This will permanently delete every relationship while leaving the schema intact.`
			: "This will permanently delete every relationship in SpiceDB while leaving the schema intact.";

	const graphUpdatedAt = graphQuery.dataUpdatedAt;

	useEffect(() => {
		void graphUpdatedAt;
		setDeletedRelationshipIds(new Set());
	}, [graphUpdatedAt]);

	return (
		<main className="relative h-dvh w-full overflow-hidden">
			<div className="absolute inset-0">
				{graphQuery.isLoading ? (
					<GraphSkeleton />
				) : displayedGraph ? (
					<GraphCanvas
						graph={displayedGraph}
						onSelect={setSelected}
						searchActive={searchActive}
						searchMatches={searchMatches}
					/>
				) : null}
			</div>

			<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 bg-transparent p-4 shadow-none">
				<VisualizerHeader
					deleteDescription={deleteDescription}
					deleteDialogOpen={deleteDialogOpen}
					deletePending={deleteRelationshipsMutation.isPending}
					displayedGraph={displayedGraph}
					isFetching={graphQuery.isFetching}
					mode={mode}
					onDeleteAllRelationships={() => deleteRelationshipsMutation.mutate()}
					onDeleteDialogOpenChange={setDeleteDialogOpen}
					onModeChange={setMode}
					onRefresh={() => graphQuery.refetch()}
					onSearchQueryChange={setSearchQuery}
					searchActive={searchActive}
					searchMatches={searchMatches}
					searchQuery={searchQuery}
				/>

				<GraphAlerts
					deleteRelationshipError={deleteRelationshipMutation.error}
					deleteRelationshipsError={deleteRelationshipsMutation.error}
					displayedGraph={displayedGraph}
					graphError={graphQuery.error}
				/>
			</div>

			{displayedGraph ? <StatsCard graph={displayedGraph} /> : null}

			<div className="pointer-events-none absolute top-24 right-0 bottom-0 z-10 w-80 p-4">
				<div className="pointer-events-auto max-h-full overflow-y-auto">
					<MetadataPanel
						deletePending={deleteRelationshipMutation.isPending}
						onDeleteRelationship={(input) =>
							deleteRelationshipMutation.mutate(input)
						}
						selected={selected}
					/>
				</div>
			</div>
		</main>
	);
}

function useDisplayedGraph(
	graph: SpiceDbGraph | undefined,
	deletedRelationshipIds: Set<string>,
) {
	return useMemo(() => {
		if (!graph || deletedRelationshipIds.size === 0) {
			return graph;
		}

		const edges = graph.edges.filter(
			(edge) => !deletedRelationshipIds.has(edge.id),
		);
		const connectedNodeIds = new Set(
			edges.flatMap((edge) => [edge.source, edge.target]),
		);
		const nodes = graph.nodes.filter((node) => connectedNodeIds.has(node.id));
		const removedEdgeCount = graph.edges.length - edges.length;

		return {
			...graph,
			edges,
			nodes,
			stats: {
				...graph.stats,
				edgeCount: Math.max(0, graph.stats.edgeCount - removedEdgeCount),
				nodeCount: nodes.length,
				relationshipCount:
					graph.stats.relationshipCount === undefined
						? undefined
						: Math.max(0, graph.stats.relationshipCount - removedEdgeCount),
			},
		} satisfies SpiceDbGraph;
	}, [deletedRelationshipIds, graph]);
}

function GraphAlerts({
	deleteRelationshipError,
	deleteRelationshipsError,
	displayedGraph,
	graphError,
}: {
	deleteRelationshipError: Error | null;
	deleteRelationshipsError: Error | null;
	displayedGraph?: SpiceDbGraph;
	graphError: Error | null;
}) {
	return (
		<>
			{graphError ? (
				<Alert className="pointer-events-auto" variant="destructive">
					<AlertTitle>Unable to load SpiceDB graph</AlertTitle>
					<AlertDescription>{graphError.message}</AlertDescription>
				</Alert>
			) : null}

			{deleteRelationshipError ? (
				<Alert className="pointer-events-auto" variant="destructive">
					<AlertTitle>Unable to delete SpiceDB relationship</AlertTitle>
					<AlertDescription>{deleteRelationshipError.message}</AlertDescription>
				</Alert>
			) : null}

			{deleteRelationshipsError ? (
				<Alert className="pointer-events-auto" variant="destructive">
					<AlertTitle>Unable to delete SpiceDB relationships</AlertTitle>
					<AlertDescription>
						{deleteRelationshipsError.message}
					</AlertDescription>
				</Alert>
			) : null}

			{displayedGraph?.truncated && displayedGraph.message ? (
				<Alert className="pointer-events-auto">
					<AlertTitle>Relationship graph is capped</AlertTitle>
					<AlertDescription>{displayedGraph.message}</AlertDescription>
				</Alert>
			) : null}
		</>
	);
}
