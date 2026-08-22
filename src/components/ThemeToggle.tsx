import { Moon, Sun } from "lucide-react";

interface Props {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export function ThemeToggle({ theme, toggleTheme }: Props) {
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-foreground/20 bg-transparent hover:bg-foreground/5 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
