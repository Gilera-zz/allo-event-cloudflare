import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Eye,
  FolderKanban,
  GalleryHorizontalEnd,
  Inbox,
  Image as ImageIcon,
  Laptop,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Sun,
  UserCircle2,
  Users,
  X,
  Clock,
} from "lucide-react";
import logo from "@/assets/allo-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useTheme, type ThemePreference } from "@/hooks/use-theme";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean };
type Group = { id: string; label: string; icon: LucideIcon; adminOnly?: boolean; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "operations",
    label: "Operations",
    icon: LayoutDashboard,
    items: [
      { to: "/admin", label: "Översikt", icon: LayoutDashboard, exact: true },
      { to: "/admin/projects", label: "Projekt & bemanning", icon: CalendarRange },
      { to: "/admin/case-cms", label: "Case CMS", icon: GalleryHorizontalEnd },
      { to: "/admin/homepage", label: "Hemsida & hero", icon: ImageIcon },
      { to: "/admin/schema", label: "Schema & planering", icon: CalendarDays },
    ],
  },
  {
    id: "business",
    label: "Affär & ekonomi",
    icon: Inbox,
    items: [
      { to: "/admin/leads", label: "Kundförfrågningar", icon: Inbox },
      { to: "/admin/timesheets", label: "Tid & fakturering", icon: Clock },
      { to: "/admin/designs", label: "3D-monter designs", icon: Boxes },
    ],
  },
  {
    id: "people",
    label: "Personal",
    icon: Users,
    items: [
      { to: "/admin/staff", label: "Personalregister", icon: Users },
      { to: "/admin/massutskick", label: "Massutskick", icon: Megaphone },
    ],
  },
  {
    id: "my-work",
    label: "Min sida",
    icon: UserCircle2,
    items: [
      { to: "/admin/mina-projekt", label: "Mina projekt", icon: FolderKanban },
      { to: "/admin/mitt-schema", label: "Mitt schema", icon: CalendarDays },
      { to: "/admin/min-tidrapport", label: "Tidrapportering", icon: Clock },
      { to: "/admin/tillganglighet", label: "Tillgänglighet", icon: CalendarCheck2 },
    ],
  },
];

function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { theme, preference, setTheme } = useTheme();
  const options: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
    { value: "system", label: "System", icon: Laptop },
    { value: "light", label: "Ljust", icon: Sun },
    { value: "dark", label: "Mörkt", icon: Moon },
  ];

  return (
    <div className={`admin-theme-selector ${compact ? "is-compact" : ""}`} aria-label="Tema">
      {options.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={active ? "is-active" : ""}
            title={option.value === "system" ? `System (${theme === "dark" ? "mörkt" : "ljust"})` : option.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { isAdmin } = useAuth();

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(`${to}/`);

  const visibleGroups = useMemo(
    () => GROUPS.filter((g) => !g.adminOnly || isAdmin),
    [isAdmin],
  );

  const groupContainsActive = (g: Group) => g.items.some((i) => isActive(i.to, i.exact));
  const [open, setOpen] = useState<string>(() => {
    const match = visibleGroups.find(groupContainsActive);
    return match?.id ?? visibleGroups[0]?.id ?? "";
  });

  useEffect(() => {
    const match = visibleGroups.find(groupContainsActive);
    if (match) setOpen(match.id);
    onNavigate?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, isAdmin]);

  return (
    <nav className="admin-nav">
      {visibleGroups.map((group) => {
        const isOpen = open === group.id;
        const hasActive = groupContainsActive(group);
        const GroupIcon = group.icon;
        return (
          <div key={group.id} className="admin-nav-group">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : group.id)}
              className={`admin-nav-group-trigger ${hasActive || isOpen ? "is-active" : ""}`}
            >
              <span>
                <GroupIcon className="h-3.5 w-3.5" />
                {group.label}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`} />
            </button>

            <div className={`admin-nav-items ${isOpen ? "is-open" : ""}`}>
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const active = isActive(item.to, item.exact);
                return (
                  <Link
                    key={`${group.id}-${item.to}-${item.label}`}
                    to={item.to}
                    className={`admin-nav-item ${active ? "is-active" : ""}`}
                  >
                    <ItemIcon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="admin-brand">
      <Link to="/" aria-label="Till Allo Events startsida" className="admin-brand-home-link">
        <img src={logo} alt="Allo Event" className="admin-brand-logo" />
      </Link>
      <Link to="/admin" className="admin-brand-copy" aria-label="Till Operations översikt">
        <strong>Operations</strong>
        <span>Admin workspace</span>
      </Link>
    </div>
  );
}

export function AdminSidebar() {
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => setMobileOpen(false), [path]);

  return (
    <>
      <aside className="admin-sidebar hidden md:flex">
        <div className="admin-sidebar-brand-wrap"><Brand /></div>
        <Navigation />
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-utility">
            <Eye className="h-4 w-4" />
            <span>Visa hemsida</span>
          </Link>
          <div className="admin-sidebar-theme-block">
            <span className="admin-sidebar-mini-label">Tema</span>
            <ThemeSelector />
          </div>
          <button type="button" onClick={() => signOut()} className="admin-sidebar-utility">
            <LogOut className="h-4 w-4" />
            <span>Logga ut</span>
          </button>
          <div className="admin-sidebar-user">
            <span className="admin-user-dot" />
            <div className="min-w-0">
              <strong className="truncate">{user?.email ?? "Allo Admin"}</strong>
              <span>Administratör</span>
            </div>
          </div>
        </div>
      </aside>

      <header className="admin-mobile-header md:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeSelector compact />
          <button
            type="button"
            className="admin-mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Öppna meny"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="admin-mobile-drawer md:hidden" role="dialog" aria-modal="true">
          <button className="admin-mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Stäng meny" />
          <div className="admin-mobile-panel">
            <div className="admin-mobile-panel-head">
              <Brand />
              <button type="button" className="admin-mobile-menu-button" onClick={() => setMobileOpen(false)} aria-label="Stäng meny">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Navigation onNavigate={() => setMobileOpen(false)} />
            <div className="admin-mobile-panel-foot">
              <ThemeSelector />
              <Link to="/" className="admin-sidebar-utility"><Eye className="h-4 w-4" />Visa hemsida</Link>
              <button type="button" onClick={() => signOut()} className="admin-sidebar-utility"><LogOut className="h-4 w-4" />Logga ut</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
