import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent text-sm font-bold whitespace-nowrap outline-none transition duration-200 select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-[var(--lagoon)] focus-visible:ring-4 focus-visible:ring-teal-200/40 active:not-aria-[haspopup]:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-[var(--sea-ink)] text-white shadow-lg shadow-emerald-950/10 hover:-translate-y-0.5 hover:bg-[var(--palm)]",
				outline:
					"border-[var(--line)] bg-white/72 text-[var(--sea-ink)] shadow-xl shadow-emerald-950/5 backdrop-blur hover:-translate-y-0.5 hover:bg-white",
				secondary:
					"border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] shadow-lg shadow-emerald-950/5 backdrop-blur hover:-translate-y-0.5 hover:bg-white/92",
				ghost:
					"border border-transparent bg-transparent text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)]",
				destructive:
					"border border-red-200 bg-red-50 text-red-700 shadow-lg shadow-red-950/5 hover:bg-red-100",
				link: "rounded-none px-0 py-0 text-[var(--lagoon-deep)] underline-offset-4 hover:underline",
			},
			size: {
				default: "min-h-12 gap-2 px-5 py-3",
				xs: "min-h-8 gap-1.5 px-3 py-1.5 text-xs",
				sm: "min-h-10 gap-2 px-4 py-2.5 text-sm",
				lg: "min-h-14 gap-2.5 px-6 py-4 text-base",
				icon: "size-12",
				"icon-xs": "size-8 rounded-xl",
				"icon-sm": "size-10 rounded-2xl",
				"icon-lg": "size-14 rounded-[1.35rem]",
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
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
