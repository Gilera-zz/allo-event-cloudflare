import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Eye,
  Image as ImageIcon,
  Loader2,
  MonitorPlay,
  Save,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOMEPAGE_HERO,
  HOMEPAGE_HERO_CASE_SELECT,
  HOMEPAGE_HERO_SETTINGS_SELECT,
  type HomepageHeroCase,
  type HomepageHeroSettings,
  type HeroMode,
} from "@/lib/homepage-hero";

export const Route = createFileRoute("/admin/homepage")({
  component: HomepageSettingsView,
});

type CaseChoice = HomepageHeroCase & { show: boolean; priority: number };

function HomepageSettingsView() {
  const [draft, setDraft] = useState<HomepageHeroSettings>(DEFAULT_HOMEPAGE_HERO);
  const [cases, setCases] = useState<CaseChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [migrationMissing, setMigrationMissing] = useState(false);

  const load = async () => {
    setLoading(true);
    setMigrationMissing(false);

    const settingsResult = await supabase
      .from("site_settings")
      .select(HOMEPAGE_HERO_SETTINGS_SELECT)
      .eq("id", "homepage")
      .maybeSingle();

    if (settingsResult.error) {
      console.error("Homepage settings load error", settingsResult.error);
      setMigrationMissing(true);
      setLoading(false);
      return;
    }

    setDraft({ ...DEFAULT_HOMEPAGE_HERO, ...((settingsResult.data ?? {}) as Partial<HomepageHeroSettings>) });

    const casesResult = await supabase
      .from("projects")
      .select(HOMEPAGE_HERO_CASE_SELECT)
      .eq("case_published", true)
      .order("case_hero_priority", { ascending: true })
      .order("case_sort_order", { ascending: true });

    if (casesResult.error) {
      console.error("Hero cases load error", casesResult.error);
      if (/case_show_in_hero|case_hero_priority|column/i.test(casesResult.error.message)) setMigrationMissing(true);
    } else {
      setCases(((casesResult.data ?? []) as HomepageHeroCase[]).map((item) => ({
        ...item,
        show: !!item.case_show_in_hero,
        priority: Number(item.case_hero_priority ?? 100),
      })));
    }

    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const selectedCases = useMemo(
    () => [...cases].filter((item) => item.show).sort((a, b) => a.priority - b.priority),
    [cases],
  );

  const previewImage = draft.hero_mode === "cases"
    ? selectedCases.find((item) => item.case_hero_image_url || item.image_url)?.case_hero_image_url || selectedCases.find((item) => item.image_url)?.image_url || draft.hero_image_url
    : draft.hero_image_url;

  const update = <K extends keyof HomepageHeroSettings>(key: K, value: HomepageHeroSettings[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        id: "homepage",
        hero_mode: draft.hero_mode,
        hero_image_url: draft.hero_image_url?.trim() || null,
        hero_mobile_image_url: draft.hero_mobile_image_url?.trim() || null,
        hero_image_position: draft.hero_image_position || "center center",
        hero_overlay: Math.max(0, Math.min(90, Number(draft.hero_overlay) || 66)),
        hero_slide_seconds: Math.max(3, Math.min(30, Number(draft.hero_slide_seconds) || 7)),
        hero_slow_zoom: !!draft.hero_slow_zoom,
        hero_show_case_meta: !!draft.hero_show_case_meta,
        updated_at: new Date().toISOString(),
      };

      const { error: settingsError } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
      if (settingsError) throw settingsError;

      for (const item of cases) {
        const { error } = await supabase
          .from("projects")
          .update({ case_show_in_hero: item.show, case_hero_priority: Number(item.priority || 100) })
          .eq("id", item.id);
        if (error) throw error;
      }

      toast.success("Startsidan är uppdaterad.");
      await load();
    } catch (error) {
      console.error("Homepage settings save error", error);
      toast.error(error instanceof Error ? error.message : "Kunde inte spara hero-inställningarna.");
    } finally {
      setSaving(false);
    }
  };

  const uploadHero = async (kind: "desktop" | "mobile", file: File) => {
    setUploading(kind);
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `hero/${kind}-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      update(kind === "desktop" ? "hero_image_url" : "hero_mobile_image_url", data.publicUrl);
      toast.success(kind === "desktop" ? "Hero-bild uppladdad." : "Mobilbild uppladdad.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Uppladdningen misslyckades.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="admin-page admin-homepage-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Hemsida · Första intrycket</p>
          <h1>Hero & startsida</h1>
          <p>Välj en kontrollerad huvudbild nu och växla över till ett automatiskt Case-bildspel när ert case-arkiv är redo.</p>
        </div>
        <div className="admin-header-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-button admin-button-secondary"><Eye className="h-4 w-4" />Förhandsvisa</a>
          <button type="button" onClick={save} disabled={saving || migrationMissing} className="admin-button admin-button-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Spara startsidan
          </button>
        </div>
      </div>

      {migrationMissing ? <HeroMigrationNotice /> : null}

      {migrationMissing ? null : loading ? (
        <div className="admin-panel admin-empty-state"><Loader2 className="h-4 w-4 animate-spin" />Laddar inställningar…</div>
      ) : (
        <div className="admin-homepage-layout">
          <section className="admin-panel admin-hero-preview-panel">
            <div className="admin-panel-heading">
              <div><p className="admin-kicker">Preview</p><h2>Startsidan</h2></div>
              <span className="admin-homepage-mode-badge">{draft.hero_mode === "fixed" ? "FAST HERO" : "CASE SLIDESHOW"}</span>
            </div>
            <div className="admin-hero-preview">
              {previewImage ? <img src={previewImage} alt="Hero preview" style={{ objectPosition: draft.hero_image_position }} /> : <div className="admin-hero-preview-fallback">ALLO</div>}
              <div className="admin-hero-preview-overlay" style={{ opacity: Math.max(0, Math.min(90, draft.hero_overlay)) / 100 }} />
              <div className="admin-hero-preview-copy">
                <span>EVENT · MÄSSA · BEMANNING · PRODUKTION</span>
                <strong>FRÅN FÖRSTA<br />INBÄRNING TILL<br />SISTA UTLASTNING.</strong>
              </div>
              {draft.hero_mode === "cases" && selectedCases.length ? (
                <div className="admin-hero-preview-case">
                  <small>01 / {String(selectedCases.length).padStart(2, "0")}</small>
                  <b>{selectedCases[0].title}</b>
                  <span>{[selectedCases[0].location, selectedCases[0].case_year].filter(Boolean).join(" · ")}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="admin-panel admin-homepage-settings-panel">
            <div className="admin-panel-heading"><div><p className="admin-kicker">01 · Visningsläge</p><h2>Hur ska hero fungera?</h2></div><MonitorPlay className="h-5 w-5" /></div>
            <div className="admin-homepage-mode-grid">
              <ModeCard active={draft.hero_mode === "fixed"} icon={ImageIcon} title="Fast hero" body="En manuellt vald bild. Rekommenderas tills ni har flera starka riktiga case." onClick={() => update("hero_mode", "fixed")} />
              <ModeCard active={draft.hero_mode === "cases"} icon={Sparkles} title="Case slideshow" body="Crossfade mellan publicerade case som ni uttryckligen väljer för startsidan." onClick={() => update("hero_mode", "cases")} />
            </div>
          </section>

          <section className="admin-panel admin-homepage-settings-panel">
            <div className="admin-panel-heading"><div><p className="admin-kicker">02 · Fast hero</p><h2>Bild & beskärning</h2></div><ImageIcon className="h-5 w-5" /></div>
            <div className="admin-homepage-form">
              <HeroMediaField label="Desktop hero" value={draft.hero_image_url ?? ""} uploading={uploading === "desktop"} onChange={(value) => update("hero_image_url", value)} onUpload={(file) => uploadHero("desktop", file)} />
              <HeroMediaField label="Mobil hero (valfri)" value={draft.hero_mobile_image_url ?? ""} uploading={uploading === "mobile"} onChange={(value) => update("hero_mobile_image_url", value)} onUpload={(file) => uploadHero("mobile", file)} />
              <label className="admin-case-field"><span>Bildposition</span><select value={draft.hero_image_position} onChange={(e) => update("hero_image_position", e.target.value)}>
                <option value="center center">Center</option><option value="center top">Top</option><option value="center bottom">Bottom</option><option value="left center">Vänster</option><option value="right center">Höger</option>
              </select></label>
              <RangeField label="Mörk overlay" value={draft.hero_overlay} min={35} max={85} suffix="%" onChange={(value) => update("hero_overlay", value)} />
            </div>
          </section>

          <section className="admin-panel admin-homepage-settings-panel">
            <div className="admin-panel-heading"><div><p className="admin-kicker">03 · Slideshow</p><h2>Rörelse & timing</h2></div><SlidersHorizontal className="h-5 w-5" /></div>
            <div className="admin-homepage-form admin-homepage-form-compact">
              <RangeField label="Tid per case" value={draft.hero_slide_seconds} min={4} max={15} suffix=" sek" onChange={(value) => update("hero_slide_seconds", value)} />
              <SettingToggle title="Slow zoom" body="Lätt kameradrift för mer filmisk känsla. Stängs automatiskt av vid Reduced Motion." checked={draft.hero_slow_zoom} onChange={(value) => update("hero_slow_zoom", value)} />
              <SettingToggle title="Visa case-info" body="Titel, plats, år och View Case visas diskret i hero." checked={draft.hero_show_case_meta} onChange={(value) => update("hero_show_case_meta", value)} />
            </div>
          </section>

          <section className="admin-panel admin-homepage-cases-panel">
            <div className="admin-panel-heading">
              <div><p className="admin-kicker">04 · Case slideshow</p><h2>Välj vilka case som får synas</h2></div>
              <span className="admin-homepage-mode-badge">{selectedCases.length} VALDA</span>
            </div>
            {cases.length ? (
              <div className="admin-homepage-case-list">
                {cases.map((item) => (
                  <div key={item.id} className={`admin-homepage-case-row ${item.show ? "is-selected" : ""}`}>
                    <button type="button" className="admin-homepage-case-check" onClick={() => setCases((list) => list.map((c) => c.id === item.id ? { ...c, show: !c.show } : c))} aria-label={item.show ? "Ta bort från hero" : "Visa i hero"}>{item.show ? <Check className="h-4 w-4" /> : null}</button>
                    <div className="admin-homepage-case-thumb">{item.case_hero_image_url || item.image_url ? <img src={item.case_hero_image_url || item.image_url || ""} alt="" /> : <span>ALLO</span>}</div>
                    <div className="admin-homepage-case-copy"><strong>{item.title || "Utan titel"}</strong><span>{[item.location, item.case_year, item.category].filter(Boolean).join(" · ") || "Publicerat case"}</span></div>
                    <label className="admin-homepage-priority"><span>PRIO</span><input type="number" value={item.priority} min={1} max={999} onChange={(e) => setCases((list) => list.map((c) => c.id === item.id ? { ...c, priority: Number(e.target.value) || 100 } : c))} /></label>
                    {item.slug ? <a href={`/case/${item.slug}`} target="_blank" rel="noopener noreferrer" className="admin-homepage-case-open" aria-label="Öppna case"><ArrowUpRight className="h-4 w-4" /></a> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">Publicera ett riktigt case i Case CMS först. Tills dess används er fasta hero.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ModeCard({ active, icon: Icon, title, body, onClick }: { active: boolean; icon: typeof ImageIcon; title: string; body: string; onClick: () => void }) {
  return <button type="button" className={`admin-homepage-mode-card ${active ? "is-active" : ""}`} onClick={onClick}><Icon className="h-5 w-5" /><strong>{title}</strong><span>{body}</span><i>{active ? "Aktivt" : "Välj"}</i></button>;
}

function HeroMediaField({ label, value, uploading, onChange, onUpload }: { label: string; value: string; uploading: boolean; onChange: (value: string) => void; onUpload: (file: File) => void }) {
  return <div className="admin-homepage-media-field"><label className="admin-case-field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" /></label><div className="admin-homepage-media-actions"><label className="admin-button admin-button-secondary cursor-pointer"><Upload className="h-4 w-4" />{uploading ? "Laddar upp…" : "Ladda upp bild"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.currentTarget.value = ""; }} /></label>{value ? <img src={value} alt="Förhandsvisning" /> : null}</div></div>;
}

function RangeField({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="admin-homepage-range"><span><b>{label}</b><em>{value}{suffix}</em></span><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

function SettingToggle({ title, body, checked, onChange }: { title: string; body: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" className={`admin-homepage-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}><div><strong>{title}</strong><span>{body}</span></div><i><b /></i></button>;
}

function HeroMigrationNotice() {
  return <div className="admin-homepage-migration"><strong>Hero-inställningarna behöver databasmigrationen.</strong><span>Kör <code>db/migrations/20260825_homepage_hero.sql</code> i Supabase SQL Editor. Den är additiv och tar inte bort befintliga projekt eller case.</span></div>;
}
