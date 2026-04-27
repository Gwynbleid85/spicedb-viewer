import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent text-sm font-bold whitespace-nowrap outline-none transition duration-200 select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-focus-ring active:not-aria-[haspopup]:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-surface-strong text-text-on-strong shadow-brand-sm hover:-translate-y-0.5 hover:bg-surface-strong-hover",
				outline:
					"border-border-default bg-surface-elevated text-text-heading shadow-brand-sm backdrop-blur hover:-translate-y-0.5 hover:bg-surface-panel",
				secondary:
					"border border-border-chip bg-surface-chip text-text-heading shadow-brand-sm backdrop-blur hover:-translate-y-0.5 hover:bg-surface-overlay-soft",
				ghost:
					"border border-transparent bg-transparent text-text-heading hover:bg-surface-link-hover",
				destructive:
					"border border-border-danger bg-destructive text-text-danger shadow-brand-sm hover:bg-danger-scale-100",
				link: "rounded-none px-0 py-0 text-text-link underline-offset-4 hover:underline",
			},
			size: {
				default: "min-h-12 gap-2 px-5 py-3",
				xs: "min-h-8 gap-1.5 px-3 py-1.5 text-xs",
				sm: "min-h-10 gap-2 px-4 py-2.5 text-sm",
				lg: "min-h-14 gap-2.5 px-6 py-4 text-base",
				icon: "size-12",
				"icon-xs": "size-8 rounded-xl",
				"icon-sm": "size-10 rounded-2xl",
				"icon-lg": "size-14 rounded-control-lg",
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
