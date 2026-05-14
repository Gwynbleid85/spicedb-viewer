import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	toggleTheme: () => void;
};

const storageKey = "spicedb-viewer-theme";
const themeColorByTheme: Record<Theme, string> = {
	light: "#e7f3ec",
	dark: "#0a1418",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
	const storedTheme = window.localStorage.getItem(storageKey);

	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.style.colorScheme = theme;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", themeColorByTheme[theme]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme | null>(null);
	const resolvedTheme = theme ?? "light";

	useEffect(() => {
		setTheme(getStoredTheme());
	}, []);

	useEffect(() => {
		if (!theme) {
			return;
		}

		applyTheme(theme);
		window.localStorage.setItem(storageKey, theme);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
	}, []);

	const value = useMemo(
		() => ({
			theme: resolvedTheme,
			toggleTheme,
		}),
		[resolvedTheme, toggleTheme],
	);

	return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}

	return context;
}
