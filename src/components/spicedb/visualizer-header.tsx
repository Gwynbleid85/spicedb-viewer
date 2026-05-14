import { Trash2Icon } from "lucide-react";

import { ThemeToggle } from "#/components/theme/theme-toggle";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import type { SpiceDbGraph, SpiceDbGraphMode } from "#/lib/spicedb-graph";

export function VisualizerHeader({
	deleteDescription,
	deleteDialogOpen,
	deletePending,
	displayedGraph,
	isFetching,
	mode,
	onDeleteAllRelationships,
	onDeleteDialogOpenChange,
	onDeleteSelectedRelationships,
	onModeChange,
	onRefresh,
	onSearchQueryChange,
	onSelectedRelationshipsDeleteDialogOpenChange,
	searchActive,
	searchMatches,
	searchQuery,
	selectedRelationshipCount,
	selectedRelationshipsDeleteDialogOpen,
	selectedRelationshipsDeletePending,
}: {
	deleteDescription: string;
	deleteDialogOpen: boolean;
	deletePending: boolean;
	displayedGraph?: SpiceDbGraph;
	isFetching: boolean;
	mode: SpiceDbGraphMode;
	onDeleteAllRelationships: () => void;
	onDeleteDialogOpenChange: (open: boolean) => void;
	onDeleteSelectedRelationships: () => void;
	onModeChange: (mode: SpiceDbGraphMode) => void;
	onRefresh: () => void;
	onSearchQueryChange: (query: string) => void;
	onSelectedRelationshipsDeleteDialogOpenChange: (open: boolean) => void;
	searchActive: boolean;
	searchMatches: Set<string>;
	searchQuery: string;
	selectedRelationshipCount: number;
	selectedRelationshipsDeleteDialogOpen: boolean;
	selectedRelationshipsDeletePending: boolean;
}) {
	return (
		<div className="pointer-events-auto flex flex-col gap-0 py-0">
			<div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
				<div className="flex items-center gap-4">
					<img
						alt="SpiceDB Viewer logo"
						className="h-16 w-16 rounded-2xl shadow-brand-sm"
						src="/logo-rounded.png"
					/>
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.24em] text-text-kicker">
							SpiceDB
						</p>
						<h1 className="mt-1 font-heading text-3xl font-bold text-text-heading">
							Authorization graph
						</h1>
					</div>
				</div>
				<div className="flex min-w-64 flex-col gap-1">
					<Input
						aria-label="Search graph nodes"
						className="min-h-10 rounded-2xl bg-surface-chip/500 py-2 text-sm shadow-brand-sm backdrop-blur-lg"
						onChange={(event) => onSearchQueryChange(event.target.value)}
						placeholder="Search in nodes..."
						type="search"
						value={searchQuery}
					/>
					{searchActive && displayedGraph ? (
						<p className="px-1 text-xs font-semibold text-text-caption">
							{searchMatches.size} of {displayedGraph.nodes.length} nodes
							matched
						</p>
					) : null}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<ThemeToggle />
					<Button
						onClick={() => onModeChange("schema")}
						type="button"
						variant={mode === "schema" ? "default" : "outline"}
					>
						Schema
					</Button>
					<Button
						onClick={() => onModeChange("relationships")}
						type="button"
						variant={mode === "relationships" ? "default" : "outline"}
					>
						Relationships
					</Button>
					<Button
						disabled={isFetching}
						onClick={onRefresh}
						type="button"
						variant="secondary"
					>
						{isFetching ? "Refreshing..." : "Refresh"}
					</Button>
					{selectedRelationshipCount > 1 ? (
						<AlertDialog
							onOpenChange={onSelectedRelationshipsDeleteDialogOpenChange}
							open={selectedRelationshipsDeleteDialogOpen}
						>
							<AlertDialogTrigger
								render={
									<Button
										disabled={selectedRelationshipsDeletePending}
										variant="destructive"
									>
										<Trash2Icon data-icon="inline-start" />
										Delete {selectedRelationshipCount} selected
									</Button>
								}
							/>
							<AlertDialogContent size="sm">
								<AlertDialogHeader>
									<AlertDialogMedia className="bg-destructive text-text-danger">
										<Trash2Icon />
									</AlertDialogMedia>
									<AlertDialogTitle>
										Delete selected relationships?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete {selectedRelationshipCount}{" "}
										selected relationships from SpiceDB. This action cannot be
										undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel
										disabled={selectedRelationshipsDeletePending}
										variant="ghost"
									>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										disabled={selectedRelationshipsDeletePending}
										onClick={onDeleteSelectedRelationships}
										variant="destructive"
									>
										{selectedRelationshipsDeletePending
											? "Deleting..."
											: "Delete"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : null}
					<AlertDialog
						onOpenChange={onDeleteDialogOpenChange}
						open={deleteDialogOpen}
					>
						<AlertDialogTrigger
							render={
								<Button disabled={deletePending} variant="destructive">
									<Trash2Icon data-icon="inline-start" />
									Delete relations
								</Button>
							}
						/>
						<AlertDialogContent size="sm">
							<AlertDialogHeader>
								<AlertDialogMedia className="bg-destructive text-text-danger">
									<Trash2Icon />
								</AlertDialogMedia>
								<AlertDialogTitle>Delete all relationships?</AlertDialogTitle>
								<AlertDialogDescription>
									{deleteDescription} This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={deletePending} variant="ghost">
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									disabled={deletePending}
									onClick={onDeleteAllRelationships}
									variant="destructive"
								>
									{deletePending ? "Deleting..." : "Delete relations"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}
