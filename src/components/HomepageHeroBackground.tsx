import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOMEPAGE_HERO,
  HOMEPAGE_HERO_CASE_SELECT,
  HOMEPAGE_HERO_SETTINGS_SELECT,
  type HomepageHeroCase,
  type HomepageHeroSettings,
} from "@/lib/homepage-hero";

type Slide = {
  id: string;
  image: string;
  title?: string | null;
  slug?: string | null;
  location?: string | null;
  year?: number | null;
  category?: string | null;
  isCase: boolean;
};

export function HomepageHeroBackground() {
  const [settings, setSettings] = useState<HomepageHeroSettings>(DEFAULT_HOMEPAGE_HERO);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setIsMobile(mobile.matches);
      setReducedMotion(reduced.matches);
    };
    sync();
    mobile.addEventListener?.("change", sync);
    reduced.addEventListener?.("change", sync);
    return () => {
      mobile.removeEventListener?.("change", sync);
      reduced.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let nextSettings = DEFAULT_HOMEPAGE_HERO;
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select(HOMEPAGE_HERO_SETTINGS_SELECT)
          .eq("id", "homepage")
          .maybeSingle();
        if (!error && data) nextSettings = { ...DEFAULT_HOMEPAGE_HERO, ...(data as HomepageHeroSettings) };
      } catch {
        // Before the hero migration is installed, use the deliberate graphical fallback.
      }
      if (cancelled) return;
      setSettings(nextSettings);

      const manualImage = isMobile && nextSettings.hero_mobile_image_url
        ? nextSettings.hero_mobile_image_url
        : nextSettings.hero_image_url;

      if (nextSettings.hero_mode === "cases") {
        try {
          const { data, error } = await supabase
            .from("projects")
            .select(HOMEPAGE_HERO_CASE_SELECT)
            .eq("case_published", true)
            .eq("public_visible", true)
            .eq("case_show_in_hero", true)
            .order("case_hero_priority", { ascending: true })
            .order("case_published_at", { ascending: false, nullsFirst: false })
            .limit(isMobile ? 3 : 5);

          if (!error && data) {
            const caseSlides = (data as HomepageHeroCase[])
              .map((project) => ({
                id: project.id,
                image: project.case_hero_image_url || project.image_url || "",
                title: project.title,
                slug: project.slug,
                location: project.location,
                year: project.case_year,
                category: project.category,
                isCase: true,
              }))
              .filter((slide) => !!slide.image);
            if (!cancelled && caseSlides.length) {
              setSlides(caseSlides);
              setActive(0);
              return;
            }
          }
        } catch {
          // Fall back to the manually selected hero below.
        }
      }

      if (!cancelled) {
        setSlides(manualImage ? [{ id: "manual", image: manualImage, isCase: false }] : []);
        setActive(0);
      }
    })();
    return () => { cancelled = true; };
  }, [isMobile]);

  useEffect(() => {
    if (slides.length < 2 || reducedMotion || settings.hero_mode !== "cases") return;
    const delay = Math.max(4, Math.min(20, Number(settings.hero_slide_seconds) || 7)) * 1000;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), delay);
    return () => window.clearInterval(timer);
  }, [reducedMotion, settings.hero_mode, settings.hero_slide_seconds, slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const next = slides[(active + 1) % slides.length];
    if (!next?.image) return;
    const img = new Image();
    img.src = next.image;
  }, [active, slides]);

  const overlay = Math.max(32, Math.min(86, Number(settings.hero_overlay) || 66)) / 100;
  const activeSlide = slides[active];
  const slideDuration = `${Math.max(4, Math.min(20, Number(settings.hero_slide_seconds) || 7))}s`;
  const showMeta = settings.hero_mode === "cases" && settings.hero_show_case_meta && activeSlide?.isCase;

  const overlayStyle = useMemo(() => ({
    background: `linear-gradient(90deg, rgba(0,0,0,${Math.min(.94, overlay + .13)}) 0%, rgba(0,0,0,${overlay}) 48%, rgba(0,0,0,${Math.max(.28, overlay - .24)}) 100%)`,
  }), [overlay]);

  return (
    <>
      <div className="allo-hero-media absolute inset-0 -z-20 overflow-hidden bg-[#050505]">
        {slides.length ? slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.image}
            alt=""
            aria-hidden="true"
            className={`allo-hero-slide ${index === active ? "is-active" : ""} ${settings.hero_slow_zoom && !reducedMotion ? "has-drift" : ""}`}
            style={{
              objectPosition: settings.hero_image_position || "center center",
              ["--hero-slide-duration" as string]: slideDuration,
            }}
          />
        )) : <HeroGraphicFallback />}
      </div>
      <div className="absolute inset-0 -z-10" style={overlayStyle} />

      {showMeta ? (
        <div className="allo-hero-case-meta">
          <div className="allo-hero-case-count">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</div>
          <div className="allo-hero-case-title">{activeSlide.title}</div>
          <div className="allo-hero-case-subline">
            {[activeSlide.location, activeSlide.year, activeSlide.category].filter(Boolean).join(" · ")}
          </div>
          {activeSlide.slug ? (
            <a href={`/case/${activeSlide.slug}`} className="allo-hero-case-link">
              View case <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {slides.length > 1 ? (
            <div className="allo-hero-case-dots" aria-label="Hero slides">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={index === active ? "is-active" : ""}
                  onClick={() => setActive(index)}
                  aria-label={`Visa slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function HeroGraphicFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 allo-hero-fallback-grid" />
      <div className="absolute left-[10%] top-[13%] h-px w-[80%] bg-white/10" />
      <div className="absolute left-[13%] top-[13%] h-[55%] w-px rotate-[14deg] bg-white/[0.08]" />
      <div className="absolute right-[16%] top-[13%] h-[55%] w-px -rotate-[14deg] bg-white/[0.08]" />
      <div className="absolute right-[6%] top-[22%] text-[clamp(3rem,10vw,10rem)] font-black tracking-[-.07em] text-white/[0.025]">ALLO</div>
      <div className="absolute bottom-[10%] right-[8%] h-[42%] w-[42%] border border-white/[0.07] bg-white/[0.018]" />
      <div className="absolute bottom-[10%] right-[8%] h-px w-[42%] bg-white/20 shadow-[0_0_28px_rgba(255,255,255,.10)]" />
    </div>
  );
}
