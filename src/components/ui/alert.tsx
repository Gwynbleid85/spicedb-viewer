import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#/lib/utils";

const alertVariants = cva(
	"group/alert relative grid w-full gap-1 rounded-lg border px-3 py-2.5 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border-border-default bg-surface-overlay-soft text-text-heading",
				destructive:
					"border-border-danger bg-destructive text-text-danger *:data-[slot=alert-description]:text-text-danger/90",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn(
				"font-semibold group-has-[>svg]/alert:col-start-2",
				className,
			)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn("text-sm leading-6 text-text-caption", className)}
			{...props}
		/>
	);
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-action"
			className={cn("absolute top-2 right-2", className)}
			{...props}
		/>
	);
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
