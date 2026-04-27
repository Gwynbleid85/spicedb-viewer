import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "#/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"min-h-10 w-full min-w-0 rounded-lg border border-border-default bg-surface-field px-3 py-2 text-base text-text-heading outline-none transition-colors placeholder:text-text-caption focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-overlay-muted disabled:opacity-60 aria-invalid:border-border-danger aria-invalid:ring-2 aria-invalid:ring-danger-ring md:text-base",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
