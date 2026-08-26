import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Calendar, Users, X, Archive, ZoomIn } from "lucide-react";
import { supabase, supabaseConfigError } from "@/integrations/supabase/client";
import type { translations } from "@/lib/i18n";
import { caseServices, PROJECT_CASE_SELECT, type ProjectCase } from "@/lib/project-case";

type ProjectsT = {
  readonly [K in keyof (typeof translations)["sv"]["projectsSection"]]: string;
};

type Project = {
  id: string;
  title: string | null;
  category: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  positions_needed: number | null;
  image_url: string | null;
  description?: string | null;
  client_notes?: string | null;
  status?: string | null;
};

// No demo fallbacks: this section renders ONLY live data from Supabase.

function isCompleted(p: Project): boolean {
  // Explicit "completed" status always wins
  if (p.status && /completed|finished|closed|avslut|done|past|arkiv/i.test(p.status)) return true;
  // Otherwise classify by dates (portal buckets Kommande/Aktuella/Avslutade by date)
  const now = Date.now();
  if (p.ends_at) return new Date(p.ends_at).getTime() < now;
  if (p.starts_at) return new Date(p.starts_at).getTime() < now - 24 * 60 * 60 * 1000;
  return false;
}

function fmtRange(s: string | null, e: string | null) {
  if (!s) return "—";
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  const start = new Date(s).toLocaleDateString("sv-SE", opts);
  if (!e) return start;
  return `${start} → ${new Date(e).toLocaleDateString("sv-SE", opts)}`;
}

export function ProjectsSection({ t }: { t: ProjectsT }) {
  const [ongoing, setOngoing] = useState<Project[]>([]);
  const [completed, setCompleted] = useState<Project[]>([]);
  const [publishedCases, setPublishedCases] = useState<ProjectCase[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState<Project | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(PROJECT_CASE_SELECT)
          .eq("case_published", true)
          .eq("public_visible", true)
          .order("case_featured", { ascending: false })
          .order("case_sort_order", { ascending: true })
          .limit(8);
        if (!error && data) setPublishedCases(data as ProjectCase[]);
      } catch {
        // Case CMS migration may not have been applied yet. The demo case below
        // keeps the design preview usable without breaking existing projects.
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (supabaseConfigError) {
          console.error("SUPABASE FETCH ERROR:", { message: supabaseConfigError, source: "client_config" });
        }

        let data: Project[] | null = null;
        const res1 = await supabase
          .from("projects")
          .select("id,title,category,location,starts_at,ends_at,positions_needed,image_url,description,status")
          .eq("public_visible", true)
          .order("starts_at", { ascending: false, nullsFirst: false })
          .limit(60);
        if (res1.error) {
          // Fail closed: if the visibility migration is missing, do not expose
          // operational projects on the public website.
          console.warn("Public project visibility is not configured yet:", res1.error.message);
        } else {
          data = res1.data as Project[];
        }
        if (data) {
          setOngoing(data.filter((p) => !isCompleted(p)));
          setCompleted(data.filter((p) => isCompleted(p)));
        }
      } catch (error) {
        console.error("SUPABASE FETCH ERROR:", error);
      }
      setLoading(false);
    })();
  }, []);

  const total = ongoing.length;
  const hasPublicProjects = ongoing.length + completed.length > 0;
  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const visible = (() => {
    if (total <= 3) return ongoing;
    return [0, 1, 2].map((o) => ongoing[(index + o) % total]);
  })();

  return (
    <section id="projects" className="allo-anchor-section mx-auto max-w-6xl px-6 py-24">
      <SelectedCases cases={publishedCases} />

      {hasPublicProjects ? (
        <>
      <div className="allo-live-projects-heading flex items-end justify-between flex-wrap gap-4">
        <div>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] font-semibold"
            style={{
              color: "var(--gold)",
              backgroundColor: "color-mix(in srgb, var(--gold) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--gold) 25%, transparent)",
              backdropFilter: "blur(15px)",
            }}
          >
            {t.tag}
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold" style={{ color: "var(--foreground)" }}>
            {t.title}
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            {t.description}
          </p>
        </div>
        {total > 3 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label={t.previous}
              className="inline-flex items-center justify-center h-12 w-12 rounded-full transition-all hover:scale-105"
              style={{ border: "1px solid var(--gold-line)", backgroundColor: "var(--gold-surface)", color: "var(--gold)" }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t.next}
              className="inline-flex items-center justify-center h-12 w-12 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: "var(--gold)", color: "var(--background)" }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>


      {ongoing.length === 0 ? (
        <div
          className="mt-10 rounded-3xl p-12 text-center"
          style={{ backgroundColor: "var(--surface)", border: "1px dashed var(--surface-line)", color: "var(--muted-foreground)" }}
        >
          {loading ? t.loading : t.empty}
        </div>
      ) : (
        <div className="mt-10 -mx-6 md:mx-0 flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide gap-4 md:gap-6 px-6 md:px-0">
          {visible.map((p) => (
            <div key={p.id} className="snap-center shrink-0 w-[85%] sm:w-[60%] md:w-auto">
              <ProjectCard p={p} onOpen={() => setActive(p)} t={t} />
            </div>
          ))}
        </div>
      )}

      {total > 3 && (
        <div className="mt-8 flex justify-center gap-2">
          {ongoing.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`${t.goToSlide} ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? "32px" : "12px",
                backgroundColor: i === index ? "var(--gold)" : "var(--surface-line)",
              }}
            />
          ))}
        </div>
      )}

      {/* Completed archive toggle */}
      <div className="mt-14 flex justify-center">
        <button
          type="button"
          onClick={() => setShowArchive((v) => !v)}
          className="inline-flex items-center gap-2 px-6 h-12 rounded-full text-sm font-semibold uppercase tracking-[0.15em] transition-all hover:-translate-y-0.5"
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--gold-line)",
            color: "var(--gold)",
            boxShadow: showArchive ? "0 8px 30px color-mix(in srgb, var(--gold) 15%, transparent)" : "none",
          }}
        >
          <Archive className="h-4 w-4" />
          {showArchive ? t.hideArchive : `${t.showArchive}${completed.length ? ` (${completed.length})` : ""}`}
        </button>
      </div>

      {showArchive && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {completed.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              {t.emptyArchive}
            </p>
          ) : (
            <div className="-mx-6 md:mx-0 flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide gap-4 md:gap-6 px-6 md:px-0">
              {completed.map((p) => (
                <div key={p.id} className="snap-center shrink-0 w-[85%] sm:w-[60%] md:w-auto">
                  <ProjectCard p={p} onOpen={() => setActive(p)} muted t={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active && <ProjectModal p={active} onClose={() => setActive(null)} t={t} />}
        </>
      ) : null}
    </section>
  );
}

function SelectedCases({ cases }: { cases: ProjectCase[] }) {
  return (
    <div className="allo-selected-cases mb-20 md:mb-28">
      <div className="grid gap-6 lg:grid-cols-[.48fr_1.52fr] lg:items-end">
        <div>
          <span className="allo-selected-kicker">SELECTED WORK</span>
          <h2 className="allo-selected-title mt-4">Jobbet bakom upplevelsen.</h2>
        </div>
        <p className="allo-selected-intro">Från första load-in till öppnade dörrar. Här samlar vi utvalda produktioner och visar inte bara slutresultatet – utan människorna, logistiken och hantverket bakom.</p>
      </div>

      {cases.length ? (
        <div className="mt-10 grid gap-5">
          {cases.map((project, index) => <SelectedCaseCard key={project.id} project={project} index={index} />)}
        </div>
      ) : (
        <CaseArchiveComingSoon />
      )}
    </div>
  );
}

function CaseArchiveComingSoon() {
  return (
    <div className="allo-case-empty mt-10">
      <div className="allo-case-empty-grid" aria-hidden="true" />
      <div className="allo-case-empty-index" aria-hidden="true">01</div>
      <div className="allo-case-empty-content">
        <span>CASE ARCHIVE / COMING SOON</span>
        <h3>Vi dokumenterar det vi bygger.</h3>
        <p>Vårt case-arkiv är på väg. Här kommer vi att visa riktiga produktioner från första plan och load-in till färdig leverans – med bilder, team, tidslinje och detaljerna som får eventet att fungera.</p>
        <a href="#booking">Har ni något på gång? <ArrowRight className="h-4 w-4" /></a>
      </div>
      <div className="allo-case-empty-mark" aria-hidden="true">ALLO</div>
    </div>
  );
}

function SelectedCaseCard({ project, index }: { project: ProjectCase; index: number }) {
  const image = project.case_hero_image_url || project.image_url;
  const services = caseServices(project).slice(0, 4);
  const href = `/case/${project.slug || project.id}`;
  return (
    <a href={href} className="allo-selected-case group">
      <div className="allo-selected-case-media">
        {image ? <img src={image} alt={project.title || "Allo Event case"} /> : <div className="allo-selected-case-fallback">ALLO</div>}
        <div className="allo-selected-case-shade" />
        <div className="allo-selected-case-number">{String(index + 1).padStart(2, "0")}</div>
        <div className="allo-selected-case-view">VIEW CASE <ArrowRight className="h-4 w-4" /></div>
      </div>
      <div className="allo-selected-case-copy">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[.16em] text-muted-foreground">
          {project.location ? <span>{project.location}</span> : null}
          {project.case_year ? <span>{project.case_year}</span> : null}
          {project.category ? <span>{project.category}</span> : null}
        </div>
        <h3>{project.title}</h3>
        <p>{project.case_excerpt || project.case_subtitle || project.description}</p>
        {services.length ? <div className="allo-selected-tags">{services.map((service) => <span key={service}>{service}</span>)}</div> : null}
        <strong>Utforska caset <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></strong>
      </div>
    </a>
  );
}

function ProjectCard({ p, onOpen, muted, t }: { p: Project; onOpen: () => void; muted?: boolean; t: ProjectsT }) {
  return (
    <article
      className="group flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={onOpen}
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--surface-line)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        opacity: muted ? 0.92 : 1,
      }}
    >
      <div
        className="relative h-44 overflow-hidden"
        style={{
          background: p.image_url
            ? `url(${p.image_url}) center/cover`
            : "linear-gradient(135deg, var(--gold-surface) 0%, var(--surface) 60%, var(--background) 100%)",
        }}
      >
        {!p.image_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-5xl font-bold tracking-tighter opacity-30"
              style={{ color: "var(--gold)", fontFamily: "Urbanist, sans-serif" }}
            >
              ALLO
            </span>
          </div>
        )}
        {p.category && (
          <span
            className="absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: "var(--gold-surface)", color: "var(--gold)", border: "1px solid var(--gold-line)" }}
          >
            {p.category}
          </span>
        )}
        {muted && (
          <span
            className="absolute top-4 right-4 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: "rgba(10,10,10,0.7)", color: "var(--muted-foreground)", border: "1px solid var(--surface-line)" }}
          >
            {t.completedBadge}
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
          {p.title ?? t.untitled}
        </h3>
        <div className="mt-4 space-y-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {p.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
              {p.location}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
            {fmtRange(p.starts_at, p.ends_at)}
          </div>
          {p.positions_needed != null && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
              {p.positions_needed} {t.people}
            </div>
          )}
        </div>
        <span
          className="mt-6 inline-flex items-center gap-1 font-medium self-start"
          style={{ color: "var(--gold)", fontSize: "13px" }}
        >
          {t.readMore}
          <span className="transition-transform duration-300 group-hover:translate-x-[3px]">→</span>
        </span>
      </div>
    </article>
  );
}

function ProjectModal({ p, onClose, t }: { p: Project; onClose: () => void; t: ProjectsT }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const cats = (p.category ?? "")
    .split(/[,;/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: "var(--card)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface-line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors hover:scale-105"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--surface-line)", color: "var(--foreground)" }}
        >
          <X className="h-4 w-4" />
        </button>

        {p.image_url ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Förstora bild"
            className="group relative block w-full h-48 rounded-t-2xl overflow-hidden cursor-zoom-in"
            style={{ background: `url(${p.image_url}) center/cover` }}
          >
            <div
              className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }}
            />
            <span
              className="absolute bottom-4 right-4 inline-flex items-center justify-center h-11 w-11 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--background)",
                boxShadow: "0 10px 30px color-mix(in srgb, var(--gold) 40%, transparent)",
              }}
            >
              <ZoomIn className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </button>
        ) : (
          <div
            className="h-48 rounded-t-2xl"
            style={{ background: "linear-gradient(135deg, var(--gold-surface) 0%, var(--surface) 60%, var(--background) 100%)" }}
          />
        )}

        {lightboxOpen && p.image_url && (
          <Lightbox src={p.image_url} alt={p.title ?? ""} onClose={() => setLightboxOpen(false)} closeLabel={t.close} />
        )}


        <div className="p-8">
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {cats.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: "var(--gold-surface)", color: "var(--gold)", border: "1px solid var(--gold-line)" }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            {p.title}
          </h3>

          <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {p.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: "var(--gold)" }} />
                {p.location}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: "var(--gold)" }} />
              {fmtRange(p.starts_at, p.ends_at)}
            </div>
            {p.positions_needed != null && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: "var(--gold)" }} />
                {p.positions_needed} {t.rolesStaffed}
              </div>
            )}
          </div>

          {p.description && (
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: "var(--gold)" }}>
                {t.about}
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {p.description}
              </p>
            </div>
          )}

          {p.client_notes && (
            <div
              className="mt-6 rounded-xl p-4"
              style={{ backgroundColor: "var(--gold-surface)", border: "1px solid var(--gold-line)" }}
            >
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: "var(--gold)" }}>
                {t.clientWords}
              </h4>
              <p className="text-sm leading-relaxed italic" style={{ color: "var(--foreground)" }}>
                "{p.client_notes}"
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <a
              href="#booking"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full px-5 h-11 text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--gold)", color: "var(--background)" }}
            >
              {t.bookSimilar}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full px-5 h-11 text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--surface-line)", color: "var(--foreground)" }}
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ src, alt, onClose, closeLabel }: { src: string; alt: string; onClose: () => void; closeLabel: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out"
      style={{ backgroundColor: "var(--card)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label={closeLabel}
        className="absolute top-5 right-5 h-12 w-12 rounded-full inline-flex items-center justify-center transition-all hover:scale-110 z-10"
        style={{
          backgroundColor: "var(--gold)",
          color: "var(--background)",
          boxShadow: "0 10px 30px color-mix(in srgb, var(--gold) 45%, transparent)",
        }}
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-xl animate-in zoom-in-95 duration-300 cursor-default"
        style={{
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px color-mix(in srgb, var(--gold) 25%, transparent)",
        }}
      />
    </div>
  );
}
