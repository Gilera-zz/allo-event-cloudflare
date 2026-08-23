import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Plus, X, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/min-tidrapport")({
  component: MinTidrapportView,
});

const ROLES = [
  "Målare", "Snickare", "Mattläggare", "Elektriker", "Grov- & Byggstädare",
  "Dekormontör", "Lagerarbetare", "Truckförare", "Bärare / Riggare", "Chaufför",
  "Eventpersonal / Eventvärd", "Garderobspersonal", "Serveringspersonal",
  "Ljud- & Ljustekniker", "Stagehand",
];

type Sheet = {
  id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  role: string;
  total_on_site_hours: number;
  paid_hours: number;
  status: string;
  admin_notes: string | null;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

function MinTidrapportView() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Sheet> | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("time_sheets")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    if (error) setError(error.message);
    setRows((data as Sheet[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const totalHours = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.paid_hours || 0), 0),
    [rows],
  );

  const save = async () => {
    if (!editing || !user) return;
    if (!editing.date || !editing.start_time || !editing.end_time || !editing.role) {
      alert("Fyll i datum, tid och roll."); return;
    }
    const payload = {
      user_id: user.id,
      date: editing.date,
      start_time: editing.start_time,
      end_time: editing.end_time,
      role: editing.role,
      admin_notes: editing.admin_notes ?? null,
      entry_type: "shift",
      status: "Väntar på godkännande",
    };
    const res = editing.id
      ? await supabase.from("time_sheets").update(payload).eq("id", editing.id)
      : await supabase.from("time_sheets").insert(payload);
    if (res.error) { alert(res.error.message); return; }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort denna tidrapport?")) return;
    await supabase.from("time_sheets").delete().eq("id", id);
    setEditing(null);
    load();
  };

  return (
    <div className="admin-page">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Min sida</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Tidrapportering</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Logga dina egna pass. Admin granskar och fakturerar separat.
          </p>
        </div>
        <button
          onClick={() => setEditing({
            date: new Date().toISOString().slice(0, 10),
            start_time: "07:00", end_time: "16:00", role: ROLES[0],
          })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider transition"
          style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Nytt pass
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Totalt antal pass" value={String(rows.length)} />
        <Stat label="Betalda timmar" value={`${totalHours.toFixed(1)}h`} />
        <Stat label="Väntar på godkännande" value={String(rows.filter(r => r.status === "Väntar på godkännande").length)} />
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4 flex gap-3"
          style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)", backgroundColor: "color-mix(in srgb, var(--destructive) 5%, transparent)" }}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>Kunde inte ladda: {error}</div>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground" style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-4 py-3 font-medium">Datum</th>
              <th className="text-left px-4 py-3 font-medium">Roll</th>
              <th className="text-left px-4 py-3 font-medium">Tid</th>
              <th className="text-right px-4 py-3 font-medium">Betalt</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Laddar...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                Inga egna tidrapporter ännu. Lägg till ditt första pass.
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}
                onClick={() => setEditing(r)}
                className="hover:bg-accent/[0.03] cursor-pointer transition"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3">{fmtDate(r.date)}</td>
                <td className="px-4 py-3">{r.role}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {r.start_time?.slice(0,5) ?? "–"}–{r.end_time?.slice(0,5) ?? "–"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">{Number(r.paid_hours).toFixed(2)}h</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--card)" }} onClick={() => setEditing(null)}>
          <style>{`
            .ps-input { background-color:#141414; color:#F5F5F7; border:1px solid var(--border); color-scheme: dark; }
            select.ps-input option { background-color:var(--popover); color:var(--foreground); }
          `}</style>
          <div className="rounded-2xl border w-full max-w-lg"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-xl font-semibold">{editing.id ? "Redigera pass" : "Nytt pass"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-full hover:bg-accent/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Datum">
                <input type="date" className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                  value={editing.date ?? ""} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start">
                  <input type="time" className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editing.start_time ?? ""} onChange={(e) => setEditing({ ...editing, start_time: e.target.value })} />
                </Field>
                <Field label="Slut">
                  <input type="time" className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editing.end_time ?? ""} onChange={(e) => setEditing({ ...editing, end_time: e.target.value })} />
                </Field>
              </div>
              <Field label="Roll">
                <select className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                  value={editing.role ?? ROLES[0]} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Anteckningar">
                <textarea rows={3} className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                  value={editing.admin_notes ?? ""} onChange={(e) => setEditing({ ...editing, admin_notes: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center justify-between p-6" style={{ borderTop: "1px solid var(--border)" }}>
              {editing.id ? (
                <button onClick={() => remove(editing.id!)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs uppercase tracking-wider border"
                  style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }}>
                  <Trash2 className="h-3.5 w-3.5" /> Ta bort
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-full text-xs uppercase tracking-wider border"
                  style={{ borderColor: "var(--border)" }}>Avbryt</button>
                <button onClick={save}
                  className="px-5 py-2 rounded-full text-xs uppercase tracking-wider"
                  style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}>
                  Spara pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
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
