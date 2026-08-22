import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X, Trash2, AlertCircle, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/schema")({
  component: SchemaView,
});

const ROLES = [
  "Målare", "Snickare", "Mattläggare", "Elektriker", "Grov- & Byggstädare",
  "Dekormontör", "Lagerarbetare", "Truckförare", "Bärare / Riggare", "Chaufför",
  "Eventpersonal / Eventvärd", "Garderobspersonal", "Serveringspersonal",
  "Ljud- & Ljustekniker", "Stagehand",
];

const MONTHS_SV = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAYS_SV = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

type Client = { id: string; name: string };
type Profile = { id: string; full_name: string | null; email: string | null };
type Shift = {
  id: string;
  user_id: string;
  client_id: string | null;
  location: string | null;
  date: string;
  start_time: string;
  end_time: string;
  role: string;
  notes: string | null;
};

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const dow = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(year, month, 1 - dow);
  return start;
}

function SchemaView() {
  const today = new Date();
  const [cursor, setCursor] = useState<{ y: number; m: number }>({ y: today.getFullYear(), m: today.getMonth() });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Shift> | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const [s, c, p] = await Promise.all([
      supabase.from("scheduled_shifts").select("*").order("date"),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("profiles").select("id,full_name,email").order("full_name"),
    ]);
    if (s.error) setError(s.error.message);
    setShifts((s.data as Shift[]) ?? []);
    setClients((c.data as Client[]) ?? []);
    setStaff((p.data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const staffName = (id: string) => {
    const u = staff.find((x) => x.id === id);
    return u?.full_name || u?.email || id.slice(0, 8);
  };
  const clientName = (id: string | null) => id ? clients.find((c) => c.id === id)?.name ?? "—" : "—";

  const gridStart = startOfMonthGrid(cursor.y, cursor.m);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const visibleShifts = useMemo(
    () => filterUserId === "all" ? shifts : shifts.filter((s) => s.user_id === filterUserId),
    [shifts, filterUserId],
  );

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const sh of visibleShifts) {
      const arr = map.get(sh.date) ?? [];
      arr.push(sh);
      map.set(sh.date, arr);
    }
    return map;
  }, [visibleShifts]);

  const openNew = (date: string) => {
    setEditing({
      date,
      start_time: "07:00",
      end_time: "16:00",
      role: ROLES[0],
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.user_id || !editing.date || !editing.start_time || !editing.end_time || !editing.role) {
      alert("Fyll i personal, datum, tid och roll."); return;
    }
    const payload = {
      user_id: editing.user_id,
      client_id: editing.client_id || null,
      location: editing.location ?? null,
      date: editing.date,
      start_time: editing.start_time,
      end_time: editing.end_time,
      role: editing.role,
      notes: editing.notes ?? null,
    };
    const res = editing.id
      ? await supabase.from("scheduled_shifts").update(payload).eq("id", editing.id)
      : await supabase.from("scheduled_shifts").insert(payload);
    if (res.error) { alert(res.error.message); return; }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort detta planerade pass?")) return;
    await supabase.from("scheduled_shifts").delete().eq("id", id);
    setEditing(null);
    load();
  };

  const prev = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 });
  const next = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 });

  return (
    <div className="px-10 py-12 max-w-[1400px]">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Admin Översikt</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Schema & Planering</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Klicka på en dag i kalendern för att planera ett arbetspass.
          </p>
        </div>
        <button
          onClick={() => openNew(ymd(new Date()))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider transition"
          style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Planera arbetspass
        </button>
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4 flex gap-3"
          style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)", backgroundColor: "color-mix(in srgb, var(--destructive) 5%, transparent)" }}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Kunde inte ladda schema: {error}.<br />
            Kör SQL-migrationen <code>db/migrations/20260608_scheduled_shifts.sql</code> i Supabase.
          </div>
        </div>
      )}

      <div className="mb-5 rounded-2xl border p-4 flex flex-wrap items-center gap-3"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <label htmlFor="staff-filter" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">
          Filtrera per anställd
        </label>
        <select
          id="staff-filter"
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="flex-1 min-w-[240px] max-w-md px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "var(--foreground)", color: "var(--foreground)", border: "1px solid var(--border)", colorScheme: "dark" }}
        >
          <option value="all">Visa alla anställda</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name || s.email || s.id.slice(0, 8)}</option>
          ))}
        </select>
        {filterUserId !== "all" && (
          <button
            onClick={() => setFilterUserId("all")}
            className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider border hover:bg-accent/5"
            style={{ borderColor: "var(--border)" }}
          >
            Rensa filter
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {visibleShifts.length} av {shifts.length} pass
        </span>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>

        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold tracking-tight">
              {MONTHS_SV[cursor.m]} {cursor.y}
            </h2>
          </div>
          <div className="flex gap-1">
            <button onClick={prev} className="p-2 rounded-full hover:bg-accent/10"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}
              className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider border hover:bg-accent/5"
              style={{ borderColor: "var(--border)" }}>Idag</button>
            <button onClick={next} className="p-2 rounded-full hover:bg-accent/10"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ borderBottom: "1px solid var(--border)" }}>
          {DAYS_SV.map((d) => (
            <div key={d} className="px-3 py-2.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === cursor.m;
            const key = ymd(d);
            const isToday = key === ymd(today);
            const dayShifts = shiftsByDay.get(key) ?? [];
            return (
              <div
                key={i}
                onClick={() => openNew(key)}
                className="min-h-[120px] p-2 cursor-pointer transition hover:bg-accent/[0.04]"
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : undefined,
                  borderBottom: i < 35 ? "1px solid var(--border)" : undefined,
                  opacity: inMonth ? 1 : 0.4,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-medium tabular-nums"
                    style={{
                      color: isToday ? "var(--background)" : "var(--foreground)",
                      backgroundColor: isToday ? "var(--gold-soft)" : "transparent",
                      padding: isToday ? "2px 7px" : "2px 0",
                      borderRadius: 999,
                    }}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayShifts.slice(0, 3).map((sh) => (
                    <div
                      key={sh.id}
                      onClick={(e) => { e.stopPropagation(); setEditing(sh); }}
                      className="text-[10px] px-1.5 py-1 rounded leading-tight truncate hover:opacity-80 transition"
                      style={{ backgroundColor: "color-mix(in srgb, var(--gold) 12%, transparent)", color: "var(--gold-soft)", border: "1px solid color-mix(in srgb, var(--gold) 20%, transparent)" }}
                      title={`${staffName(sh.user_id)} • ${sh.role} • ${sh.start_time.slice(0,5)}–${sh.end_time.slice(0,5)}`}
                    >
                      <span className="tabular-nums">{sh.start_time.slice(0,5)}</span> {staffName(sh.user_id).split(" ")[0]}
                    </div>
                  ))}
                  {dayShifts.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayShifts.length - 3} fler</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {loading ? "Hämtar..." : `${shifts.length} planerade pass totalt`}
      </p>

      {editing && (
        <EditModal
          shift={editing}
          staff={staff}
          clients={clients}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => remove(editing.id!) : undefined}
        />
      )}
    </div>
  );
}

function EditModal({
  shift, staff, clients, onChange, onClose, onSave, onDelete,
}: {
  shift: Partial<Shift>;
  staff: Profile[]; clients: Client[];
  onChange: (s: Partial<Shift>) => void;
  onClose: () => void; onSave: () => void; onDelete?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--card)" }} onClick={onClose}>
      <style>{`
        .ps-input { background-color:#141414; color:#F5F5F7; border:1px solid var(--border); color-scheme: dark; }
        select.ps-input option { background-color:var(--popover); color:var(--foreground); }
        select.ps-input option:checked,
        select.ps-input option:hover { background: linear-gradient(var(--gold-soft),var(--gold-soft)); color:var(--background); }
      `}</style>
      <div className="rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-auto"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Schema</p>
            <h2 className="mt-1 text-xl font-semibold">{shift.id ? "Redigera arbetspass" : "Planera arbetspass"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <StaffPicker
            date={shift.date}
            value={shift.user_id ?? ""}
            staff={staff}
            currentShiftId={shift.id}
            onChange={(uid) => onChange({ ...shift, user_id: uid })}
          />


          <div className="grid grid-cols-2 gap-4">
            <Field label="Kund / Företag">
              <select className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                value={shift.client_id ?? ""} onChange={(e) => onChange({ ...shift, client_id: e.target.value })}>
                <option value="">— Ingen kund —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Roll">
              <select className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                value={shift.role ?? ROLES[0]} onChange={(e) => onChange({ ...shift, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Plats / Event">
            <div className="relative">
              <MapPin className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="t.ex. Stockholmsmässan"
                className="ps-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                value={shift.location ?? ""}
                onChange={(e) => onChange({ ...shift, location: e.target.value })}
              />
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Datum">
              <input type="date" className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                value={shift.date ?? ""} onChange={(e) => onChange({ ...shift, date: e.target.value })} />
            </Field>
            <Field label="Start">
              <input type="time" className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                value={shift.start_time ?? ""} onChange={(e) => onChange({ ...shift, start_time: e.target.value })} />
            </Field>
            <Field label="Slut">
              <input type="time" className="ps-input w-full px-3 py-2 rounded-lg text-sm"
                value={shift.end_time ?? ""} onChange={(e) => onChange({ ...shift, end_time: e.target.value })} />
            </Field>
          </div>

          <Field label="Anteckningar">
            <textarea rows={3} className="ps-input w-full px-3 py-2 rounded-lg text-sm"
              value={shift.notes ?? ""} onChange={(e) => onChange({ ...shift, notes: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 p-6" style={{ borderTop: "1px solid var(--border)" }}>
          {onDelete ? (
            <button onClick={onDelete}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs uppercase tracking-wider border hover:bg-red-500/10 transition"
              style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }}>
              <Trash2 className="h-3.5 w-3.5" /> Ta bort
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-full text-xs uppercase tracking-wider border hover:bg-accent/5 transition"
              style={{ borderColor: "var(--border)" }}>Avbryt</button>
            <button onClick={onSave}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs uppercase tracking-wider transition"
              style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}>
              <Clock className="h-3.5 w-3.5" /> Spara pass
            </button>
          </div>
        </div>
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

type AvailMap = Map<string, "available" | "booked" | "unknown">;

function StaffPicker({
  date, value, staff, currentShiftId, onChange,
}: {
  date?: string;
  value: string;
  staff: Profile[];
  currentShiftId?: string;
  onChange: (uid: string) => void;
}) {
  const [avail, setAvail] = useState<AvailMap>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) { setAvail(new Map()); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from("availability").select("user_id,status").eq("date", date),
        supabase.from("scheduled_shifts").select("id,user_id").eq("date", date),
      ]);
      if (cancelled) return;
      const m: AvailMap = new Map();
      for (const row of (b.data ?? []) as { id: string; user_id: string }[]) {
        if (row.id !== currentShiftId) m.set(row.user_id, "booked");
      }
      for (const row of (a.data ?? []) as { user_id: string; status: string }[]) {
        if (row.status === "available" && m.get(row.user_id) !== "booked") {
          m.set(row.user_id, "available");
        }
      }
      setAvail(m);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [date, currentShiftId]);

  const sorted = useMemo(() => {
    const rank = (id: string) => {
      const s = avail.get(id);
      if (s === "available") return 0;
      if (s === "booked") return 2;
      return 1;
    };
    return [...staff].sort((x, y) => {
      const d = rank(x.id) - rank(y.id);
      if (d !== 0) return d;
      return (x.full_name || x.email || "").localeCompare(y.full_name || y.email || "", "sv");
    });
  }, [staff, avail]);

  const selected = staff.find((s) => s.id === value);
  const selectedStatus = value ? avail.get(value) : undefined;

  return (
    <Field label={date ? `Personal (tillgänglighet ${date})` : "Personal"}>
      <select
        className="ps-input w-full px-3 py-2 rounded-lg text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Välj personal...</option>
        {sorted.map((s) => {
          const status = avail.get(s.id);
          const tag = status === "available" ? "🟢 Tillgänglig" : status === "booked" ? "⛔ Bokad" : "";
          const name = s.full_name || s.email || s.id.slice(0, 8);
          return (
            <option key={s.id} value={s.id}>
              {tag ? `${tag} — ${name}` : name}
            </option>
          );
        })}
      </select>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        {loading && <span>Hämtar tillgänglighet…</span>}
        {!loading && date && (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--ok)" }} />
              Tillgänglig
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--destructive)" }} />
              Bokad samma dag
            </span>
            {selected && selectedStatus === "booked" && (
              <span style={{ color: "var(--destructive)" }} className="ml-auto">
                ⚠ {selected.full_name || selected.email} har redan ett pass denna dag
              </span>
            )}
          </>
        )}
      </div>
    </Field>
  );
}

