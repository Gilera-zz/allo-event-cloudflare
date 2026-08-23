import { Laptop, Moon, Sun } from "lucide-react";
import type { Theme, ThemePreference } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  lang?: "sv" | "en";
}

export function ThemeToggle({ theme, preference, setTheme, lang = "sv" }: Props) {
  const sv = lang === "sv";
  const label =
    preference === "system"
      ? sv ? "Systemtema" : "System theme"
      : preference === "dark"
        ? sv ? "Mörkt tema" : "Dark theme"
        : sv ? "Ljust tema" : "Light theme";

  const Icon = preference === "system" ? Laptop : theme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="allo-header-icon allo-theme-trigger"
          aria-label={sv ? `Tema: ${label}` : `Theme: ${label}`}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="allo-theme-menu w-44 p-1.5">
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setTheme(value as ThemePreference)}
        >
          <DropdownMenuRadioItem value="system" className="allo-theme-option">
            <Laptop className="h-4 w-4" />
            {sv ? `System (${theme === "dark" ? "mörkt" : "ljust"})` : `System (${theme})`}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light" className="allo-theme-option">
            <Sun className="h-4 w-4" />
            {sv ? "Ljust" : "Light"}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="allo-theme-option">
            <Moon className="h-4 w-4" />
            {sv ? "Mörkt" : "Dark"}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
