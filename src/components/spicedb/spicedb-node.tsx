import { Handle, type NodeProps, Position } from "@xyflow/react";

import { cn } from "#/lib/utils";

import { getObjectId, getObjectType } from "./spicedb-graph-node-utils";
import type { FlowNode } from "./spicedb-visualizer.types";

export function SpiceDbNode({ data, selected }: NodeProps<FlowNode>) {
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
