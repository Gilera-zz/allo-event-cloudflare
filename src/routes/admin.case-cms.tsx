import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileImage,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  caseCredits,
  caseFacts,
  caseGallery,
  caseServices,
  caseTimeline,
  demoCasePayload,
  PROJECT_CASE_SELECT,
  slugifyCaseTitle,
  type CaseCredit,
  type CaseFact,
  type CaseGalleryItem,
  type CaseTimelineItem,
  type ProjectCase,
} from "@/lib/project-case";

export const Route = createFileRoute("/admin/case-cms")({
  component: CaseCmsView,
});

type Draft = Omit<ProjectCase, "case_services" | "case_facts" | "case_timeline" | "case_gallery" | "case_credits"> & {
  case_services: string[];
  case_facts: CaseFact[];
  case_timeline: CaseTimelineItem[];
  case_gallery: CaseGalleryItem[];
  case_credits: CaseCredit[];
};

const EMPTY_DRAFT: Draft = {
  id: "",
  title: "",
  category: "",
  location: "",
  starts_at: null,
  ends_at: null,
  positions_needed: null,
  image_url: "",
  description: "",
  status: "",
  slug: "",
  case_published: false,
  case_featured: false,
  case_sort_order: 100,
  case_client_name: "",
  case_venue: "",
  case_year: new Date().getFullYear(),
  case_subtitle: "",
  case_excerpt: "",
  case_hero_image_url: "",
  case_hero_video_url: "",
  case_intro_title: "",
  case_intro_body: "",
  case_challenge_title: "",
  case_challenge_body: "",
  case_solution_title: "",
  case_solution_body: "",
  case_result_title: "",
  case_result_body: "",
  case_services: [],
  case_facts: [],
  case_timeline: [],
  case_gallery: [],
  case_credits: [],
  case_quote: "",
  case_quote_author: "",
  case_quote_role: "",
  case_cta_title: "",
  case_cta_body: "",
  seo_title: "",
  seo_description: "",
  og_image_url: "",
  case_published_at: null,
};

function normalizeProject(p: ProjectCase): Draft {
  return {
    ...EMPTY_DRAFT,
    ...p,
    case_services: caseServices(p),
    case_facts: caseFacts(p),
    case_timeline: caseTimeline(p),
    case_gallery: caseGallery(p),
    case_credits: caseCredits(p),
  };
}

function CaseCmsView() {
  const [projects, setProjects] = useState<ProjectCase[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");

  const load = async (preferredId?: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_CASE_SELECT)
      .order("starts_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Case CMS load error", error);
      setMigrationMissing(/column|case_|slug/i.test(error.message));
      toast.error("Case CMS-fälten saknas i Supabase. Kör migrationen först.");
      setLoading(false);
      return;
    }

    const list = (data ?? []) as ProjectCase[];
    setProjects(list);
    setMigrationMissing(false);
    const nextId = preferredId && list.some((p) => p.id === preferredId) ? preferredId : selectedId && list.some((p) => p.id === selectedId) ? selectedId : list[0]?.id ?? "";
    setSelectedId(nextId);
    const selected = list.find((p) => p.id === nextId);
    setDraft(selected ? normalizeProject(selected) : EMPTY_DRAFT);
    setLoading(false);
  };

  useEffect(() => {
    const preferred = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("project") || undefined : undefined;
    void load(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const project = projects.find((p) => p.id === selectedId);
    if (project) setDraft(normalizeProject(project));
  }, [selectedId, projects]);

  const visibleProjects = useMemo(() => {
    if (filter === "published") return projects.filter((p) => p.case_published);
    if (filter === "drafts") return projects.filter((p) => !p.case_published);
    return projects;
  }, [filter, projects]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    if (!draft.id) return;
    if (!draft.title?.trim()) {
      toast.error("Projektet behöver en titel.");
      return;
    }
    if (draft.case_published && !draft.slug?.trim()) {
      toast.error("Ett publicerat case behöver en slug.");
      return;
    }

    setSaving(true);
    const payload = {
      title: draft.title?.trim() || null,
      category: draft.category?.trim() || null,
      location: draft.location?.trim() || null,
      starts_at: draft.starts_at || null,
      ends_at: draft.ends_at || null,
      positions_needed: draft.positions_needed ?? null,
      image_url: draft.image_url?.trim() || null,
      description: draft.description?.trim() || null,
      status: draft.status?.trim() || null,
      slug: draft.slug?.trim() || null,
      case_published: !!draft.case_published,
      case_featured: !!draft.case_featured,
      case_sort_order: Number(draft.case_sort_order ?? 100),
      case_client_name: draft.case_client_name?.trim() || null,
      case_venue: draft.case_venue?.trim() || null,
      case_year: draft.case_year ? Number(draft.case_year) : null,
      case_subtitle: draft.case_subtitle?.trim() || null,
      case_excerpt: draft.case_excerpt?.trim() || null,
      case_hero_image_url: draft.case_hero_image_url?.trim() || null,
      case_hero_video_url: draft.case_hero_video_url?.trim() || null,
      case_intro_title: draft.case_intro_title?.trim() || null,
      case_intro_body: draft.case_intro_body?.trim() || null,
      case_challenge_title: draft.case_challenge_title?.trim() || null,
      case_challenge_body: draft.case_challenge_body?.trim() || null,
      case_solution_title: draft.case_solution_title?.trim() || null,
      case_solution_body: draft.case_solution_body?.trim() || null,
      case_result_title: draft.case_result_title?.trim() || null,
      case_result_body: draft.case_result_body?.trim() || null,
      case_services: draft.case_services,
      case_facts: draft.case_facts,
      case_timeline: draft.case_timeline,
      case_gallery: draft.case_gallery,
      case_credits: draft.case_credits,
      case_quote: draft.case_quote?.trim() || null,
      case_quote_author: draft.case_quote_author?.trim() || null,
      case_quote_role: draft.case_quote_role?.trim() || null,
      case_cta_title: draft.case_cta_title?.trim() || null,
      case_cta_body: draft.case_cta_body?.trim() || null,
      seo_title: draft.seo_title?.trim() || null,
      seo_description: draft.seo_description?.trim() || null,
      og_image_url: draft.og_image_url?.trim() || null,
      case_published_at: draft.case_published ? draft.case_published_at || new Date().toISOString() : null,
    };

    const { error } = await supabase.from("projects").update(payload).eq("id", draft.id);
    if (error) {
      console.error("Case CMS save error", error);
      toast.error(error.message);
    } else {
      toast.success(draft.case_published ? "Case sparat och publicerat." : "Case-utkast sparat.");
      await load(draft.id);
    }
    setSaving(false);
  };

  const applyDemo = () => {
    if (!draft.id) return;
    const demo = demoCasePayload();
    const next = normalizeProject({
      ...draft,
      ...demo,
      id: draft.id,
      slug: draft.slug || slugifyCaseTitle(draft.title || "case"),
    } as ProjectCase);
    setDraft(next);
    toast.success("Demo-innehåll laddat. Ingenting sparas förrän du klickar Spara.");
  };

  return (
    <div className="min-h-screen px-5 py-8 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6" style={{ borderColor: "var(--surface-line)" }}>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Projekt · Publicering</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Case CMS</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Bygg publika case direkt ovanpå era befintliga projekt. Driftdata och bemanning ligger kvar – här styr ni presentationen på alloevent.se.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={applyDemo} disabled={!draft.id} className="admin-case-secondary"><Sparkles className="h-4 w-4" />Fyll med demo-case</button>
            {draft.slug ? <a href={`/case/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="admin-case-secondary"><Eye className="h-4 w-4" />Förhandsvisa</a> : null}
            <button type="button" onClick={save} disabled={saving || !draft.id} className="admin-case-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Spara ändringar</button>
          </div>
        </div>

        {migrationMissing ? <MigrationNotice /> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="admin-case-project-list">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-4" style={{ borderColor: "var(--surface-line)" }}>
              <div>
                <div className="text-sm font-semibold">Projekt</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{projects.length} totalt</div>
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="admin-case-select h-9 w-auto px-2 text-xs">
                <option value="all">Alla</option>
                <option value="published">Publicerade</option>
                <option value="drafts">Utkast</option>
              </select>
            </div>
            <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-2">
              {loading ? <div className="p-4 text-sm text-muted-foreground">Laddar projekt…</div> : visibleProjects.map((project) => (
                <button key={project.id} type="button" onClick={() => setSelectedId(project.id)} className={`admin-case-project ${selectedId === project.id ? "is-active" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{project.title || "Utan titel"}</div>
                      <div className="mt-1 truncate text-[11px] text-muted-foreground">{project.location || project.category || "Ingen plats angiven"}</div>
                    </div>
                    <span className={`admin-case-status ${project.case_published ? "is-live" : ""}`}>{project.case_published ? "LIVE" : "DRAFT"}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0">
            {!draft.id ? <div className="admin-case-panel p-8 text-sm text-muted-foreground">Välj ett projekt för att börja redigera.</div> : <ProjectEditor draft={draft} update={update} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProjectEditor({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) {
  return (
    <div className="space-y-6">
      <EditorSection eyebrow="01" title="Projekt & grundinfo" description="Det operativa projektet och de uppgifter som kan återanvändas på case-sidan.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Projekttitel" value={draft.title ?? ""} onChange={(v) => { update("title", v); if (!draft.slug) update("slug", slugifyCaseTitle(v)); }} required />
          <TextField label="Kategori" value={draft.category ?? ""} onChange={(v) => update("category", v)} placeholder="Eventproduktion" />
          <TextField label="Plats / stad" value={draft.location ?? ""} onChange={(v) => update("location", v)} placeholder="Stockholm" />
          <TextField label="Venue" value={draft.case_venue ?? ""} onChange={(v) => update("case_venue", v)} placeholder="Stockholmsmässan" />
          <TextField label="Kund / arrangör" value={draft.case_client_name ?? ""} onChange={(v) => update("case_client_name", v)} />
          <NumberField label="År" value={draft.case_year ?? undefined} onChange={(v) => update("case_year", v)} />
          <DateTimeField label="Start" value={draft.starts_at} onChange={(v) => update("starts_at", v)} />
          <DateTimeField label="Slut" value={draft.ends_at} onChange={(v) => update("ends_at", v)} />
          <NumberField label="Personalbehov" value={draft.positions_needed ?? undefined} onChange={(v) => update("positions_needed", v)} />
          <TextField label="Projektstatus" value={draft.status ?? ""} onChange={(v) => update("status", v)} placeholder="completed" />
        </div>
        <TextArea label="Intern / generell projektbeskrivning" value={draft.description ?? ""} onChange={(v) => update("description", v)} rows={4} />
      </EditorSection>

      <EditorSection eyebrow="02" title="Publicering & presentation" description="Styr om projektet syns som case och hur det presenteras i Selected Work.">
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField label="Publicera som case" description="Gör projektet synligt publikt på hemsidan." checked={!!draft.case_published} onChange={(v) => update("case_published", v)} />
          <ToggleField label="Featured case" description="Prioriteras i Selected Work på startsidan." checked={!!draft.case_featured} onChange={(v) => update("case_featured", v)} />
          <TextField label="Slug / URL" value={draft.slug ?? ""} onChange={(v) => update("slug", slugifyCaseTitle(v))} prefix="alloevent.se/case/" />
          <NumberField label="Visningsordning" value={draft.case_sort_order ?? 100} onChange={(v) => update("case_sort_order", v)} />
        </div>
        <TextField label="Underrubrik" value={draft.case_subtitle ?? ""} onChange={(v) => update("case_subtitle", v)} placeholder="En mening som sätter scenen." />
        <TextArea label="Kort ingress / teaser" value={draft.case_excerpt ?? ""} onChange={(v) => update("case_excerpt", v)} rows={3} />
      </EditorSection>

      <EditorSection eyebrow="03" title="Hero & media" description="Använd URL eller ladda upp till Supabase Storage. Hero-videon är valfri och bör vara kort, muted och optimerad.">
        <MediaField label="Projektbild / listbild" value={draft.image_url ?? ""} onChange={(v) => update("image_url", v)} projectId={draft.id} accept="image/*" />
        <MediaField label="Hero-bild" value={draft.case_hero_image_url ?? ""} onChange={(v) => update("case_hero_image_url", v)} projectId={draft.id} accept="image/*" />
        <MediaField label="Hero-video" value={draft.case_hero_video_url ?? ""} onChange={(v) => update("case_hero_video_url", v)} projectId={draft.id} accept="video/mp4,video/webm" />
        <MediaField label="Social / OG-bild" value={draft.og_image_url ?? ""} onChange={(v) => update("og_image_url", v)} projectId={draft.id} accept="image/*" />
      </EditorSection>

      <EditorSection eyebrow="04" title="Story" description="Skriv caset i tydliga block. Fält kan lämnas tomma – tomma block renderas inte publikt.">
        <StoryBlock titleLabel="Intro-rubrik" bodyLabel="Intro-text" title={draft.case_intro_title ?? ""} body={draft.case_intro_body ?? ""} onTitle={(v) => update("case_intro_title", v)} onBody={(v) => update("case_intro_body", v)} />
        <StoryBlock titleLabel="Utmaning – rubrik" bodyLabel="Utmaning – text" title={draft.case_challenge_title ?? ""} body={draft.case_challenge_body ?? ""} onTitle={(v) => update("case_challenge_title", v)} onBody={(v) => update("case_challenge_body", v)} />
        <StoryBlock titleLabel="Lösning – rubrik" bodyLabel="Lösning – text" title={draft.case_solution_title ?? ""} body={draft.case_solution_body ?? ""} onTitle={(v) => update("case_solution_title", v)} onBody={(v) => update("case_solution_body", v)} />
        <StoryBlock titleLabel="Resultat – rubrik" bodyLabel="Resultat – text" title={draft.case_result_title ?? ""} body={draft.case_result_body ?? ""} onTitle={(v) => update("case_result_title", v)} onBody={(v) => update("case_result_body", v)} />
      </EditorSection>

      <EditorSection eyebrow="05" title="Tjänster" description="Taggar som visar vad Allo faktiskt levererade.">
        <StringList values={draft.case_services} onChange={(v) => update("case_services", v)} placeholder="Ex. Monterbygg" />
      </EditorSection>

      <EditorSection eyebrow="06" title="Snabba fakta" description="Valfria siffror och fakta. Använd bara verifierade värden på riktiga case.">
        <PairList values={draft.case_facts} onChange={(v) => update("case_facts", v)} leftLabel="Etikett" rightLabel="Värde" leftPlaceholder="Crew" rightPlaceholder="18 personer" />
      </EditorSection>

      <EditorSection eyebrow="07" title="Tidslinje / behind the build" description="Gör produktionen levande med milstolpar från load-in till doors open.">
        <TimelineList values={draft.case_timeline} onChange={(v) => update("case_timeline", v)} />
      </EditorSection>

      <EditorSection eyebrow="08" title="Galleri" description="Bilder visas i den ordning de ligger här. Välj layout per bild för mer editorial rytm.">
        <GalleryList values={draft.case_gallery} onChange={(v) => update("case_gallery", v)} projectId={draft.id} />
      </EditorSection>

      <EditorSection eyebrow="09" title="Citat & credits" description="Valfritt kundcitat samt credits för leveransen.">
        <TextArea label="Citat" value={draft.case_quote ?? ""} onChange={(v) => update("case_quote", v)} rows={4} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Namn" value={draft.case_quote_author ?? ""} onChange={(v) => update("case_quote_author", v)} />
          <TextField label="Roll / företag" value={draft.case_quote_role ?? ""} onChange={(v) => update("case_quote_role", v)} />
        </div>
        <PairList values={draft.case_credits} onChange={(v) => update("case_credits", v)} leftLabel="Credit" rightLabel="Värde" leftPlaceholder="Projektledning" rightPlaceholder="Allo Event" />
      </EditorSection>

      <EditorSection eyebrow="10" title="CTA & SEO" description="Avslutningen på caset och metadata för sök/social delning.">
        <TextField label="CTA-rubrik" value={draft.case_cta_title ?? ""} onChange={(v) => update("case_cta_title", v)} placeholder="Har ni något som ska byggas?" />
        <TextArea label="CTA-text" value={draft.case_cta_body ?? ""} onChange={(v) => update("case_cta_body", v)} rows={3} />
        <TextField label="SEO-titel" value={draft.seo_title ?? ""} onChange={(v) => update("seo_title", v)} />
        <TextArea label="Meta description" value={draft.seo_description ?? ""} onChange={(v) => update("seo_description", v)} rows={3} />
      </EditorSection>
    </div>
  );
}

function MigrationNotice() {
  return (
    <div className="mt-6 rounded-sm border p-5" style={{ borderColor: "color-mix(in srgb, var(--warn) 45%, transparent)", background: "color-mix(in srgb, var(--warn) 7%, transparent)" }}>
      <div className="font-semibold">Supabase behöver Case CMS-migrationen</div>
      <p className="mt-2 text-sm text-muted-foreground">Kör <code>db/migrations/20260823_project_case_cms.sql</code> i Supabase SQL Editor. Migrationen är additiv: den lägger case-fält ovanpå befintliga <code>projects</code> och skapar media-bucketen <code>case-media</code>.</p>
    </div>
  );
}

function EditorSection({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="admin-case-panel overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left md:px-6">
        <div className="flex gap-4">
          <span className="mt-1 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">{eyebrow}</span>
          <div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open ? <div className="space-y-5 border-t px-5 py-6 md:px-6" style={{ borderColor: "var(--surface-line)" }}>{children}</div> : null}
    </section>
  );
}

function TextField({ label, value, onChange, placeholder, prefix, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; prefix?: string; required?: boolean }) {
  return <label className="admin-case-field"><span>{label}{required ? " *" : ""}</span>{prefix ? <div className="admin-case-input-prefix"><small>{prefix}</small><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div> : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}</label>;
}

function NumberField({ label, value, onChange }: { label: string; value?: number | null; onChange: (value: number | null) => void }) {
  return <label className="admin-case-field"><span>{label}</span><input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} /></label>;
}

function DateTimeField({ label, value, onChange }: { label: string; value?: string | null; onChange: (value: string | null) => void }) {
  const local = (() => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return shifted.toISOString().slice(0, 16);
  })();
  return <label className="admin-case-field"><span>{label}</span><input type="datetime-local" value={local} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>;
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="admin-case-field"><span>{label}</span><textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function ToggleField({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="admin-case-toggle"><div><strong>{label}</strong><span>{description}</span></div><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={checked ? "is-on" : ""}><i>{checked ? <Check className="h-3 w-3" /> : null}</i></button></label>;
}

function StoryBlock({ titleLabel, bodyLabel, title, body, onTitle, onBody }: { titleLabel: string; bodyLabel: string; title: string; body: string; onTitle: (v: string) => void; onBody: (v: string) => void }) {
  return <div className="grid gap-4 border-b pb-5 last:border-b-0 last:pb-0 md:grid-cols-[0.72fr_1.28fr]" style={{ borderColor: "var(--surface-line)" }}><TextField label={titleLabel} value={title} onChange={onTitle} /><TextArea label={bodyLabel} value={body} onChange={onBody} rows={4} /></div>;
}

function moveItem<T>(values: T[], from: number, to: number) {
  if (to < 0 || to >= values.length || from === to) return values;
  const next = [...values];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function MoveButtons({ index, length, onMove }: { index: number; length: number; onMove: (to: number) => void }) {
  return (
    <div className="admin-case-move-buttons">
      <button type="button" aria-label="Flytta upp" disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp className="h-3.5 w-3.5" /></button>
      <button type="button" aria-label="Flytta ned" disabled={index === length - 1} onClick={() => onMove(index + 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function StringList({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const add = () => onChange([...values, ""]);
  return <div className="space-y-3">{values.map((value, index) => <div key={index} className="admin-case-row admin-case-row-reorder"><MoveButtons index={index} length={values.length} onMove={(to) => onChange(moveItem(values, index, to))} /><input value={value} onChange={(e) => onChange(values.map((v, i) => i === index ? e.target.value : v))} placeholder={placeholder} /><button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={add} className="admin-case-add"><Plus className="h-4 w-4" />Lägg till tjänst</button></div>;
}

function PairList({ values, onChange, leftLabel, rightLabel, leftPlaceholder, rightPlaceholder }: { values: { label: string; value: string }[]; onChange: (values: { label: string; value: string }[]) => void; leftLabel: string; rightLabel: string; leftPlaceholder?: string; rightPlaceholder?: string }) {
  const add = () => onChange([...values, { label: "", value: "" }]);
  return <div className="space-y-3">{values.map((item, index) => <div key={index} className="admin-case-row admin-case-row-pair"><MoveButtons index={index} length={values.length} onMove={(to) => onChange(moveItem(values, index, to))} /><label><span>{leftLabel}</span><input value={item.label} placeholder={leftPlaceholder} onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, label: e.target.value } : v))} /></label><label><span>{rightLabel}</span><input value={item.value} placeholder={rightPlaceholder} onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, value: e.target.value } : v))} /></label><button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={add} className="admin-case-add"><Plus className="h-4 w-4" />Lägg till rad</button></div>;
}

function TimelineList({ values, onChange }: { values: CaseTimelineItem[]; onChange: (values: CaseTimelineItem[]) => void }) {
  return <div className="space-y-3">{values.map((item, index) => <div key={index} className="admin-case-row admin-case-row-timeline"><MoveButtons index={index} length={values.length} onMove={(to) => onChange(moveItem(values, index, to))} /><input value={item.time} placeholder="06:30" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, time: e.target.value } : v))} /><input value={item.title} placeholder="Load-in" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, title: e.target.value } : v))} /><input value={item.detail ?? ""} placeholder="Kort detalj…" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, detail: e.target.value } : v))} /><button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={() => onChange([...values, { time: "", title: "", detail: "" }])} className="admin-case-add"><Plus className="h-4 w-4" />Lägg till steg</button></div>;
}

function GalleryList({ values, onChange, projectId }: { values: CaseGalleryItem[]; onChange: (values: CaseGalleryItem[]) => void; projectId: string }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    const url = await uploadCaseMedia(projectId, file);
    if (url) onChange([...values, { url, alt: file.name.replace(/[-_]/g, " "), caption: "", layout: "half" }]);
    setUploading(false);
  };
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{values.map((item, index) => <div key={index} className="admin-case-gallery-item">{item.url ? <img src={item.url} alt={item.alt || "Galleri"} /> : <div className="admin-case-gallery-placeholder"><FileImage className="h-7 w-7" /></div>}<div className="space-y-2 p-3"><input value={item.url} placeholder="Bild-URL" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, url: e.target.value } : v))} /><input value={item.alt} placeholder="Alt-text" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, alt: e.target.value } : v))} /><input value={item.caption ?? ""} placeholder="Bildtext" onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, caption: e.target.value } : v))} /><div className="flex gap-2"><select value={item.layout ?? "half"} onChange={(e) => onChange(values.map((v, i) => i === index ? { ...v, layout: e.target.value as CaseGalleryItem["layout"] } : v))} className="admin-case-select flex-1"><option value="wide">Wide</option><option value="half">Half</option><option value="portrait">Portrait</option></select><MoveButtons index={index} length={values.length} onMove={(to) => onChange(moveItem(values, index, to))} /><button type="button" className="admin-case-icon-button" onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button></div></div></div>)}</div><div className="flex flex-wrap gap-2"><label className="admin-case-add cursor-pointer"><Upload className="h-4 w-4" />{uploading ? "Laddar upp…" : "Ladda upp bild"}<input className="sr-only" type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = ""; }} /></label><button type="button" className="admin-case-add" onClick={() => onChange([...values, { url: "", alt: "", caption: "", layout: "half" }])}><Plus className="h-4 w-4" />Lägg till URL</button></div></div>;
}

function MediaField({ label, value, onChange, projectId, accept }: { label: string; value: string; onChange: (value: string) => void; projectId: string; accept: string }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    const url = await uploadCaseMedia(projectId, file);
    if (url) onChange(url);
    setUploading(false);
  };
  const isImage = value && !/\.(mp4|webm)(\?|$)/i.test(value);
  return <div className="admin-case-media-field"><div className="min-w-0 flex-1"><TextField label={label} value={value} onChange={onChange} placeholder="https://…" /><div className="mt-2 flex flex-wrap gap-2"><label className="admin-case-add cursor-pointer"><Upload className="h-4 w-4" />{uploading ? "Laddar upp…" : "Ladda upp"}<input className="sr-only" type="file" accept={accept} disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = ""; }} /></label>{value ? <button type="button" className="admin-case-add" onClick={() => navigator.clipboard?.writeText(value)}><Copy className="h-4 w-4" />Kopiera URL</button> : null}</div></div>{isImage ? <img src={value} alt="Förhandsvisning" className="h-28 w-44 shrink-0 object-cover" /> : null}</div>;
}

async function uploadCaseMedia(projectId: string, file: File) {
  try {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${projectId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("case-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("case-media").getPublicUrl(path);
    toast.success("Media uppladdad.");
    return data.publicUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Uppladdningen misslyckades.";
    toast.error(message);
    return null;
  }
}
