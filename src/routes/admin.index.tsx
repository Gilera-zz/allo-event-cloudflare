import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  Clock3,
  GalleryHorizontalEnd,
  Inbox,
  Plus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type UpcomingProject = {
  id: string;
  title: string | null;
  location: string | null;
  starts_at: string | null;
  positions_needed: number | null;
};

type RecentLead = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  company_name?: string | null;
  status?: string | null;
  created_at?: string | null;
};

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}) {
  return (
    <Link to={to} className="admin-dashboard-metric group">
      <div className="flex items-start justify-between gap-4">
        <span className="admin-kicker">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <strong>{value}</strong>
      <span>{hint}</span>
    </Link>
  );
}

function formatWhen(value: string | null) {
  if (!value) return "Datum saknas";
  return new Date(value).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}


function leadDisplayName(lead: RecentLead) {
  const composed = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return lead.name || composed || "Okänd kontakt";
}

function leadDisplayCompany(lead: RecentLead) {
  return lead.company || lead.company_name || "Företag saknas";
}

function AdminDashboard() {
  const [counts, setCounts] = useState({
    newLeads: "—",
    upcomingProjects: "—",
    crewActive: "—",
    staffTotal: "—",
  });
  const [upcoming, setUpcoming] = useState<UpcomingProject[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const ASSIGNMENT_TABLES = ["project_assignments", "assignments", "staff_assignments", "bookings"];
      const CONFIRMED_STATUSES = ["confirmed", "accepted", "approved", "booked"];
      let crewCount: number | null = null;

      for (const table of ASSIGNMENT_TABLES) {
        try {
          const result = await supabase
            .from(table)
            .select("id", { count: "exact", head: true })
            .in("status", CONFIRMED_STATUSES);
          if (!result.error) {
            crewCount = result.count ?? 0;
            break;
          }
        } catch {
          // Try the next known assignment table.
        }
      }

      const [leadsRes, projRes, profRes, upcomingRes, recentLeadsRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("projects").select("id", { count: "exact", head: true }).gte("starts_at", nowIso),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("projects")
          .select("id,title,location,starts_at,positions_needed")
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(4),
        supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

      setCounts({
        newLeads: leadsRes.count != null ? String(leadsRes.count) : "—",
        upcomingProjects: projRes.count != null ? String(projRes.count) : "—",
        crewActive: crewCount != null ? String(crewCount) : "—",
        staffTotal: profRes.count != null ? String(profRes.count) : "—",
      });
      if (!upcomingRes.error) setUpcoming((upcomingRes.data as UpcomingProject[]) ?? []);
      if (!recentLeadsRes.error) setRecentLeads((recentLeadsRes.data as RecentLead[]) ?? []);
    })();
  }, []);

  return (
    <div className="admin-page admin-dashboard-page">
      <header className="admin-page-header admin-dashboard-hero">
        <div>
          <p className="admin-kicker">Allo Operations</p>
          <h1>Översikt</h1>
          <p>Projekt, människor och kundflöde — samlat i en arbetsyta.</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/projects" className="admin-button admin-button-secondary">
            <CalendarRange className="h-4 w-4" />Projekt
          </Link>
          <Link to="/admin/case-cms" className="admin-button admin-button-primary">
            <GalleryHorizontalEnd className="h-4 w-4" />Case CMS
          </Link>
        </div>
      </header>

      <section className="admin-metric-grid">
        <Metric label="Nya leads" value={counts.newLeads} hint="Obesvarade kundförfrågningar" icon={Inbox} to="/admin/leads" />
        <Metric label="Kommande projekt" value={counts.upcomingProjects} hint="Planerade leveranser" icon={CalendarRange} to="/admin/projects" />
        <Metric label="Crew bekräftad" value={counts.crewActive} hint="Aktiva tilldelningar" icon={Users} to="/admin/projects" />
        <Metric label="Personal" value={counts.staffTotal} hint="Profiler i systemet" icon={Users} to="/admin/staff" />
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-dashboard-list-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">Drift</span>
              <h2>Nästa projekt</h2>
            </div>
            <Link to="/admin/projects" className="admin-text-link">Alla projekt <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="admin-dashboard-list">
            {upcoming.length ? upcoming.map((project, index) => (
              <Link key={project.id} to="/admin/projects" className="admin-dashboard-row">
                <span className="admin-row-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <strong className="truncate">{project.title || "Utan titel"}</strong>
                  <span className="truncate">{project.location || "Plats saknas"}</span>
                </div>
                <div className="admin-row-meta">
                  <span>{formatWhen(project.starts_at)}</span>
                  <small>{project.positions_needed ? `${project.positions_needed} pers.` : "Bemanning —"}</small>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )) : (
              <div className="admin-empty-state"><CalendarRange className="h-5 w-5" /><span>Inga kommande projekt.</span></div>
            )}
          </div>
        </section>

        <section className="admin-panel admin-dashboard-list-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">CRM</span>
              <h2>Senaste förfrågningar</h2>
            </div>
            <Link to="/admin/leads" className="admin-text-link">Öppna inbox <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="admin-dashboard-list">
            {recentLeads.length ? recentLeads.map((lead, index) => (
              <Link key={lead.id} to="/admin/leads" className="admin-dashboard-row">
                <span className="admin-row-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <strong className="truncate">{leadDisplayName(lead)}</strong>
                  <span className="truncate">{leadDisplayCompany(lead)}</span>
                </div>
                <div className="admin-row-meta">
                  <span>{formatWhen(lead.created_at)}</span>
                  <small>{lead.status || "new"}</small>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )) : (
              <div className="admin-empty-state"><Inbox className="h-5 w-5" /><span>Inga kundförfrågningar ännu.</span></div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-quick-grid">
        <Link to="/admin/projects" className="admin-quick-card">
          <Plus className="h-5 w-5" /><div><strong>Hantera projekt</strong><span>Drift, bemanning och publicering</span></div><ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/admin/schema" className="admin-quick-card">
          <Clock3 className="h-5 w-5" /><div><strong>Schema & planering</strong><span>Se kommande pass och resurser</span></div><ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/admin/case-cms" className="admin-quick-card">
          <GalleryHorizontalEnd className="h-5 w-5" /><div><strong>Publicera case</strong><span>Gör genomförda projekt publika</span></div><ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
