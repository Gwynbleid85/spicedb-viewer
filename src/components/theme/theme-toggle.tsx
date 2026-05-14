import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "#/components/ui/button";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";

	return (
		<Button
			aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
			onClick={toggleTheme}
			size="icon-sm"
			title={`Switch to ${isDark ? "light" : "dark"} mode`}
			type="button"
			variant="secondary"
		>
			{isDark ? <SunIcon /> : <MoonIcon />}
		</Button>
	);
}
