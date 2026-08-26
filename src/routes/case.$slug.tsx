import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Quote,
  Users,
} from "lucide-react";
import logo from "@/assets/allo-logo.png";
import { SiteHeader } from "@/components/SiteHeader";
import { useTheme } from "@/hooks/use-theme";
import { translations, type Lang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  caseCredits,
  caseFacts,
  caseGallery,
  caseServices,
  caseTimeline,
  PROJECT_CASE_SELECT,
  type ProjectCase,
} from "@/lib/project-case";

export const Route = createFileRoute("/case/$slug")({
  component: ProjectCasePage,
  head: () => ({
    meta: [
      { title: "Case | Allo Event" },
      { name: "description", content: "Se hur Allo Event bygger, bemannar och levererar event och mässprojekt." },
    ],
  }),
});

function ProjectCasePage() {
  const { slug } = Route.useParams();
  const [lang, setLang] = useState<Lang>("sv");
  const [project, setProject] = useState<ProjectCase | null>(null);
  const [nextCase, setNextCase] = useState<ProjectCase | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, preference, setTheme } = useTheme();

  useEffect(() => {
    const storedLang = localStorage.getItem("lang") as Lang | null;
    if (storedLang === "sv" || storedLang === "en") setLang(storedLang);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_CASE_SELECT)
        .eq("slug", slug)
        .eq("public_visible", true)
        .eq("case_published", true)
        .maybeSingle();

      if (!cancelled) {
        if (!error && data) setProject(data as ProjectCase);
        else setProject(null);
        setLoading(false);
      }

      if (!error) {
        const { data: others } = await supabase
          .from("projects")
          .select(PROJECT_CASE_SELECT)
          .eq("case_published", true)
          .eq("public_visible", true)
          .neq("slug", slug)
          .order("case_featured", { ascending: false })
          .order("case_sort_order", { ascending: true })
          .limit(1);
        if (!cancelled && others?.[0]) setNextCase(others[0] as ProjectCase);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    document.title = project.seo_title || `${project.title || "Case"} | Allo Event`;
    const description = project.seo_description || project.case_excerpt || project.description || "Allo Event case.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [project]);

  const setLangPersist = (next: Lang) => {
    setLang(next);
    localStorage.setItem("lang", next);
  };

  if (loading) return <CaseLoading />;
  if (!project) return <CaseNotFound />;

  const facts = caseFacts(project);
  const services = caseServices(project);
  const timeline = caseTimeline(project);
  const gallery = caseGallery(project);
  const credits = caseCredits(project);
  const hero = project.case_hero_image_url || project.image_url;
  const year = project.case_year || (project.starts_at ? new Date(project.starts_at).getFullYear() : null);

  return (
    <div id="top" className="allo-site allo-case-page min-h-screen bg-background text-foreground">
      <SiteHeader lang={lang} setLang={setLangPersist} theme={theme} preference={preference} setTheme={setTheme} t={translations[lang]} homeBase="/" activeNav="cases" />

      <main>
        <section className="allo-case-hero">
          {project.case_hero_video_url ? (
            <video className="allo-case-hero-media" src={project.case_hero_video_url} poster={hero || undefined} autoPlay muted loop playsInline />
          ) : hero ? (
            <img className="allo-case-hero-media" src={hero} alt={project.title || "Allo Event case"} />
          ) : <div className="allo-case-hero-fallback" />}
          <div className="allo-case-hero-overlay" />
          <div className="allo-case-hero-content">
            <a href="/#projects" className="allo-case-back"><ArrowLeft className="h-4 w-4" />Tillbaka till case</a>
            <div className="mt-auto">
              <div className="allo-case-kicker">CASE / {String(project.case_sort_order ?? 1).padStart(2, "0")}</div>
              <h1>{project.title}</h1>
              <div className="allo-case-hero-meta">
                {project.location ? <span><MapPin className="h-4 w-4" />{project.location}</span> : null}
                {year ? <span><CalendarDays className="h-4 w-4" />{year}</span> : null}
                {project.category ? <span>{project.category}</span> : null}
              </div>
              {project.case_subtitle ? <p>{project.case_subtitle}</p> : null}
            </div>
          </div>
        </section>

        {facts.length ? (
          <section className="allo-case-facts">
            <div className="allo-case-container grid md:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact, index) => <div key={`${fact.label}-${index}`} className="allo-case-fact"><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
            </div>
          </section>
        ) : null}

        <section className="allo-case-section">
          <div className="allo-case-container grid gap-12 lg:grid-cols-[1.4fr_.6fr]">
            <div>
              <span className="allo-case-section-no">01 / Overview</span>
              <h2>{project.case_intro_title || "Om projektet"}</h2>
              <p className="allo-case-lead">{project.case_intro_body || project.case_excerpt || project.description}</p>
            </div>
            <div className="allo-case-meta-list">
              {project.case_client_name ? <MetaRow label="Kund" value={project.case_client_name} /> : null}
              {project.case_venue ? <MetaRow label="Venue" value={project.case_venue} /> : null}
              {project.location ? <MetaRow label="Plats" value={project.location} /> : null}
              {year ? <MetaRow label="År" value={String(year)} /> : null}
            </div>
          </div>
        </section>

        {services.length ? (
          <section className="allo-case-services">
            <div className="allo-case-container">
              <span className="allo-case-section-no">02 / Leveransen</span>
              <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => <div key={service} className="allo-case-service"><Check className="h-4 w-4" /><span>{service}</span></div>)}
              </div>
            </div>
          </section>
        ) : null}

        {(project.case_challenge_body || project.case_solution_body) ? (
          <section className="allo-case-section allo-case-story-split">
            <div className="allo-case-container grid gap-12 lg:grid-cols-2">
              {project.case_challenge_body ? <StoryPanel no="03" title={project.case_challenge_title || "Utmaningen"} body={project.case_challenge_body} /> : null}
              {project.case_solution_body ? <StoryPanel no="04" title={project.case_solution_title || "Så byggde vi det"} body={project.case_solution_body} /> : null}
            </div>
          </section>
        ) : null}

        {gallery.length ? (
          <section className="allo-case-gallery-section">
            <div className="allo-case-container">
              <span className="allo-case-section-no">05 / Behind the build</span>
              <div className="allo-case-gallery mt-8">
                {gallery.map((image, index) => (
                  <figure key={`${image.url}-${index}`} className={`allo-case-gallery-item is-${image.layout || "half"}`}>
                    <img src={image.url} alt={image.alt || project.title || "Case image"} loading={index > 1 ? "lazy" : "eager"} />
                    {image.caption ? <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{image.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {timeline.length ? (
          <section className="allo-case-timeline-section">
            <div className="allo-case-container">
              <div className="grid gap-10 lg:grid-cols-[.45fr_1.55fr]">
                <div><span className="allo-case-section-no">06 / Timeline</span><h2>Så hände det.</h2></div>
                <div className="allo-case-timeline">
                  {timeline.map((item, index) => <div key={`${item.time}-${index}`} className="allo-case-timeline-item"><div className="allo-case-time"><Clock3 className="h-4 w-4" />{item.time}</div><div><strong>{item.title}</strong>{item.detail ? <p>{item.detail}</p> : null}</div></div>)}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {(project.case_quote || project.case_result_body) ? (
          <section className="allo-case-result-section">
            <div className="allo-case-container grid gap-10 lg:grid-cols-[1.08fr_.92fr]">
              {project.case_result_body ? <div><span className="allo-case-section-no">07 / Resultat</span><h2>{project.case_result_title || "Resultatet"}</h2><p className="allo-case-lead">{project.case_result_body}</p></div> : <div />}
              {project.case_quote ? <blockquote className="allo-case-quote"><Quote className="h-8 w-8" /><p>{project.case_quote}</p><footer>{project.case_quote_author ? <strong>{project.case_quote_author}</strong> : null}{project.case_quote_role ? <span>{project.case_quote_role}</span> : null}</footer></blockquote> : null}
            </div>
          </section>
        ) : null}

        {credits.length ? (
          <section className="allo-case-credits"><div className="allo-case-container grid md:grid-cols-2 lg:grid-cols-3">{credits.map((credit, index) => <div key={`${credit.label}-${index}`}><span>{credit.label}</span><strong>{credit.value}</strong></div>)}</div></section>
        ) : null}

        <section className="allo-case-cta">
          <div className="allo-case-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><span className="allo-case-section-no">Next move</span><h2>{project.case_cta_title || "Vad ska vi bygga tillsammans?"}</h2><p>{project.case_cta_body || "Berätta om nästa event, mässa eller produktion så tar vi det därifrån."}</p></div>
            <a href="/#booking" className="allo-case-cta-button">Starta projekt<ArrowRight className="h-5 w-5" /></a>
          </div>
        </section>

        {nextCase ? <NextCase project={nextCase} /> : null}
      </main>

      <footer className="allo-case-footer"><div className="allo-case-container flex flex-wrap items-center justify-between gap-5 py-8"><img src={logo} alt="Allo Event" className="h-12 w-auto" /><span>© 2026 Allo Event AB</span><a href="/">Till startsidan <ArrowUpRight className="inline h-3.5 w-3.5" /></a></div></footer>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function StoryPanel({ no, title, body }: { no: string; title: string; body: string }) {
  return <article className="allo-case-story-panel"><span className="allo-case-section-no">{no}</span><h2>{title}</h2><p>{body}</p></article>;
}

function NextCase({ project }: { project: ProjectCase }) {
  const image = project.case_hero_image_url || project.image_url;
  return <section className="allo-next-case"><a href={`/case/${project.slug}`} className="allo-next-case-link">{image ? <img src={image} alt={project.title || "Nästa case"} /> : null}<div className="allo-next-case-overlay" /><div className="allo-next-case-content"><span>Nästa case</span><h2>{project.title}</h2><strong>Utforska <ArrowRight className="h-5 w-5" /></strong></div></a></section>;
}

function CaseLoading() {
  return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center"><div className="flex items-center gap-3 text-sm uppercase tracking-[.18em] text-white/55"><span className="h-2 w-2 animate-pulse rounded-full bg-white" />Laddar case</div></div>;
}

function CaseNotFound() {
  return <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6"><div className="max-w-lg text-center"><div className="text-xs uppercase tracking-[.2em] text-muted-foreground">404 / Case</div><h1 className="mt-4 text-5xl font-bold">Det caset finns inte.</h1><p className="mt-4 text-muted-foreground">Det kan vara ett utkast, avpublicerat eller ha fått en ny adress.</p><a href="/#projects" className="allo-primary-button mt-8">Se våra case<ArrowRight className="h-4 w-4" /></a></div></div>;
}
