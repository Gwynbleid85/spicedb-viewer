import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase transition-colors",
	{
		variants: {
			variant: {
				default:
					"border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--kicker)]",
				secondary: "border-[var(--line)] bg-white/72 text-[var(--sea-ink)]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
	return (
		<div
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
