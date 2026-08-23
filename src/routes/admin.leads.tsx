import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, Mail, Phone, Building2, Calendar, Filter, RefreshCw, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsInbox,
});

type Lead = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone: string | null;
  company?: string | null;
  company_name?: string | null;
  event_type?: string | null;
  category?: string | null;
  event_date: string | null;
  start_date: string | null;
  end_date: string | null;
  staff_count: number | null;
  city: string | null;
  org_number: string | null;
  guests: number | null;
  budget: string | null;
  message?: string | null;
  description?: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUSES = [
  { value: "all", label: "Alla" },
  { value: "new", label: "Nya" },
  { value: "contacted", label: "Kontaktade" },
  { value: "qualified", label: "Kvalificerade" },
  { value: "won", label: "Vunna" },
  { value: "lost", label: "Förlorade" },
  { value: "archived", label: "Arkiverade" },
];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  new: { bg: "color-mix(in srgb, var(--gold) 12%, transparent)", fg: "var(--gold)" },
  contacted: { bg: "color-mix(in srgb, var(--info) 12%, transparent)", fg: "var(--info)" },
  qualified: { bg: "color-mix(in srgb, var(--info) 12%, transparent)", fg: "var(--info)" },
  won: { bg: "color-mix(in srgb, var(--ok) 12%, transparent)", fg: "var(--ok)" },
  lost: { bg: "color-mix(in srgb, var(--destructive) 12%, transparent)", fg: "var(--destructive)" },
  archived: { bg: "var(--surface)", fg: "var(--muted-foreground)" },
};

function leadName(lead: Lead) {
  const composed = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return lead.name || composed || "Okänd kontakt";
}

function leadCompany(lead: Lead) {
  return lead.company || lead.company_name || null;
}

function leadCategory(lead: Lead) {
  return lead.event_type || lead.category || null;
}

function leadMessage(lead: Lead) {
  return lead.message || lead.description || null;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

function LeadsInbox() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setLeads((data as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (!error) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      if (selected?.id === id) setSelected({ ...selected, status });
    }
  };

  return (
    <div className="admin-page">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">CRM</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Kundförfrågningar</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {loading ? "Hämtar..." : `${leads.length} ${filter === "all" ? "totalt" : STATUSES.find((s) => s.value === filter)?.label.toLowerCase()}`}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider border hover:bg-white/5 transition"
          style={{ borderColor: "var(--surface-line)", color: "var(--gold-soft)" }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Uppdatera
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition"
            style={{
              borderColor: filter === s.value ? "var(--gold-soft)" : "var(--surface-line)",
              color: filter === s.value ? "var(--gold-soft)" : "color-mix(in srgb, var(--foreground) 60%, transparent)",
              backgroundColor: filter === s.value ? "color-mix(in srgb, var(--gold) 8%, transparent)" : "transparent",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4" style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)", backgroundColor: "color-mix(in srgb, var(--destructive) 5%, transparent)" }}>
          Kunde inte ladda leads: {error}. Säkerställ att tabellen <code>leads</code> finns i databasen.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--secondary)", backgroundColor: "var(--surface)" }}>
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Laddar...</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Inga förfrågningar än.</p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--surface-line)" }}>
              {leads.map((l) => {
                const s = STATUS_STYLE[l.status] ?? STATUS_STYLE.new;
                const isActive = selected?.id === l.id;
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => setSelected(l)}
                      className="w-full text-left px-5 py-4 hover:bg-white/[0.03] transition flex items-center gap-4"
                      style={{ backgroundColor: isActive ? "color-mix(in srgb, var(--gold) 4%, transparent)" : "transparent" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{leadName(l)}</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
                            style={{ backgroundColor: s.bg, color: s.fg }}
                          >
                            {l.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {leadCompany(l) ? `${leadCompany(l)} · ` : ""}{l.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{fmtDate(l.created_at)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="rounded-2xl border p-6 h-fit sticky top-6" style={{ borderColor: "var(--secondary)", backgroundColor: "var(--surface)" }}>
          {selected ? (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lead</p>
                <h2 className="mt-1 text-xl font-semibold">{leadName(selected)}</h2>
                {leadCompany(selected) && <p className="text-sm text-muted-foreground">{leadCompany(selected)}</p>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a className="hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a></div>
                {selected.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><a className="hover:underline" href={`tel:${selected.phone}`}>{selected.phone}</a></div>}
                {selected.org_number && <div className="text-muted-foreground text-xs">Org.nr: {selected.org_number}</div>}
                {selected.city && <div className="text-muted-foreground text-xs">Ort: {selected.city}</div>}
                {leadCategory(selected) && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>{leadCategory(selected)}</span></div>}
                {(selected.start_date || selected.end_date || selected.event_date) && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="flex flex-col">
                      {selected.start_date ? (
                        <span><span className="text-muted-foreground text-xs">Startdatum: </span>{fmtDate(selected.start_date)}</span>
                      ) : selected.event_date ? (
                        <span>{fmtDate(selected.event_date)}</span>
                      ) : null}
                      {selected.end_date && (
                        <span><span className="text-muted-foreground text-xs">Slutdatum: </span>{fmtDate(selected.end_date)}</span>
                      )}
                    </div>
                  </div>
                )}
                {(selected.staff_count ?? selected.guests) != null && (
                  <div className="text-muted-foreground">{selected.staff_count ?? selected.guests} Personal</div>
                )}
                {selected.budget && <div className="text-muted-foreground">Budget: {selected.budget}</div>}
              </div>

              {leadMessage(selected) && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Meddelande</p>
                  <p className="text-sm whitespace-pre-wrap rounded-lg p-3" style={{ backgroundColor: "var(--card)" }}>{leadMessage(selected)}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.filter((s) => s.value !== "all").map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateStatus(selected.id, s.value)}
                      className="px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider border transition"
                      style={{
                        borderColor: selected.status === s.value ? (STATUS_STYLE[s.value]?.fg ?? "var(--gold-soft)") : "var(--surface-line)",
                        color: selected.status === s.value ? (STATUS_STYLE[s.value]?.fg ?? "var(--gold-soft)") : "color-mix(in srgb, var(--foreground) 60%, transparent)",
                        backgroundColor: selected.status === s.value ? (STATUS_STYLE[s.value]?.bg ?? "transparent") : "transparent",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground uppercase tracking-wider pt-2 border-t" style={{ borderColor: "var(--surface-line)" }}>
                Mottagen {new Date(selected.created_at).toLocaleString("sv-SE")}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Inbox className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Välj en förfrågan</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
