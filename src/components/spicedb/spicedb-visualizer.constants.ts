import type { SpiceDbGraphNode } from "#/lib/spicedb-graph";

import type { NodeColor } from "./spicedb-visualizer.types";

export const nodeSizeByKind: Record<
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

export const nodeCollisionGap = 32;
export const componentGap = 96;
export const maxLayoutRowWidth = 1200;

export const nodeColorByKind: Record<SpiceDbGraphNode["kind"], NodeColor> = {
	caveat: {
		badge: "border-chart-10 bg-chart-10/30 text-text-heading",
		handle: "bg-chart-10",
		node: "border-chart-10 bg-chart-10/25",
	},
	definition: {
		badge: "border-chart-2 bg-chart-2/30 text-text-heading",
		handle: "bg-chart-2",
		node: "border-chart-2 bg-chart-2/25",
	},
	object: {
		badge: "border-chart-8 bg-chart-8/30 text-text-heading",
		handle: "bg-chart-8",
		node: "border-chart-8 bg-chart-8/25",
	},
	permission: {
		badge: "border-chart-4 bg-chart-4/30 text-text-heading",
		handle: "bg-chart-4",
		node: "border-chart-4 bg-chart-4/25",
	},
	relation: {
		badge: "border-chart-6 bg-chart-6/30 text-text-heading",
		handle: "bg-chart-6",
		node: "border-chart-6 bg-chart-6/25",
	},
	wildcard: {
		badge: "border-chart-3 bg-chart-3/30 text-text-heading",
		handle: "bg-chart-3",
		node: "border-chart-3 bg-chart-3/25",
	},
};

export const objectColorScale = [
	{
		badge: "border-chart-2 bg-chart-2/30 text-text-heading",
		handle: "bg-chart-2",
		node: "border-chart-2 bg-chart-2/25",
	},
	{
		badge: "border-chart-6 bg-chart-6/30 text-text-heading",
		handle: "bg-chart-6",
		node: "border-chart-6 bg-chart-6/25",
	},
	{
		badge: "border-chart-4 bg-chart-4/30 text-text-heading",
		handle: "bg-chart-4",
		node: "border-chart-4 bg-chart-4/25",
	},
	{
		badge: "border-chart-10 bg-chart-10/30 text-text-heading",
		handle: "bg-chart-10",
		node: "border-chart-10 bg-chart-10/25",
	},
	{
		badge: "border-chart-8 bg-chart-8/30 text-text-heading",
		handle: "bg-chart-8",
		node: "border-chart-8 bg-chart-8/25",
	},
	{
		badge: "border-chart-3 bg-chart-3/30 text-text-heading",
		handle: "bg-chart-3",
		node: "border-chart-3 bg-chart-3/25",
	},
	{
		badge: "border-chart-1 bg-chart-1/30 text-text-heading",
		handle: "bg-chart-1",
		node: "border-chart-1 bg-chart-1/25",
	},
	{
		badge: "border-chart-7 bg-chart-7/30 text-text-heading",
		handle: "bg-chart-7",
		node: "border-chart-7 bg-chart-7/25",
	},
	{
		badge: "border-chart-5 bg-chart-5/30 text-text-heading",
		handle: "bg-chart-5",
		node: "border-chart-5 bg-chart-5/25",
	},
	{
		badge: "border-chart-9 bg-chart-9/30 text-text-heading",
		handle: "bg-chart-9",
		node: "border-chart-9 bg-chart-9/25",
	},
] satisfies NodeColor[];
