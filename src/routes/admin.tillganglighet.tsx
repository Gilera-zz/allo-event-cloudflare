import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/tillganglighet")({
  component: TillganglighetView,
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

type Row = { id: string; user_id: string; date: string; status: "available" | "unavailable" };

function TillganglighetView() {
  const { user } = useAuth();
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true); setError(null);
    const first = ymd(new Date(cursor.y, cursor.m, 1));
    const last = ymd(new Date(cursor.y, cursor.m + 1, 0));
    const { data, error } = await supabase
      .from("availability")
      .select("id,user_id,date,status")
      .eq("user_id", user.id)
      .gte("date", first).lte("date", last);
    if (error) setError(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id, cursor.y, cursor.m]);

  const byDate = useMemo(() => {
    const m = new Map<string, Row>();
    for (const r of rows) m.set(r.date, r);
    return m;
  }, [rows]);

  const toggle = async (date: string) => {
    if (!user) return;
    const existing = byDate.get(date);
    setBusy(date);
    if (!existing) {
      const { data, error } = await supabase
        .from("availability")
        .insert({ user_id: user.id, date, status: "available" })
        .select().single();
      if (!error && data) setRows((p) => [...p, data as Row]);
    } else if (existing.status === "available") {
      const { error } = await supabase.from("availability")
        .update({ status: "unavailable" }).eq("id", existing.id);
      if (!error) setRows((p) => p.map((r) => r.id === existing.id ? { ...r, status: "unavailable" } : r));
    } else {
      const { error } = await supabase.from("availability").delete().eq("id", existing.id);
      if (!error) setRows((p) => p.filter((r) => r.id !== existing.id));
    }
    setBusy(null);
  };

  const gridStart = startOfMonthGrid(cursor.y, cursor.m);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });
  const prev = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 });
  const next = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 });

  return (
    <div className="admin-page">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Min sida</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Tillgänglighet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Klicka på en dag för att växla: tom → <span style={{ color: "var(--ok)" }}>tillgänglig</span> → <span style={{ color: "var(--destructive)" }}>otillgänglig</span> → tom.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4 flex gap-3"
          style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)", backgroundColor: "color-mix(in srgb, var(--destructive) 5%, transparent)" }}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>Kunde inte ladda tillgänglighet: {error}. Kör <code>db/migrations/20260610_availability.sql</code> i Supabase.</div>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
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
            const row = byDate.get(key);
            const bg = row?.status === "available" ? "color-mix(in srgb, var(--ok) 14%, transparent)"
              : row?.status === "unavailable" ? "color-mix(in srgb, var(--destructive) 12%, transparent)"
              : "transparent";
            const ring = row?.status === "available" ? "color-mix(in srgb, var(--ok) 40%, transparent)"
              : row?.status === "unavailable" ? "color-mix(in srgb, var(--destructive) 40%, transparent)"
              : "transparent";
            return (
              <button
                key={i}
                onClick={() => toggle(key)}
                disabled={busy === key}
                className="min-h-[96px] p-2 text-left transition hover:bg-accent/[0.05]"
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : undefined,
                  borderBottom: i < 35 ? "1px solid var(--border)" : undefined,
                  opacity: inMonth ? 1 : 0.35,
                  backgroundColor: bg,
                  boxShadow: row ? `inset 0 0 0 1px ${ring}` : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tabular-nums"
                    style={{
                      color: isToday ? "var(--background)" : "var(--foreground)",
                      backgroundColor: isToday ? "var(--gold-soft)" : "transparent",
                      padding: isToday ? "2px 7px" : "2px 0",
                      borderRadius: 999,
                    }}>
                    {d.getDate()}
                  </span>
                  {row?.status === "available" && <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--ok)" }}>Ledig</span>}
                  {row?.status === "unavailable" && <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--destructive)" }}>Upptagen</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {loading ? "Hämtar..." : `${rows.filter(r => r.status === "available").length} lediga dagar denna månad`}
      </p>
    </div>
  );
}
