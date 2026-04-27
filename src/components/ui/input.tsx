import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "#/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"min-h-12 w-full min-w-0 rounded-2xl border border-border-default bg-surface-field px-4 py-3 text-base text-text-heading outline-none transition placeholder:text-[color:color-mix(in_oklab,var(--text-caption)_65%,white_35%)] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-overlay-muted disabled:opacity-60 aria-invalid:border-border-danger aria-invalid:ring-4 aria-invalid:ring-danger-ring md:text-base",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
