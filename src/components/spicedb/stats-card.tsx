import type { SpiceDbGraph } from "#/lib/spicedb-graph";

export function StatsCard({ graph }: { graph: SpiceDbGraph }) {
	return (
		<div className="pointer-events-none absolute bottom-0 left-10 z-10 p-4">
			<div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-border-chip bg-surface-chip/80 px-4 py-2.5 backdrop-blur-lg">
				<StatInline label="Nodes" value={graph.stats.nodeCount} />
				<StatInline label="Edges" value={graph.stats.edgeCount} />
				<StatInline label="Definitions" value={graph.stats.definitionCount} />
				<StatInline label="Relations" value={graph.stats.relationCount} />
				<StatInline label="Permissions" value={graph.stats.permissionCount} />
				<StatInline
					label="Relationships"
					value={graph.stats.relationshipCount}
				/>
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
