import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { HomeHero } from "@/lib/site-data";
import { SITE_LINKS, type SiteCopy } from "@/lib/site-copy";
import { PlanPlaceholder } from "./PlanPlaceholder";

// Testbilder, BARA i bun run dev. Läggs i public/test-images/ (gitignorerat).
// I ett produktionsbygge är import.meta.env.DEV false och grenen försvinner.
const DEV_IMAGES = import.meta.env.DEV
  ? {
      eventDesktop: "/test-images/event-desktop.webp",
      eventMobile: "/test-images/event-mobile.webp",
      staffing: "/test-images/staffing.webp",
    }
  : null;

type Props = {
  hero: HomeHero;
  copy: SiteCopy["hero"];
  placeholders: SiteCopy["placeholder"];
};

export function HeroSplit({ hero, copy, placeholders }: Props) {
  return (
    <section className="allo-v7-hero" aria-labelledby="allo-v7-h1">
      <div className="allo-v7-wrap">
        <div className="allo-v7-hero-top">
          <h1 id="allo-v7-h1">{copy.h1}</h1>
          <span className="allo-v7-mono">Stockholm · SE</span>
        </div>
        <div className="allo-v7-split">
          <EventHalf hero={hero} copy={copy} placeholder={placeholders.event} />
          <StaffingHalf copy={copy} placeholder={placeholders.staffing} />
        </div>
      </div>
    </section>
  );
}

function HalfBody({ no, label, line, go }: { no: string; label: string; line: string; go: string }) {
  return (
    <div className="allo-v7-half-body">
      <div>
        <span className="allo-v7-mono">
          {no} / {label}
        </span>
        <div className="allo-v7-half-title">{label}</div>
        <p className="allo-v7-half-line">{line}</p>
      </div>
      <span className="allo-v7-half-arrow" aria-hidden="true" title={`${go} ${label}`}>
        <ArrowRight />
      </span>
    </div>
  );
}

function EventHalf({ hero, copy, placeholder }: { hero: HomeHero; copy: SiteCopy["hero"]; placeholder: SiteCopy["placeholder"]["event"] }) {
  const slides = hero.slides;
  const first = slides[0]?.image ?? null;
  const [failed, setFailed] = useState(false);
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  // Bildspelet går bara medan pekaren är över halvan, och bara på enheter med hovring.
  useEffect(() => {
    if (!hovering || !armed || slides.length < 2 || reducedMotion.current) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      Math.max(2500, Math.min(8000, hero.slideSeconds * 700)),
    );
    return () => window.clearInterval(timer);
  }, [hovering, armed, slides.length, hero.slideSeconds]);

  const onEnter = () => {
    setHovering(true);
    if (slides.length > 1 && !reducedMotion.current) setArmed(true);
  };
  const onLeave = () => setHovering(false);

  const hasImage = !!first && !failed;
  const devFallback = !hasImage && DEV_IMAGES;
  const meta = hero.mode === "cases" && hero.showCaseMeta ? slides[active] : null;

  return (
    <a href={SITE_LINKS.event} className="allo-v7-half is-event" onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
      <div className="allo-v7-half-media">
        {hasImage ? (
          <>
            {hero.mobileImage && hero.mobileImage !== first ? (
              <picture className={active === 0 ? "is-active" : ""}>
                <source media="(max-width: 1023px)" srcSet={hero.mobileImage} />
                <img src={first} alt="" className={active === 0 ? "is-active" : ""} fetchPriority="high" decoding="async" onError={() => setFailed(true)} />
              </picture>
            ) : (
              <img src={first} alt="" className={active === 0 ? "is-active" : ""} fetchPriority="high" decoding="async" onError={() => setFailed(true)} />
            )}
            {armed
              ? slides.slice(1).map((slide, index) => (
                  <img key={slide.id} src={slide.image} alt="" className={active === index + 1 ? "is-active" : ""} loading="lazy" decoding="async" />
                ))
              : null}
          </>
        ) : devFallback ? (
          <DevImage desktop={devFallback.eventDesktop} mobile={devFallback.eventMobile} placeholder={placeholder} />
        ) : (
          <PlanPlaceholder copy={placeholder} />
        )}
      </div>
      {meta ? (
        <div className="allo-v7-half-meta allo-v7-mono">
          <b>
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </b>
          <br />
          {[meta.title, meta.location, meta.year].filter(Boolean).join(" · ")}
        </div>
      ) : null}
      <HalfBody no={copy.eventNo} label={copy.eventLabel} line={copy.eventLine} go={copy.go} />
    </a>
  );
}

function StaffingHalf({ copy, placeholder }: { copy: SiteCopy["hero"]; placeholder: SiteCopy["placeholder"]["staffing"] }) {
  // Bemanningshalvan har ingen datakälla ännu (kommer i admin-steget).
  return (
    <a href={SITE_LINKS.staffing} className="allo-v7-half is-staffing">
      <div className="allo-v7-half-media">
        {DEV_IMAGES ? (
          <DevImage desktop={DEV_IMAGES.staffing} placeholder={placeholder} />
        ) : (
          <PlanPlaceholder copy={placeholder} />
        )}
      </div>
      <HalfBody no={copy.staffingNo} label={copy.staffingLabel} line={copy.staffingLine} go={copy.go} />
    </a>
  );
}

/** Dev-testbild med reservyta om filen saknas i public/test-images/. */
function DevImage({ desktop, mobile, placeholder }: { desktop: string; mobile?: string; placeholder: SiteCopy["placeholder"]["event"] }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <PlanPlaceholder copy={placeholder} />;
  return (
    <picture className="is-active">
      {mobile ? <source media="(max-width: 1023px)" srcSet={mobile} /> : null}
      <img src={desktop} alt="" className="is-active" decoding="async" onError={() => setFailed(true)} />
    </picture>
  );
}
