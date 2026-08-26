import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Mail, Phone, MapPin, Users, X, ArrowUpDown,
  LayoutGrid, List as ListIcon, Clock, IdCard, Shirt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/staff")({
  component: StaffView,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  bio: string | null;
  experience: string | null;
  role: string | null;
  roles: string[] | null;
  skills: string | null;
  special_skills: string[] | null;
  occupation: string | null;
  personal_id: string | null;
  clothing_size: string | null;
  is_admin: boolean | null;
  receive_job_notices: boolean | null;
  created_at: string;
};

const ROLE_FILTERS: { label: string; keywords: string[] }[] = [
  { label: "Alla", keywords: [] },
  { label: "Bygg & Hantverk", keywords: ["Bygg", "Rivare", "Målare", "Snickare"] },
  { label: "Event & Mässor", keywords: ["Event", "Mässor", "Stagehand"] },
  { label: "Servering", keywords: ["Servering", "Bröllop"] },
  { label: "Lager & Flytt", keywords: ["Lager", "Flyttpersonal", "Butik"] },
  { label: "Städ", keywords: ["Städ"] },
  { label: "Foto & Dekor", keywords: ["Fotograf", "Dekor", "Sampling"] },
];

function initials(name: string | null, email: string | null) {
  const s = (name ?? email ?? "?").trim();
  return s.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function formatSwedishDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

function mergedSkills(p: Profile): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (v: string | null | undefined) => {
    if (!v) return;
    const t = v.trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  (p.special_skills ?? []).forEach(push);
  if (p.skills) p.skills.split(/[,;\n|]/).forEach(push);
  (p.roles ?? []).forEach(push);
  return out;
}

function profileMatchesKeywords(p: Profile, keywords: string[]) {
  if (keywords.length === 0) return true;
  const haystack: string[] = [];
  if (p.role) haystack.push(p.role);
  if (p.roles) haystack.push(...p.roles);
  if (p.special_skills) haystack.push(...p.special_skills);
  if (p.skills) haystack.push(p.skills);
  if (p.occupation) haystack.push(p.occupation);
  if (p.bio) haystack.push(p.bio);
  if (p.experience) haystack.push(p.experience);
  const blob = haystack.join(" ").toLowerCase();
  return keywords.some((k) => blob.includes(k.toLowerCase()));
}

function StaffView() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  type SortKey = "newest" | "oldest" | "name_asc" | "name_desc";
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("Alla");
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setProfiles((data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: profiles.filter((p) => !p.is_admin).length,
      admins: profiles.filter((p) => p.is_admin).length,
      withExp: profiles.filter((p) => p.experience && p.experience.trim() !== "").length,
      today: profiles.filter((p) => (p.created_at ?? "").slice(0, 10) === today).length,
    };
  }, [profiles]);

  const visible = useMemo(() => {
    const activeFilter = ROLE_FILTERS.find((f) => f.label === filter)!;
    let list = profiles.filter((p) => !p.is_admin);
    list = list.filter((p) => profileMatchesKeywords(p, activeFilter.keywords));
    if (q.trim()) {
      const n = q.toLowerCase();
      list = list.filter((p) =>
        [p.full_name, p.email, p.address, p.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(n)),
      );
    }
    list = [...list].sort((a, b) => {
      if (sortKey === "name_asc" || sortKey === "name_desc") {
        const an = (a.full_name ?? "").toLowerCase();
        const bn = (b.full_name ?? "").toLowerCase();
        return sortKey === "name_asc" ? an.localeCompare(bn, "sv") : bn.localeCompare(an, "sv");
      }
      const at = new Date(a.created_at ?? 0).getTime();
      const bt = new Date(b.created_at ?? 0).getTime();
      return sortKey === "newest" ? bt - at : at - bt;
    });
    return list;
  }, [profiles, q, sortKey, filter]);

  return (
    <div className="admin-page">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Operations</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Personalinsyn</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loading ? "Hämtar..." : `Översikt och hantering av all personal`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <StatCard label="Totalt registrerade" value={stats.total} />
        <StatCard label="Administratörer" value={stats.admins} color="var(--gold)" />
        <StatCard label="Med erfarenhet" value={stats.withExp} color="var(--muted-foreground)" />
        <StatCard label="Registrerade idag" value={stats.today} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök namn, e-post, adress..."
            className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface-line)", borderRadius: "8px", color: "var(--foreground)" }}
          />
        </div>
        <div className="relative flex items-center" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface-line)", borderRadius: "8px" }}>
          <ArrowUpDown className="h-3.5 w-3.5 absolute left-2.5 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none bg-transparent pl-7 pr-7 py-2 text-xs focus:outline-none cursor-pointer"
            style={{ color: "var(--foreground)", colorScheme: "dark" }}
          >
            <option value="newest" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>Senaste registrerade</option>
            <option value="oldest" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>Äldsta registrerade</option>
            <option value="name_asc" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>Namn (A–Ö)</option>
            <option value="name_desc" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>Namn (Ö–A)</option>
          </select>
        </div>
        <div className="flex" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface-line)", borderRadius: "8px", overflow: "hidden" }}>
          <button onClick={() => setView("grid")} className="px-2.5 py-2" style={{ color: view === "grid" ? "var(--gold)" : "var(--muted-foreground)" }}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setView("list")} className="px-2.5 py-2" style={{ color: view === "list" ? "var(--gold)" : "var(--muted-foreground)" }}>
            <ListIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Role chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {ROLE_FILTERS.map((f) => {
          const active = filter === f.label;
          return (
            <button
              key={f.label}
              onClick={() => setFilter(f.label)}
              style={{
                backgroundColor: active ? "var(--gold-surface)" : "var(--surface)",
                border: `1px solid ${active ? "var(--gold-line)" : "var(--surface-line)"}`,
                color: active ? "var(--gold)" : "var(--muted-foreground)",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "11px",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border p-4 text-sm mb-4" style={{ borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)", color: "var(--destructive)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Laddar...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--surface-line)" }}>
          <Users className="h-6 w-6 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Ingen personal hittades i denna kategori</p>
        </div>
      ) : (
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5" : "flex flex-col gap-2.5"}>
          {visible.map((p) => (
            <PersonCard key={p.id} p={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {selected && <ProfileModal profile={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface-line)", borderRadius: "8px", padding: "10px 12px" }}>
      <div style={{ fontSize: "18px", fontWeight: 500, color: color ?? "var(--foreground)" }}>{value}</div>
      <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

function PersonCard({ p, onClick }: { p: Profile; onClick: () => void }) {
  const subtitle = p.role ?? p.roles?.[0] ?? null;
  const [notices, setNotices] = useState<boolean>(p.receive_job_notices ?? true);
  const [saving, setSaving] = useState(false);

  const toggleNotices = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    const next = !notices;
    setNotices(next);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ receive_job_notices: next })
      .eq("id", p.id);
    setSaving(false);
    if (error) {
      setNotices(!next);
      toast.error("Kunde inte spara", { description: error.message });
    } else {
      p.receive_job_notices = next;
      toast.success("Inställningar sparade");
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="text-left transition cursor-pointer"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface-line)", borderRadius: "10px", padding: "14px" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--surface-line)")}
    >
      <div className="flex items-start gap-2.5 mb-2.5">
        {p.avatar_url ? (
          <img src={p.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div className="flex items-center justify-center" style={{
            width: 40, height: 40, borderRadius: "50%",
            backgroundColor: "var(--gold-surface)", border: "1px solid var(--gold-line)", color: "var(--gold)", fontSize: 12, fontWeight: 600,
          }}>
            {initials(p.full_name, p.email)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }} className="truncate">{p.full_name ?? "Okänd"}</div>
          {subtitle && <div style={{ fontSize: 11, color: "var(--muted-foreground)" }} className="truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="space-y-1">
        {p.email && (
          <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            <Mail style={{ width: 12, height: 12, flexShrink: 0 }} /> <span className="truncate">{p.email}</span>
          </div>
        )}
        {p.address && (
          <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} /> <span className="truncate">{p.address}</span>
          </div>
        )}
      </div>
      {(() => {
        const all = mergedSkills(p);
        if (all.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {all.slice(0, 3).map((s) => (
              <span key={s} style={{
                backgroundColor: "var(--gold-surface)", border: "1px solid var(--gold-line)", color: "var(--gold)",
                fontSize: 10, padding: "1px 7px", borderRadius: 999,
              }}>{s}</span>
            ))}
          </div>
        );
      })()}
      <div
        className="flex items-center justify-between mt-3 pt-2.5"
        style={{ borderTop: "1px solid var(--surface-line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Jobbnotiser
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={notices}
          aria-label="Växla jobbnotiser"
          disabled={saving}
          onClick={toggleNotices}
          className="relative inline-flex items-center transition-colors"
          style={{
            width: 32, height: 18, borderRadius: 999,
            backgroundColor: notices ? "var(--gold)" : "var(--surface)",
            border: `1px solid ${notices ? "var(--gold)" : "var(--surface-line)"}`,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <span
            className="block transition-transform"
            style={{
              width: 12, height: 12, borderRadius: "50%",
              backgroundColor: notices ? "var(--background)" : "var(--muted-foreground)",
              transform: notices ? "translateX(16px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ profile: p, onClose }: { profile: Profile; onClose: () => void }) {
  const [lightbox, setLightbox] = useState(false);
  const subtitle = p.role ?? p.roles?.[0] ?? null;
  const bothEmpty = !p.bio && !p.experience;

  return (
    <>
      <div
        role="dialog" aria-modal="true"
        className="admin-profile-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="admin-profile-modal-panel relative w-full"
          style={{ maxWidth: 520, borderRadius: 14, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose} aria-label="Stäng"
            className="absolute top-4 right-4 flex items-center justify-center"
            style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: "var(--admin-bg-soft)", border: "1px solid var(--admin-border)", color: "var(--admin-muted)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Hero */}
          <div style={{ padding: 20, backgroundColor: "var(--admin-surface-solid)", borderBottom: "1px solid var(--admin-border)", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="flex items-start gap-3.5">
              <button onClick={() => setLightbox(true)} style={{ cursor: "pointer", border: "none", padding: 0, background: "transparent" }}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold)" }} />
                ) : (
                  <div className="flex items-center justify-center" style={{
                    width: 72, height: 72, borderRadius: "50%",
                    backgroundColor: "var(--gold-surface)", border: "2px solid var(--gold)", color: "var(--gold)", fontWeight: 600, fontSize: 22,
                  }}>{initials(p.full_name, p.email)}</div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h2 style={{ color: "var(--foreground)", fontSize: 17, fontWeight: 500 }}>{p.full_name ?? "Okänd"}</h2>
                {subtitle && <p style={{ color: "var(--gold)", fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mergedSkills(p).map((s) => (
                    <span key={s} style={{ backgroundColor: "var(--gold-surface)", border: "1px solid var(--gold-line)", color: "var(--gold)", borderRadius: 999, fontSize: 10, padding: "2px 8px" }}>{s}</span>
                  ))}
                  {p.occupation && (
                    <span style={{ backgroundColor: "var(--surface-line)", border: "1px solid var(--muted-foreground)", color: "var(--muted-foreground)", borderRadius: 999, fontSize: 10, padding: "2px 8px" }}>{p.occupation}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: 340, padding: "18px 20px", backgroundColor: "var(--admin-surface-solid)" }}>
            <Section title="KONTAKTUPPGIFTER">
              <ContactRows rows={[
                { icon: Mail, value: p.email },
                { icon: Phone, value: p.phone },
                { icon: MapPin, value: p.address },
              ]} />
            </Section>

            <Section title="ERFARENHET & KOMPETENSER">
              {bothEmpty ? (
                <p style={{ fontStyle: "italic", color: "var(--surface-line)", fontSize: 12 }}>Ingen information angiven</p>
              ) : (
                <div className="space-y-2">
                  {p.bio && <InsetBox label="Profil" text={p.bio} />}
                  {p.experience && <InsetBox label="Arbetslivserfarenhet" text={p.experience} />}
                </div>
              )}
            </Section>

            {(() => {
              const all = mergedSkills(p);
              if (all.length === 0) return null;
              return (
                <Section title="KOMPETENSER">
                  <div className="flex flex-wrap gap-1.5">
                    {all.map((s) => (
                      <span key={s} style={{ backgroundColor: "var(--gold-surface)", border: "1px solid var(--gold-line)", color: "var(--gold)", borderRadius: 999, fontSize: 10, padding: "2px 8px" }}>{s}</span>
                    ))}
                  </div>
                </Section>
              );
            })()}

            {(p.personal_id || p.clothing_size || p.created_at) && (
              <Section title="ÖVRIGT">
                <div className="space-y-1.5">
                  {p.personal_id && <MiscRow icon={IdCard} text={`Personnummer: ${p.personal_id}`} />}
                  {p.clothing_size && <MiscRow icon={Shirt} text={`Klädstorlek: ${p.clothing_size}`} />}
                  {p.created_at && <MiscRow icon={Clock} text={`Registrerad: ${formatSwedishDate(p.created_at)}`} />}
                </div>
              </Section>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2" style={{ padding: "12px 20px", borderTop: "1px solid var(--admin-border)", backgroundColor: "var(--admin-surface-solid)", borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button onClick={onClose} style={{ border: "1px solid var(--surface-line)", color: "var(--muted-foreground)", backgroundColor: "transparent", borderRadius: 7, padding: "7px 14px", fontSize: 12 }}>
              Stäng
            </button>
            <button
              onClick={() => { if (p.email) window.location.href = `mailto:${p.email}`; }}
              disabled={!p.email}
              style={{ backgroundColor: "var(--gold)", color: "var(--background)", fontWeight: 500, borderRadius: 7, padding: "7px 16px", fontSize: 12, opacity: p.email ? 1 : 0.5 }}
            >
              Kontakta
            </button>
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="admin-profile-lightbox-backdrop fixed inset-0 z-[60] flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setLightbox(false)}
        >
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" style={{ maxWidth: 320, width: "80vw", aspectRatio: "1/1", objectFit: "cover", borderRadius: "50%", border: "3px solid var(--gold)" }} />
          ) : (
            <div className="flex items-center justify-center" style={{
              width: 280, height: 280, borderRadius: "50%",
              backgroundColor: "var(--gold-surface)", border: "3px solid var(--gold)", color: "var(--gold)", fontSize: 72, fontWeight: 600,
            }}>{initials(p.full_name, p.email)}</div>
          )}
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 12, marginTop: 24 }}>Stäng</p>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <p style={{ color: "var(--admin-faint)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );
}

function ContactRows({ rows }: { rows: { icon: typeof Mail; value: string | null }[] }) {
  const filled = rows.filter((r) => r.value);
  return (
    <div>
      {filled.map((r, i) => {
        const Icon = r.icon;
        return (
          <div key={i} className="flex items-center gap-2" style={{
            color: "var(--muted-foreground)", fontSize: 12, padding: "6px 0",
            borderBottom: i === filled.length - 1 ? "none" : "1px solid var(--surface-line)",
          }}>
            <Icon style={{ width: 14, height: 14, color: "var(--gold)", flexShrink: 0 }} />
            <span className="truncate">{r.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function InsetBox({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p style={{ color: "var(--muted-foreground)", fontSize: 10, marginBottom: 4 }}>{label}</p>
      <div style={{ backgroundColor: "var(--admin-bg-soft)", border: "1px solid var(--admin-border)", borderRadius: 8, padding: 11, color: "var(--admin-muted)", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {text}
      </div>
    </div>
  );
}

function MiscRow({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
      <Icon style={{ width: 14, height: 14, color: "var(--gold)", flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}
