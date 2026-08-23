import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type ThemePreference = "system" | Theme;

const STORAGE_KEY = "allo-theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  /** The theme currently rendered on screen. */
  theme: Theme;
  /** User preference. `system` follows the OS/browser setting live. */
  preference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  /** Convenience action used by the admin UI: locks to the opposite rendered theme. */
  toggleTheme: () => void;
};

const ThemeCtx = createContext<ThemeContextValue | null>(null);

function resolveTheme(preference: ThemePreference, media?: MediaQueryList): Theme {
  if (preference === "light" || preference === "dark") return preference;
  const isDark = media?.matches ?? false;
  return isDark ? "dark" : "light";
}

function applyTheme(theme: Theme, preference: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#050505" : "#f2f2ef",
  );
}

const safeThemeFallback: ThemeContextValue = {
  theme: "light",
  preference: "system",
  toggleTheme: () => undefined,
  setTheme: () => undefined,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Stable SSR values. An inline head script in __root.tsx applies the correct
  // class before paint, preventing a light/dark flash during hydration.
  const [theme, setResolvedTheme] = useState<Theme>("light");
  const [preference, setPreference] = useState<ThemePreference>("system");
  const preferenceRef = useRef<ThemePreference>("system");
  const mediaRef = useRef<MediaQueryList | null>(null);

  const commitTheme = useCallback((nextPreference: ThemePreference, persist = true) => {
    if (typeof window === "undefined") return;

    const media = mediaRef.current ?? window.matchMedia(SYSTEM_QUERY);
    mediaRef.current = media;
    const resolved = resolveTheme(nextPreference, media);

    preferenceRef.current = nextPreference;
    setPreference(nextPreference);
    setResolvedTheme(resolved);
    applyTheme(resolved, nextPreference);

    if (!persist) return;
    try {
      // No stored value means "follow system". This also keeps first visits
      // automatically synced with the device without extra state.
      if (nextPreference === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, nextPreference);
    } catch {
      // localStorage may be disabled; the theme still works for this session.
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_QUERY);
    mediaRef.current = media;

    let initialPreference: ThemePreference = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") initialPreference = stored;
    } catch {
      // Keep system preference when storage is unavailable.
    }

    commitTheme(initialPreference, false);

    const onSystemThemeChange = () => {
      if (preferenceRef.current !== "system") return;
      const resolved = resolveTheme("system", media);
      setResolvedTheme(resolved);
      applyTheme(resolved, "system");
    };

    media.addEventListener?.("change", onSystemThemeChange);
    return () => media.removeEventListener?.("change", onSystemThemeChange);
  }, [commitTheme]);

  const setTheme = useCallback(
    (nextTheme: ThemePreference) => commitTheme(nextTheme, true),
    [commitTheme],
  );

  const toggleTheme = useCallback(() => {
    // A manual toggle intentionally becomes a locked preference. Users can
    // select "System" again from the public theme menu at any time.
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return (
    <ThemeCtx.Provider value={{ theme, preference, toggleTheme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx) ?? safeThemeFallback;
}
