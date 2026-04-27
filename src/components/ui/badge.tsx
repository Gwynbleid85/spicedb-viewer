import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
	{
		variants: {
			variant: {
				default: "border-border-chip bg-surface-chip text-text-kicker",
				secondary:
					"border-border-default bg-surface-elevated text-text-heading",
				success:
					"border-border-success/20 bg-surface-success-soft text-text-success",
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
