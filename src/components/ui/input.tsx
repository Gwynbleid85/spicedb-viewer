import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "#/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"min-h-12 w-full min-w-0 rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-base text-[var(--sea-ink)] outline-none transition placeholder:text-[color:color-mix(in_oklab,var(--sea-ink-soft)_65%,white_35%)] focus-visible:border-[var(--lagoon)] focus-visible:ring-4 focus-visible:ring-teal-200/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/55 disabled:opacity-60 aria-invalid:border-red-300 aria-invalid:ring-4 aria-invalid:ring-red-100 md:text-base",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
