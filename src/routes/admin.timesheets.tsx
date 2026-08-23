import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Filter, Plus, X, RefreshCw, Save, Trash2, AlertCircle, CheckCircle2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/timesheets")({
  component: TimesheetsView,
});

const ROLES = [
  "Målare",
  "Snickare",
  "Mattläggare",
  "Elektriker",
  "Grov- & Byggstädare",
  "Dekormontör",
  "Lagerarbetare",
  "Truckförare",
  "Bärare / Riggare",
  "Chaufför",
  "Eventpersonal / Eventvärd",
  "Garderobspersonal",
  "Serveringspersonal",
  "Ljud- & Ljustekniker",
  "Stagehand",
];
const STATUSES = [
  "Väntar på godkännande",
  "Verifierad med kund",
  "Fakturerad",
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  "Väntar på godkännande": { bg: "color-mix(in srgb, var(--warn) 12%, transparent)", fg: "var(--warn)" },
  "Verifierad med kund": { bg: "color-mix(in srgb, var(--info) 14%, transparent)", fg: "var(--info)" },
  "Fakturerad": { bg: "color-mix(in srgb, var(--ok) 12%, transparent)", fg: "var(--ok)" },
};

type Client = { id: string; name: string; org_number: string | null; billing_email: string | null };
type Profile = { id: string; full_name: string | null; email: string | null };
type EntryType = "shift" | "historical";
type Sheet = {
  id: string;
  user_id: string;
  client_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  role: string;
  total_on_site_hours: number;
  paid_hours: number;
  status: Status;
  admin_notes: string | null;
  created_at: string;
  entry_type?: EntryType;
  iso_year?: number | null;
  iso_week?: number | null;
  period_label?: string | null;
};

const MONTHS_SV = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

// Returns the Monday (ISO) date for a given ISO year + week.
function isoWeekToMonday(year: number, week: number): string {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const monday = new Date(simple);
  if (dow <= 4) monday.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else monday.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  return monday.toISOString().slice(0, 10);
}

function currentIsoWeek(): { year: number; week: number } {
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year: target.getUTCFullYear(), week };
}

// Mirrors the DB trigger so the UI can preview values before saving.
function computePaid(start: string, end: string): { total: number; paid: number } {
  if (!start || !end) return { total: 0, paid: 0 };
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let total = eh + em / 60 - (sh + sm / 60);
  if (total < 0) total += 24;
  let paid = total;
  if (total >= 8) paid = total - 1;
  else if (total >= 6) paid = total - 0.5;
  return { total: +total.toFixed(2), paid: +paid.toFixed(2) };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

function TimesheetsView() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fClient, setFClient] = useState<string>("all");
  const [fStaff, setFStaff] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");

  const [editing, setEditing] = useState<Partial<Sheet> | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [s, c, p] = await Promise.all([
      supabase.from("time_sheets").select("*").order("date", { ascending: false }),
      supabase.from("clients").select("*").order("name"),
      supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    if (s.error) setError(s.error.message);
    setSheets((s.data as Sheet[]) ?? []);
    setClients((c.data as Client[]) ?? []);
    setStaff((p.data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => sheets.filter((sh) =>
    (fClient === "all" || sh.client_id === fClient) &&
    (fStaff === "all" || sh.user_id === fStaff) &&
    (fStatus === "all" || sh.status === fStatus),
  ), [sheets, fClient, fStaff, fStatus]);

  const staffName = (id: string) => {
    const u = staff.find((s) => s.id === id);
    return u?.full_name || u?.email || id.slice(0, 8);
  };
  const clientName = (id: string | null) =>
    id ? clients.find((c) => c.id === id)?.name ?? "—" : "—";

  const cycleStatus = async (sh: Sheet) => {
    const idx = STATUSES.indexOf(sh.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const { error } = await supabase.from("time_sheets").update({ status: next }).eq("id", sh.id);
    if (!error) setSheets((p) => p.map((x) => (x.id === sh.id ? { ...x, status: next } : x)));
  };

  const saveSheet = async () => {
    if (!editing) return;
    const isHistorical = editing.entry_type === "historical";
    const payload: any = {
      user_id: editing.user_id,
      client_id: editing.client_id || null,
      role: editing.role,
      status: editing.status ?? "Väntar på godkännande",
      admin_notes: editing.admin_notes ?? null,
      paid_hours: editing.paid_hours,
      entry_type: editing.entry_type ?? "shift",
    };

    if (isHistorical) {
      const year = editing.iso_year ?? new Date().getFullYear();
      const week = editing.iso_week ?? 1;
      payload.iso_year = year;
      payload.iso_week = week;
      payload.period_label = editing.period_label ?? `Vecka ${week}, ${year}`;
      payload.date = isoWeekToMonday(year, week);
      payload.start_time = null;
      payload.end_time = null;
      if (!payload.user_id || !payload.role || !editing.paid_hours) {
        alert("Välj personal, roll och ange totala timmar."); return;
      }
    } else {
      payload.date = editing.date;
      payload.start_time = editing.start_time;
      payload.end_time = editing.end_time;
      if (!payload.user_id || !payload.date || !payload.start_time || !payload.end_time || !payload.role) {
        alert("Fyll i alla obligatoriska fält."); return;
      }
    }

    if (editing.id) {
      const { error } = await supabase.from("time_sheets").update(payload).eq("id", editing.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from("time_sheets").insert(payload);
      if (error) { alert(error.message); return; }
    }
    setEditing(null);
    load();
  };

  const removeSheet = async (id: string) => {
    if (!confirm("Ta bort denna tidrapport?")) return;
    await supabase.from("time_sheets").delete().eq("id", id);
    setSheets((p) => p.filter((x) => x.id !== id));
    setSelectedIds((p) => { const n = new Set(p); n.delete(id); return n; });
    setEditing(null);
  };

  const toggleOne = (id: string) =>
    setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const visibleIds = filtered.map((s) => s.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const toggleAllVisible = () =>
    setSelectedIds((p) => {
      const n = new Set(p);
      if (allVisibleSelected) visibleIds.forEach((id) => n.delete(id));
      else visibleIds.forEach((id) => n.add(id));
      return n;
    });

  const bulkSetStatus = async (next: Status) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("time_sheets").update({ status: next }).in("id", ids);
    setBulkBusy(false);
    if (error) { alert(error.message); return; }
    setSheets((p) => p.map((x) => (selectedIds.has(x.id) ? { ...x, status: next } : x)));
    setSelectedIds(new Set());
  };


  return (
    <div className="admin-page">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Tid & Fakturering</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Tidrapporter</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {loading ? "Hämtar..." : `${filtered.length} av ${sheets.length} rapporter`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClientModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider border hover:bg-accent/5 transition"
            style={{ borderColor: "var(--border)", color: "var(--accent)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Ny kund
          </button>
          <button
            onClick={() => setEditing({
              entry_type: "shift",
              date: new Date().toISOString().slice(0, 10),
              start_time: "07:00", end_time: "16:00",
              role: ROLES[0], status: "Väntar på godkännande",
            })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider transition"
            style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Nytt skift
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider border hover:bg-accent/5 transition"
            style={{ borderColor: "var(--border)", color: "var(--accent)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Uppdatera
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={fClient} onChange={setFClient}
          options={[{ v: "all", l: "Alla kunder" }, ...clients.map((c) => ({ v: c.id, l: c.name }))]} />
        <Select value={fStaff} onChange={setFStaff}
          options={[{ v: "all", l: "All personal" }, ...staff.map((s) => ({ v: s.id, l: s.full_name || s.email || s.id.slice(0, 8) }))]} />
        <Select value={fStatus} onChange={setFStatus}
          options={[{ v: "all", l: "Alla statusar" }, ...STATUSES.map((s) => ({ v: s, l: s }))]} />
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4 flex gap-3" style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)", backgroundColor: "color-mix(in srgb, var(--destructive) 5%, transparent)" }}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Kunde inte ladda tidrapporter: {error}.<br />
            Kör SQL-migrationen i <code>db/migrations/20260608_time_tracking.sql</code> i Supabase SQL-editorn.
          </div>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground" style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Markera alla"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                  />
                </th>
                <Th>Datum</Th><Th>Personal</Th><Th>Kund</Th><Th>Roll</Th>
                <Th>Tid</Th><Th className="text-right">På plats</Th><Th className="text-right">Betalt</Th>
                <Th>Status</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-12 text-center text-muted-foreground">Laddar...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-12 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  Inga tidrapporter matchar dina filter.
                </td></tr>
              ) : filtered.map((sh) => {
                const s = STATUS_STYLE[sh.status];
                const checked = selectedIds.has(sh.id);
                return (
                  <tr key={sh.id}
                    className="hover:bg-accent/[0.03] cursor-pointer transition"
                    style={{ borderBottom: "1px solid var(--border)", backgroundColor: checked ? "color-mix(in srgb, var(--gold) 6%, transparent)" : undefined }}
                    onClick={() => setEditing(sh)}>
                    <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Markera rad"
                        checked={checked}
                        onChange={() => toggleOne(sh.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                      />
                    </td>
                    <Td>{fmtDate(sh.date)}</Td>
                    <Td className="font-medium">{staffName(sh.user_id)}</Td>
                    <Td>{clientName(sh.client_id)}</Td>
                    <Td>{sh.role}</Td>
                    <Td className="tabular-nums text-muted-foreground">
                      {sh.entry_type === "historical"
                        ? (sh.period_label || `Vecka ${sh.iso_week ?? "–"}`)
                        : `${sh.start_time?.slice(0,5) ?? "–"}–${sh.end_time?.slice(0,5) ?? "–"}`}
                    </Td>
                    <Td className="text-right tabular-nums">{Number(sh.total_on_site_hours).toFixed(2)}h</Td>
                    <Td className="text-right tabular-nums font-semibold">{Number(sh.paid_hours).toFixed(2)}h</Td>
                    <Td>
                      <button
                        onClick={(e) => { e.stopPropagation(); cycleStatus(sh); }}
                        className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider transition hover:opacity-80"
                        style={{ backgroundColor: s.bg, color: s.fg }}
                        title="Klicka för att byta status"
                      >
                        {sh.status}
                      </button>
                    </Td>
                    <Td></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      </div>

      {editing && (
        <EditModal
          sheet={editing}
          staff={staff}
          clients={clients}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={saveSheet}
          onDelete={editing.id ? () => removeSheet(editing.id!) : undefined}
        />
      )}

      {showClientModal && (
        <ClientModal
          onClose={() => setShowClientModal(false)}
          onSaved={() => { setShowClientModal(false); load(); }}
        />
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-2xl"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", backdropFilter: "blur(16px)" }}>
          <span className="text-xs uppercase tracking-wider text-muted-foreground pl-1">
            {selectedIds.size} markerade
          </span>
          <button
            disabled={bulkBusy}
            onClick={() => bulkSetStatus("Verifierad med kund")}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "color-mix(in srgb, var(--info) 18%, transparent)", color: "var(--info)" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Markera valda som Verifierad
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => bulkSetStatus("Fakturerad")}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "color-mix(in srgb, var(--ok) 18%, transparent)", color: "var(--ok)" }}
          >
            <Receipt className="h-3.5 w-3.5" /> Markera valda som Fakturerad
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-full hover:bg-accent/10"
            aria-label="Rensa markering"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>

  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 font-medium ${className ?? ""}`}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>;
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border bg-transparent"
      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
    >
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function EditModal({ sheet, staff, clients, onChange, onClose, onSave, onDelete }: {
  sheet: Partial<Sheet>;
  staff: Profile[]; clients: Client[];
  onChange: (s: Partial<Sheet>) => void;
  onClose: () => void; onSave: () => void; onDelete?: () => void;
}) {
  const mode: EntryType = (sheet.entry_type as EntryType) ?? "shift";
  const setMode = (m: EntryType) => {
    if (m === "historical" && !sheet.iso_week) {
      const cw = currentIsoWeek();
      onChange({
        ...sheet,
        entry_type: m,
        iso_year: sheet.iso_year ?? cw.year,
        iso_week: sheet.iso_week ?? cw.week,
        period_label: sheet.period_label ?? `Vecka ${cw.week}, ${cw.year}`,
      });
    } else {
      onChange({ ...sheet, entry_type: m });
    }
  };

  const preview = computePaid(sheet.start_time ?? "", sheet.end_time ?? "");
  const overridden = mode === "shift" && sheet.paid_hours !== undefined && sheet.paid_hours !== null
    && Number(sheet.paid_hours) !== preview.paid && Number(sheet.paid_hours) !== 0;

  const monthLabel = (() => {
    if (!sheet.iso_year || !sheet.iso_week) return "";
    const monday = new Date(isoWeekToMonday(sheet.iso_year, sheet.iso_week));
    return `${MONTHS_SV[monday.getUTCMonth()]} ${monday.getUTCFullYear()}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "var(--card)" }} onClick={onClose}>
      <div className="rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-auto"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", backdropFilter: "blur(20px)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Tidrapport</p>
            <h2 className="mt-1 text-xl font-semibold">{sheet.id ? "Redigera skift" : "Nytt skift"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode toggle */}
          <div className="flex p-1 rounded-full border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            {([
              { v: "shift", l: "Standard kalenderpass" },
              { v: "historical", l: "Historisk / Veckorapport" },
            ] as const).map((opt) => {
              const active = mode === opt.v;
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setMode(opt.v)}
                  className="flex-1 px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em] transition"
                  style={{
                    backgroundColor: active ? "var(--accent)" : "transparent",
                    color: active ? "var(--primary-foreground)" : "color-mix(in srgb, var(--foreground) 60%, transparent)",
                  }}
                >
                  {opt.l}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Personal *">
              <select className="ts-input" value={sheet.user_id ?? ""} onChange={(e) => onChange({ ...sheet, user_id: e.target.value })}>
                <option value="">Välj personal…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
              </select>
            </Field>
            <Field label="Kund">
              <select className="ts-input" value={sheet.client_id ?? ""} onChange={(e) => onChange({ ...sheet, client_id: e.target.value })}>
                <option value="">— Ingen —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Roll *">
              <select className="ts-input" value={sheet.role ?? ""} onChange={(e) => onChange({ ...sheet, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            {mode === "shift" ? (
              <>
                <Field label="Datum *">
                  <input type="date" className="ts-input" value={sheet.date ?? ""} onChange={(e) => onChange({ ...sheet, date: e.target.value })} />
                </Field>
                <Field label="Starttid *">
                  <input type="time" className="ts-input" value={sheet.start_time?.slice(0,5) ?? ""} onChange={(e) => onChange({ ...sheet, start_time: e.target.value })} />
                </Field>
                <Field label="Sluttid *">
                  <input type="time" className="ts-input" value={sheet.end_time?.slice(0,5) ?? ""} onChange={(e) => onChange({ ...sheet, end_time: e.target.value })} />
                </Field>
              </>
            ) : (
              <>
                <Field label="År *">
                  <input type="number" min="2020" max="2100" className="ts-input"
                    value={sheet.iso_year ?? ""}
                    onChange={(e) => onChange({ ...sheet, iso_year: Number(e.target.value) || undefined })} />
                </Field>
                <Field label="Vecka *">
                  <input type="number" min="1" max="53" className="ts-input"
                    value={sheet.iso_week ?? ""}
                    onChange={(e) => {
                      const w = Number(e.target.value) || undefined;
                      onChange({
                        ...sheet,
                        iso_week: w,
                        period_label: w && sheet.iso_year ? `Vecka ${w}, ${sheet.iso_year}` : sheet.period_label,
                      });
                    }} />
                </Field>
              </>
            )}
          </div>

          {mode === "shift" ? (
            <>
              <div className="rounded-xl p-4 grid grid-cols-3 gap-4 text-sm"
                style={{ backgroundColor: "var(--muted)" }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">På plats</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{preview.total.toFixed(2)}h</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Beräknat betalt</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: "var(--accent)" }}>{preview.paid.toFixed(2)}h</p>
                </div>
                <Field label="Betalt (override)">
                  <input type="number" step="0.25" min="0" className="ts-input"
                    value={sheet.paid_hours ?? ""}
                    placeholder={preview.paid.toString()}
                    onChange={(e) => onChange({ ...sheet, paid_hours: e.target.value === "" ? undefined : Number(e.target.value) })} />
                </Field>
              </div>
              {overridden && (
                <p className="text-xs" style={{ color: "var(--accent)" }}>
                  Manuell override aktiv. Lämna tomt för att återställa till {preview.paid.toFixed(2)}h.
                </p>
              )}
            </>
          ) : (
            <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--muted)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Period</p>
                <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>{monthLabel || "—"}</p>
              </div>
              <Field label="Totala arbetade timmar *">
                <input type="number" step="0.25" min="0" className="ts-input"
                  placeholder="t.ex. 16"
                  value={sheet.paid_hours ?? ""}
                  onChange={(e) => onChange({ ...sheet, paid_hours: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </Field>
              <p className="text-[11px] text-muted-foreground">
                Historiska rapporter loggar totala timmar utan att kräva start- och sluttider — perfekt för backfill av tidigare veckor och månader.
              </p>
            </div>
          )}

          <Field label="Status">
            <select className="ts-input" value={sheet.status ?? "Väntar på godkännande"} onChange={(e) => onChange({ ...sheet, status: e.target.value as Status })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Interna anteckningar">
            <textarea rows={3} className="ts-input" value={sheet.admin_notes ?? ""} onChange={(e) => onChange({ ...sheet, admin_notes: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center justify-between p-6" style={{ borderTop: "1px solid var(--border)" }}>
          {onDelete ? (
            <button onClick={onDelete} className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider rounded-full border hover:bg-red-500/10" style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }}>
              <Trash2 className="h-3.5 w-3.5" /> Ta bort
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs uppercase tracking-wider rounded-full border" style={{ borderColor: "var(--border)" }}>Avbryt</button>
            <button onClick={onSave} className="inline-flex items-center gap-2 px-5 py-2 text-xs uppercase tracking-wider rounded-full" style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}>
              <Save className="h-3.5 w-3.5" /> Spara
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ts-input {
          width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem;
          background: #141414; color: var(--foreground);
          border: 1px solid var(--border); font-size: 0.875rem;
        }
        .ts-input:focus { outline: none; border-color: var(--accent); }
        select.ts-input { color-scheme: dark; }
        select.ts-input option {
          background-color: var(--popover);
          color: var(--foreground);
        }
        select.ts-input option:checked,
        select.ts-input option:hover {
          background: linear-gradient(var(--gold-soft), var(--gold-soft));
          color: var(--background);
        }
      `}</style>
    </div>
  );
}

function ClientModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setErr("Namn krävs"); return; }
    setSaving(true);
    const { error } = await supabase.from("clients").insert({
      name: name.trim(), org_number: org.trim() || null, billing_email: email.trim() || null,
    });
    setSaving(false);
    if (error) setErr(error.message); else onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "var(--card)" }} onClick={onClose}>
      <div className="rounded-2xl border w-full max-w-md" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-xl font-semibold">Ny kund</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Företagsnamn *"><input className="ts-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Org. nummer"><input className="ts-input" value={org} onChange={(e) => setOrg(e.target.value)} /></Field>
          <Field label="Faktureringsmail"><input type="email" className="ts-input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 p-6" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="px-4 py-2 text-xs uppercase tracking-wider rounded-full border" style={{ borderColor: "var(--border)" }}>Avbryt</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 text-xs uppercase tracking-wider rounded-full" style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}>
            {saving ? "Sparar…" : "Spara"}
          </button>
        </div>
        <style>{`.ts-input{width:100%;padding:.5rem .75rem;border-radius:.5rem;background:transparent;color:var(--foreground);border:1px solid var(--border);font-size:.875rem}.ts-input:focus{outline:none;border-color:var(--accent)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
