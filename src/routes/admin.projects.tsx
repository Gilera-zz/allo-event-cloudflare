import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Users, ArrowUpRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/projects")({
  component: ProjectsView,
});

type Project = {
  id: string;
  title: string | null;
  category: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  positions_needed: number | null;
  image_url: string | null;
};

type Assignment = { project_id: string; status: string | null };

function fmtDateRange(start: string | null, end: string | null) {
  if (!start) return "—";
  const s = new Date(start);
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  const startStr = s.toLocaleDateString("sv-SE", o);
  if (!end) return startStr;
  const e = new Date(end);
  return `${startStr} → ${e.toLocaleDateString("sv-SE", o)}`;
}

function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [fills, setFills] = useState<Record<string, { confirmed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: ps, error: pe } = await supabase
        .from("projects")
        .select("id,title,category,location,starts_at,ends_at,positions_needed,image_url")
        .order("starts_at", { ascending: false, nullsFirst: false });
      if (pe) { setError(pe.message); setLoading(false); return; }
      const list = (ps as Project[]) ?? [];
      setProjects(list);

      const { data: as } = await supabase
        .from("project_assignments")
        .select("project_id,status");
      const map: Record<string, { confirmed: number; total: number }> = {};
      ((as as Assignment[]) ?? []).forEach((a) => {
        if (!map[a.project_id]) map[a.project_id] = { confirmed: 0, total: 0 };
        map[a.project_id].total += 1;
        if (a.status === "confirmed" || a.status === "accepted") map[a.project_id].confirmed += 1;
      });
      setFills(map);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const upcoming = projects.filter((p) => p.starts_at && new Date(p.starts_at).getTime() >= now);
  const past = projects.filter((p) => !p.starts_at || new Date(p.starts_at).getTime() < now);

  return (
    <div className="px-10 py-12 max-w-7xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Operations</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Projekt & Bemanning</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {loading ? "Hämtar..." : `${projects.length} projekt totalt · ${upcoming.length} kommande`}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-6" style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }}>
          {error}
        </div>
      )}

      <Section title="Kommande" items={upcoming} fills={fills} loading={loading} emptyText="Inga kommande projekt." />
      <div className="h-10" />
      <Section title="Tidigare" items={past} fills={fills} loading={loading} emptyText="Inga tidigare projekt." muted />
    </div>
  );
}

function Section({
  title, items, fills, loading, emptyText, muted,
}: {
  title: string;
  items: Project[];
  fills: Record<string, { confirmed: number; total: number }>;
  loading: boolean;
  emptyText: string;
  muted?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-wide">{title}</h2>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{items.length}</span>
      </div>
      {loading ? (
        <div className="rounded-2xl border p-8 text-sm text-muted-foreground" style={{ borderColor: "var(--secondary)" }}>Laddar...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-8 flex items-center gap-3 text-sm text-muted-foreground" style={{ borderColor: "var(--secondary)" }}>
          <AlertCircle className="h-4 w-4" style={{ color: "var(--gold-soft)" }} /> {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ opacity: muted ? 0.7 : 1 }}>
          {items.map((p) => {
            const fill = fills[p.id] ?? { confirmed: 0, total: 0 };
            const needed = p.positions_needed ?? 0;
            const pct = needed > 0 ? Math.min(100, (fill.confirmed / needed) * 100) : 0;
            const fullyStaffed = needed > 0 && fill.confirmed >= needed;
            return (
              <article
                key={p.id}
                className="rounded-2xl border p-5 flex flex-col gap-3"
                style={{ borderColor: "var(--secondary)", backgroundColor: "var(--surface)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {p.category && <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{p.category}</p>}
                    <h3 className="mt-1 text-base font-semibold truncate">{p.title ?? "Utan titel"}</h3>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="h-3 w-3" />{fmtDateRange(p.starts_at, p.ends_at)}</div>
                  {p.location && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{p.location}</div>}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Bemanning</span>
                    <span style={{ color: fullyStaffed ? "var(--ok)" : "var(--gold-soft)" }}>
                      {fill.confirmed}/{needed || "—"} bekräftade · {fill.total} sökt
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-line)" }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: fullyStaffed ? "var(--ok)" : "var(--gold-soft)",
                      }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
