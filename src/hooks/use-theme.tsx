import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "allo-theme";

const ThemeCtx = createContext<{ theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void } | null>(null);
const safeThemeFallback = {
  theme: "dark" as Theme,
  toggleTheme: () => {
    console.error("Theme provider unavailable; toggle ignored.");
  },
  setTheme: () => {
    console.error("Theme provider unavailable; setTheme ignored.");
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Theme | null;
    const initial: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* noop */ }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return <ThemeCtx.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    console.error("useTheme called outside ThemeProvider; using safe fallback state.");
    return safeThemeFallback;
  }
  return ctx;
}
