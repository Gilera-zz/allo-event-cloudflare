import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Boxes,
  Users,
  Eye,
  LogOut,
  CalendarRange,
  Sun,
  Moon,
  Clock,
  ChevronDown,
  FolderKanban,
  UserCircle2,
  Shield,
  CalendarCheck2,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import logo from "@/assets/allo-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

type Item = { to: string; label: string; icon: any; exact?: boolean };
type Group = { id: string; label: string; icon: any; adminOnly?: boolean; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "projekt",
    label: "Projekt",
    icon: FolderKanban,
    items: [
      { to: "/admin/projects", label: "Projekt & Bemanning", icon: CalendarRange },
      { to: "/admin/mina-projekt", label: "Mina projekt", icon: FolderKanban },
    ],
  },
  {
    id: "min-sida",
    label: "Min sida",
    icon: UserCircle2,
    items: [
      { to: "/admin/tillganglighet", label: "Tillgänglighet", icon: CalendarCheck2 },
      { to: "/admin/min-tidrapport", label: "Tidrapportering", icon: Clock },
      { to: "/admin/mitt-schema", label: "Mitt schema", icon: CalendarDays },
    ],
  },
  {
    id: "admin",
    label: "Admin Översikt",
    icon: Shield,
    adminOnly: true,
    items: [
      { to: "/admin", label: "Översikt", icon: LayoutDashboard, exact: true },
      { to: "/admin/projects", label: "Hantera projekt", icon: CalendarRange },
      { to: "/admin/schema", label: "Schema & Planering", icon: CalendarDays },
      { to: "/admin/leads", label: "Kundförfrågningar", icon: Inbox },
      { to: "/admin/timesheets", label: "Tidrapporter & Fakturering", icon: Clock },
      { to: "/admin/designs", label: "3D-Monter Designs", icon: Boxes },
      { to: "/admin/staff", label: "Personal-lista", icon: Users },
      { to: "/admin/massutskick", label: "Massutskick", icon: Megaphone },
    ],
  },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  const visibleGroups = GROUPS.filter((g) => !g.adminOnly || isAdmin);

  // Open whichever group contains the active route; default first group.
  const groupContainsActive = (g: Group) => g.items.some((i) => isActive(i.to, i.exact));
  const [open, setOpen] = useState<string>(() => {
    const match = visibleGroups.find(groupContainsActive);
    return match?.id ?? visibleGroups[0]?.id ?? "";
  });

  useEffect(() => {
    const match = visibleGroups.find(groupContainsActive);
    if (match) setOpen(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, isAdmin]);

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 border-r min-h-screen sticky top-0"
      style={{
        backgroundColor: "var(--card)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--secondary)",
      }}
    >
      <div className="px-6 py-7" style={{ borderBottom: "1px solid var(--surface-line)" }}>
        <Link to="/admin" className="flex items-center gap-3">
          <img src={logo} alt="Allo Event" className="h-14 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {visibleGroups.map((g) => {
          const isOpen = open === g.id;
          const hasActive = groupContainsActive(g);
          return (
            <div key={g.id}>
              <button
                onClick={() => setOpen(isOpen ? "" : g.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.18em] transition-colors"
                style={{
                  color: hasActive || isOpen ? "var(--gold-soft)" : "color-mix(in srgb, var(--foreground) 55%, transparent)",
                  backgroundColor: isOpen ? "color-mix(in srgb, var(--gold) 5%, transparent)" : "transparent",
                }}
              >
                <span className="flex items-center gap-2.5">
                  <g.icon className="h-3.5 w-3.5" />
                  <span className="font-medium">{g.label}</span>
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform duration-300"
                  style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isOpen ? `${g.items.length * 44 + 4}px` : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="mt-1 ml-2 pl-3 space-y-0.5" style={{ borderLeft: "1px solid var(--surface-line)" }}>
                  {g.items.map((item) => {
                    const active = isActive(item.to, item.exact);
                    return (
                      <Link
                        key={`${g.id}-${item.to}-${item.label}`}
                        to={item.to}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{
                          color: active ? "var(--gold-soft)" : "color-mix(in srgb, var(--foreground) 70%, transparent)",
                          backgroundColor: active ? "color-mix(in srgb, var(--gold) 8%, transparent)" : "transparent",
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pt-3" style={{ borderTop: "1px solid var(--surface-line)" }}>
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Visa Hemsida</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === "dark" ? "Ljust läge" : "Mörkt läge"}</span>
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logga ut</span>
        </button>
        <div className="mt-3 pt-3 pb-4 px-3" style={{ borderTop: "1px solid var(--surface-line)" }}>
          {user?.email && (
            <p className="truncate" style={{ color: "var(--surface-line)", fontSize: "11px" }}>
              {user.email}
            </p>
          )}
          <p
            className="mt-1"
            style={{
              color: "var(--surface-line)",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Allo Admin
          </p>
        </div>
      </div>
    </aside>
  );
}
