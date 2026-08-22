import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, AlertCircle, ArrowUpRight, CalendarRange, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function MetricCard({
  label, value, hint, icon: Icon, to,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  to?: string;
}) {
  const card = (
    <div
      className="p-6 rounded-2xl border h-full transition hover:border-gold-soft/40"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--secondary)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4" style={{ color: "var(--gold-soft)" }} />
      </div>
      <div className="mt-5 text-4xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function AdminDashboard() {
  const [counts, setCounts] = useState({
    newLeads: "—",
    upcomingProjects: "—",
    crewActive: "—",
    staffTotal: "—",
  });

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();

      // Try multiple possible assignment table names so the counter works
      // regardless of the exact schema name used in the staffing portal.
      const ASSIGNMENT_TABLES = ["project_assignments", "assignments", "staff_assignments", "bookings"];
      const CONFIRMED_STATUSES = ["confirmed", "accepted", "approved", "booked"];
      let crewCount: number | null = null;
      for (const t of ASSIGNMENT_TABLES) {
        try {
          const r = await supabase
            .from(t)
            .select("id", { count: "exact", head: true })
            .in("status", CONFIRMED_STATUSES);
          if (!r.error) { crewCount = r.count ?? 0; break; }
        } catch { /* try next */ }
      }

      const [leadsRes, projRes, profRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("projects").select("id", { count: "exact", head: true }).gte("starts_at", nowIso),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        newLeads: leadsRes.count != null ? String(leadsRes.count) : "—",
        upcomingProjects: projRes.count != null ? String(projRes.count) : "—",
        crewActive: crewCount != null ? String(crewCount) : "—",
        staffTotal: profRes.count != null ? String(profRes.count) : "—",
      });
    })();
  }, []);

  return (
    <div className="px-10 py-12 max-w-7xl">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Executive Overview</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Översikt</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Centraliserad rapportering över klientverksamhet och personalinfrastruktur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard label="Nya leads" value={counts.newLeads} hint="Obesvarade förfrågningar" icon={Inbox} to="/admin/leads" />
        <MetricCard label="Kommande projekt" value={counts.upcomingProjects} hint="Planerade event" icon={CalendarRange} to="/admin/projects" />
        <MetricCard label="Crew bekräftad" value={counts.crewActive} hint="Bekräftade tilldelningar" icon={Users} to="/admin/projects" />
        <MetricCard label="Personal totalt" value={counts.staffTotal} hint="Profiler i systemet" icon={Users} to="/admin/staff" />
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-wide">Senaste 3D Designs</h2>
          <Link to="/admin/designs" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Visa alla <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div
          className="rounded-2xl border p-8 flex items-center gap-3 text-sm text-muted-foreground"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--secondary)" }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: "var(--gold-soft)" }} />
          Inga sparade designs ännu. Kopplas in när 3D-byggaren börjar logga sessioner.
        </div>
      </section>
    </div>
  );
}
