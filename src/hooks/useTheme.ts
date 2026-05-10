import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("forma-theme") as Theme) || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("forma-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setThemeMode = useCallback((mode: Theme) => {
    setTheme(mode);
  }, []);

  return { theme, toggleTheme, setThemeMode, isDark: theme === "dark" };
}

// CSS variables for theming
export const themeVars = {
  dark: {
    "--bg-primary": "#0b0b0b",
    "--bg-secondary": "#1a1a1a",
    "--bg-tertiary": "#2a2a2a",
    "--text-primary": "#F0EAE0",
    "--text-secondary": "rgba(240, 234, 224, 0.7)",
    "--text-muted": "rgba(240, 234, 224, 0.5)",
    "--accent": "#C4A264",
    "--accent-hover": "#d4b274",
    "--border": "rgba(240, 234, 224, 0.1)",
    "--success": "#22c55e",
    "--error": "#ef4444",
    "--warning": "#f59e0b",
  },
  light: {
    "--bg-primary": "#FAFAF8",
    "--bg-secondary": "#FFFFFF",
    "--bg-tertiary": "#F0EDE8",
    "--text-primary": "#1a1a1a",
    "--text-secondary": "rgba(26, 26, 26, 0.7)",
    "--text-muted": "rgba(26, 26, 26, 0.5)",
    "--accent": "#C4A264",
    "--accent-hover": "#b09254",
    "--border": "rgba(26, 26, 26, 0.1)",
    "--success": "#16a34a",
    "--error": "#dc2626",
    "--warning": "#d97706",
  },
};

export default useTheme;