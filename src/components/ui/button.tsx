import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-150 select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-focus-ring [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-surface-strong text-text-on-strong hover:bg-surface-strong-hover",
				outline:
					"border-border-default bg-surface-elevated text-text-heading hover:bg-surface-overlay-soft",
				secondary:
					"border border-border-chip bg-surface-chip text-text-heading hover:bg-surface-overlay-soft",
				ghost:
					"border border-transparent bg-transparent text-text-heading hover:bg-surface-link-hover",
				destructive:
					"border border-border-danger bg-destructive text-text-danger hover:bg-danger-scale-100",
				link: "rounded-none px-0 py-0 text-text-link underline-offset-4 hover:underline",
			},
			size: {
				default: "min-h-10 gap-2 px-4 py-2.5",
				xs: "min-h-8 gap-1.5 px-3 py-1.5 text-xs",
				sm: "min-h-9 gap-2 px-3 py-2 text-sm",
				lg: "min-h-11 gap-2.5 px-5 py-3 text-base",
				icon: "size-10",
				"icon-xs": "size-8 rounded-md",
				"icon-sm": "size-9 rounded-lg",
				"icon-lg": "size-11 rounded-control-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	render,
	nativeButton,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	const resolvedNativeButton = nativeButton ?? !render;

	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			nativeButton={resolvedNativeButton}
			render={render}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
