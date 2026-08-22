import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/mitt-schema")({
  component: MittSchemaView,
});

const MONTHS_SV = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAYS_SV = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const dow = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - dow);
  return start;
}

type Client = { id: string; name: string };
type Shift = {
  id: string; user_id: string; client_id: string | null; location: string | null;
  date: string; start_time: string; end_time: string; role: string; notes: string | null;
};

function MittSchemaView() {
  const { user } = useAuth();
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true); setError(null);
    const first = ymd(new Date(cursor.y, cursor.m, 1));
    const last = ymd(new Date(cursor.y, cursor.m + 1, 0));
    const [s, c] = await Promise.all([
      supabase.from("scheduled_shifts").select("*")
        .eq("user_id", user.id)
        .gte("date", first).lte("date", last)
        .order("date"),
      supabase.from("clients").select("id,name"),
    ]);
    if (s.error) setError(s.error.message);
    setShifts((s.data as Shift[]) ?? []);
    setClients((c.data as Client[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id, cursor.y, cursor.m]);

  const clientName = (id: string | null) => id ? clients.find((c) => c.id === id)?.name ?? "" : "";

  const byDate = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const sh of shifts) {
      const arr = m.get(sh.date) ?? [];
      arr.push(sh); m.set(sh.date, arr);
    }
    return m;
  }, [shifts]);

  const gridStart = startOfMonthGrid(cursor.y, cursor.m);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });
  const prev = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 });
  const next = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 });

  const upcoming = useMemo(() => {
    const t = ymd(today);
    return shifts.filter((s) => s.date >= t).slice(0, 5);
  }, [shifts]);

  return (
    <div className="px-10 py-12 max-w-[1300px]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Min sida</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Mitt schema</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dina tilldelade arbetspass från admin. Klicka på ett pass för detaljer.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4 flex gap-3"
          style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)", backgroundColor: "color-mix(in srgb, var(--destructive) 5%, transparent)" }}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>Kunde inte ladda schema: {error}</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6 rounded-2xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Kommande pass</p>
          <div className="space-y-2">
            {upcoming.map((sh) => (
              <div key={sh.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="tabular-nums w-24 text-muted-foreground">
                    {new Date(sh.date).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="font-medium">{sh.role}</span>
                  {sh.location && <span className="text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{sh.location}</span>}
                </div>
                <span className="tabular-nums text-muted-foreground">{sh.start_time.slice(0,5)}–{sh.end_time.slice(0,5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold tracking-tight">{MONTHS_SV[cursor.m]} {cursor.y}</h2>
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
          {DAYS_SV.map((d) => <div key={d} className="px-3 py-2.5">{d}</div>)}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === cursor.m;
            const key = ymd(d);
            const isToday = key === ymd(today);
            const dayShifts = byDate.get(key) ?? [];
            return (
              <div key={i}
                className="min-h-[120px] p-2"
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : undefined,
                  borderBottom: i < 35 ? "1px solid var(--border)" : undefined,
                  opacity: inMonth ? 1 : 0.4,
                }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium tabular-nums"
                    style={{
                      color: isToday ? "var(--background)" : "var(--foreground)",
                      backgroundColor: isToday ? "var(--gold-soft)" : "transparent",
                      padding: isToday ? "2px 7px" : "2px 0",
                      borderRadius: 999,
                    }}>
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayShifts.map((sh) => (
                    <div key={sh.id}
                      className="text-[10px] px-1.5 py-1 rounded leading-tight"
                      style={{ backgroundColor: "color-mix(in srgb, var(--gold) 12%, transparent)", color: "var(--gold-soft)", border: "1px solid color-mix(in srgb, var(--gold) 20%, transparent)" }}
                      title={`${sh.role} • ${sh.start_time.slice(0,5)}–${sh.end_time.slice(0,5)}${sh.location ? " • " + sh.location : ""}`}>
                      <div className="tabular-nums font-medium">{sh.start_time.slice(0,5)}–{sh.end_time.slice(0,5)}</div>
                      <div className="truncate">{sh.role}</div>
                      {sh.location && <div className="truncate opacity-80">{sh.location}</div>}
                      {clientName(sh.client_id) && <div className="truncate opacity-70">{clientName(sh.client_id)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {loading ? "Hämtar..." : `${shifts.length} pass i ${MONTHS_SV[cursor.m]}`}
      </p>
    </div>
  );
}
