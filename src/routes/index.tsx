import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Cuboid,
  Hammer,
  LayoutDashboard,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import logo from "@/assets/allo-logo.png";
import { SiteHeader } from "@/components/SiteHeader";
import { ProjectsSection } from "@/components/ProjectsSection";
import { BookingSection } from "@/components/BookingSection";
import { HomepageHeroBackground } from "@/components/HomepageHeroBackground";
import { translations, type Lang } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BEMANNING_ROLES = [
  "Bygg", "Rivare", "Målare", "Snickare", "Event", "Mässor", "Bröllop",
  "Servering", "Fotograf", "Dekor", "Sampling", "Flyttpersonal",
  "Butik", "Lager", "Städ", "Stagehand",
];

const BUILDER_URL = "https://verktyg.alloevent.se";
const PORTAL_URL = "https://personal.alloevent.se";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Allo Event – Eventproduktion, Bemanning & Mässor" },
      { name: "description", content: "Allo Event hjälper företag med eventproduktion, mässor, monterbyggnation, rigg, logistik och flexibel bemanning i Stockholm och övriga Sverige." },
      { property: "og:title", content: "Allo Event – Eventproduktion, Bemanning & Mässor" },
      { property: "og:description", content: "Vi bygger, bemannar och genomför event – från idé till färdig leverans." },
      { property: "og:url", content: "https://alloevent.se" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://alloevent.se" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Allo Event AB",
          url: "https://alloevent.se",
          telephone: ["+46702239680", "+46707309627"],
          address: {
            "@type": "PostalAddress",
            streetAddress: "Surbrunnsgatan 30",
            postalCode: "113 27",
            addressLocality: "Stockholm",
            addressCountry: "SE",
          },
        }),
      },
    ],
  }),
});

function Index() {
  const [lang, setLang] = useState<Lang>("sv");
  const [bemanningOpen, setBemanningOpen] = useState(false);
  const { theme, preference, setTheme } = useTheme();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    const storedLang = localStorage.getItem("lang") as Lang | null;
    if (storedLang) setLang(storedLang);
  }, []);

  useEffect(() => {
    const aliases: Record<string, string> = {
      "#service-event": "#services",
      "#service-staffing": "#services",
      "#service-expo": "#services",
      "#service-logistics": "#services",
    };

    const prefersReducedMotion = () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const scrollToHash = (hash: string, behavior: ScrollBehavior = "smooth") => {
      if (!hash) return false;
      const resolvedHash = aliases[hash] ?? hash;
      if (resolvedHash === "#top") {
        window.scrollTo({ top: 0, behavior });
        return true;
      }

      const target = document.querySelector<HTMLElement>(resolvedHash);
      if (!target) return false;

      const header = document.querySelector<HTMLElement>(".allo-header");
      const headerHeight = header?.getBoundingClientRect().height ?? 74;
      const breathingRoom = window.innerWidth < 768 ? 16 : 24;
      const targetTop = window.scrollY + target.getBoundingClientRect().top - headerHeight - breathingRoom;

      window.scrollTo({ top: Math.max(0, targetTop), behavior });
      return true;
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const element = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      const href = element?.getAttribute("href");
      if (!href?.startsWith("#")) return;

      event.preventDefault();
      const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
      if (scrollToHash(href, behavior)) {
        window.history.pushState(null, "", href);
      }
    };

    const onHistoryNavigation = () => {
      const hash = window.location.hash || "#top";
      scrollToHash(hash, prefersReducedMotion() ? "auto" : "smooth");
    };

    document.addEventListener("click", onDocumentClick);
    window.addEventListener("popstate", onHistoryNavigation);

    // Correct native browser hash positioning after the homepage has mounted,
    // including navigation back from /case/... to /#section.
    if (window.location.hash) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => scrollToHash(window.location.hash, "auto"));
      });
    }

    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("popstate", onHistoryNavigation);
    };
  }, []);


  const setLangPersist = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = translations[lang];
  const sv = lang === "sv";
  const copy = sv ? svCopy : enCopy;

  return (
    <div id="top" className="allo-site min-h-screen bg-background text-foreground">
      <SiteHeader lang={lang} setLang={setLangPersist} theme={theme} preference={preference} setTheme={setTheme} t={t} />

      {!loading && isAdmin && (
        <Link to="/admin" className="allo-admin-fab">
          <LayoutDashboard className="h-4 w-4" />
          Adminpanelen
        </Link>
      )}

      <main>
        <section className="allo-hero allo-hero-v61 relative isolate overflow-hidden">
          <div className="mx-auto max-w-[1380px] px-5 pb-12 pt-20 md:px-8 md:pb-16 md:pt-24 lg:pb-20 lg:pt-28">
            <div className="allo-hero-v61-grid">
              <div className="allo-hero-v61-copy">
                <div className="allo-eyebrow animate-in fade-in slide-in-from-bottom-2 duration-700">
                  {copy.heroEyebrow}
                </div>
                <h1 className="allo-display allo-display-v61 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {sv ? (
                    <>
                      <span>FRÅN FÖRSTA</span>
                      <span>INBÄRNING TILL</span>
                      <span>SISTA UTLASTNING.</span>
                    </>
                  ) : (
                    <>
                      <span>FROM FIRST</span>
                      <span>LOAD-IN TO FINAL</span>
                      <span>LOAD-OUT.</span>
                    </>
                  )}
                </h1>
                <p className="allo-hero-v61-body mt-7 max-w-[660px] text-base leading-relaxed md:text-lg">{copy.heroBody}</p>
                <div className="allo-hero-capabilities mt-7" aria-label={sv ? "Våra kärntjänster" : "Our core services"}>
                  {copy.heroCapabilities.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setBemanningOpen(true)} className="allo-primary-button">
                    {copy.staffingCta}<Users className="h-4 w-4" />
                  </button>
                  <a href="#booking" className="allo-hero-secondary">
                    {copy.quoteCta}<ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="allo-hero-v61-visual">
                <div className="allo-hero-v61-media-frame">
                  <HomepageHeroBackground embedded />
                  <div className="allo-hero-v61-signoff">
                    <span>WE MAKE IT</span>
                    <strong>HAPPEN.</strong>
                    <small>{copy.heroLocation}</small>
                  </div>
                </div>
                <div className="allo-hero-v61-proof-grid">
                  <HeroProof icon={Users} title={copy.heroProof1Title} body={copy.heroProof1Body} />
                  <HeroProof icon={PackageCheck} title={copy.heroProof2Title} body={copy.heroProof2Body} />
                  <HeroProof icon={MapPin} title={copy.heroProof3Title} body={copy.heroProof3Body} />
                  <HeroProof icon={Check} title={copy.heroProof4Title} body={copy.heroProof4Body} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="choose" className="allo-choice-section allo-anchor-section py-20 md:py-24">
          <div className="mx-auto max-w-[1380px] px-5 md:px-8">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <SectionHeading eyebrow={copy.choiceEyebrow} title={copy.choiceTitle} dark={false} />
              <p className="allo-section-lead max-w-2xl text-base leading-relaxed md:text-lg">{copy.choiceIntro}</p>
            </div>
            <div className="allo-choice-grid mt-10 grid gap-px lg:grid-cols-2">
              <NeedCard
                number="01"
                icon={Users}
                title={copy.choiceStaffingTitle}
                lead={copy.choiceStaffingLead}
                body={copy.choiceStaffingBody}
                bullets={copy.choiceStaffingBullets}
                cta={copy.staffingCta}
                onClick={() => setBemanningOpen(true)}
              />
              <NeedCard
                number="02"
                icon={Hammer}
                title={copy.choiceProductionTitle}
                lead={copy.choiceProductionLead}
                body={copy.choiceProductionBody}
                bullets={copy.choiceProductionBullets}
                cta={copy.quoteCta}
                href="#booking"
              />
            </div>
          </div>
        </section>

        <div className="allo-dark-section allo-work-first">
          <ProjectsSection t={t.projectsSection} />
        </div>

        <section id="services" className="allo-anchor-section allo-light-section relative py-20 md:py-24">
          <span id="service-event" className="allo-service-anchor" aria-hidden="true" />
          <span id="service-staffing" className="allo-service-anchor" aria-hidden="true" />
          <span id="service-expo" className="allo-service-anchor" aria-hidden="true" />
          <span id="service-logistics" className="allo-service-anchor" aria-hidden="true" />
          <div className="mx-auto max-w-[1380px] px-5 md:px-8">
            <SectionHeading eyebrow={copy.servicesEyebrow} title={copy.servicesTitle} dark={false} />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ServiceCard icon={CalendarDays} title={copy.eventTitle} description={copy.eventBody} href="#booking" />
              <ServiceCard icon={Users} title={copy.staffingTitle} description={copy.staffingBody} onClick={() => setBemanningOpen(true)} />
              <ServiceCard icon={Cuboid} title={copy.expoTitle} description={copy.expoBody} href="#builder" />
              <ServiceCard icon={Truck} title={copy.logisticsTitle} description={copy.logisticsBody} href="#booking" />
            </div>
          </div>
        </section>

        <section id="process" className="allo-anchor-section allo-process-section py-20 md:py-24">
          <div className="mx-auto max-w-[1380px] px-5 md:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <SectionHeading eyebrow={copy.processEyebrow} title={copy.processTitle} dark={false} />
              <p className="allo-section-lead max-w-2xl text-base leading-relaxed md:text-lg">{copy.processBody}</p>
            </div>
            <div className="allo-process-grid mt-12 grid md:grid-cols-4">
              <ProcessStep number="01" icon={ClipboardList} title={copy.process1Title} body={copy.process1Body} />
              <ProcessStep number="02" icon={CalendarDays} title={copy.process2Title} body={copy.process2Body} />
              <ProcessStep number="03" icon={Hammer} title={copy.process3Title} body={copy.process3Body} />
              <ProcessStep number="04" icon={PackageCheck} title={copy.process4Title} body={copy.process4Body} />
            </div>
          </div>
        </section>

        <Dialog open={bemanningOpen} onOpenChange={setBemanningOpen}>
          <DialogContent className="max-w-lg allo-dialog">
            <DialogHeader>
              <DialogTitle>{sv ? "Bemanning – alla roller" : "Staffing – all roles"}</DialogTitle>
              <DialogDescription>{sv ? "Vi tillsätter personal inom följande områden:" : "We provide staff across the following areas:"}</DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex flex-wrap gap-2">
              {BEMANNING_ROLES.map((role) => <span key={role} className="allo-role-chip">{role}</span>)}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {sv ? "Söker ni något annat? Berätta vad ni behöver så sätter vi ihop rätt lösning." : "Looking for something else? Tell us what you need and we'll put together the right solution."}
            </p>
            <a href="#booking" onClick={() => setBemanningOpen(false)} className="allo-primary-button mt-2 w-fit">{copy.staffingCta}</a>
          </DialogContent>
        </Dialog>

        <section id="builder" className="allo-light-section py-20 md:py-28">
          <div className="mx-auto grid max-w-[1380px] items-center gap-10 px-5 md:px-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <span className="allo-section-kicker">{copy.builderKicker}</span>
              <h2 className="allo-section-title allo-theme-heading mt-3">{copy.builderTitle}</h2>
              <p className="allo-theme-muted mt-5 max-w-xl text-base leading-relaxed md:text-lg">{copy.builderBody}</p>
              <ul className="allo-theme-copy mt-7 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {t.showcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2.5">
                    <span className="allo-check-dot flex h-6 w-6 items-center justify-center rounded-full"><Check className="h-3.5 w-3.5" /></span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <a href={BUILDER_URL} target="_blank" rel="noopener noreferrer" className="allo-primary-button mt-8">
                {t.showcase.cta}<ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <BuilderPreview />
          </div>
        </section>

        <section className="allo-proof-strip">
          <div className="mx-auto grid max-w-[1380px] divide-y divide-white/10 px-5 md:grid-cols-4 md:divide-x md:divide-y-0 md:px-8">
            <ProofItem icon={PackageCheck} title={copy.proof1Title} body={copy.proof1Body} />
            <ProofItem icon={Cuboid} title={copy.proof2Title} body={copy.proof2Body} />
            <ProofItem icon={Users} title={copy.proof3Title} body={copy.proof3Body} />
            <ProofItem icon={MapPin} title={copy.proof4Title} body={copy.proof4Body} />
          </div>
        </section>

        <section id="about" className="allo-anchor-section allo-about-panel py-20 md:py-28">
          <div className="mx-auto grid max-w-[1380px] gap-12 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="allo-section-kicker text-white/55">{t.about.tag}</span>
              <h2 className="allo-section-title mt-3 text-white">{t.about.title}</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="allo-about-card md:col-span-2">
                <p className="text-lg leading-relaxed text-white/76 md:text-xl">{t.about.p1}</p>
              </div>
              <div className="allo-about-card">
                <Boxes className="h-7 w-7 text-white/70" />
                <h3 className="mt-5 text-xl font-bold text-white">{t.about.tech}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{t.about.techDesc}</p>
              </div>
              <div className="allo-about-card">
                <Sparkles className="h-7 w-7 text-white/70" />
                <h3 className="mt-5 text-xl font-bold text-white">{t.about.vision}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{t.about.visionDesc}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="partners" className="allo-anchor-section allo-light-section allo-partners-section py-16 md:py-20">
          <div className="mx-auto max-w-[1180px] px-5 md:px-8">
            <div className="allo-partners-heading">
              <SectionHeading eyebrow={t.partners.kicker} title={t.partners.title} dark={false} centered />
              <p className="allo-partners-intro">{t.partners.description}</p>
            </div>
            <div className="allo-partners-grid mt-10 grid gap-5 md:grid-cols-2">
              <PartnerCard
                href="https://www.nessim.se"
                logoSrc="/images/partners/nessim-logo-cropped.png"
                logoAlt="Nessim Fair Support"
                title={t.partners.nessim_header}
                description={t.partners.nessim_desc}
                ctaLabel={t.partners.nessim_cta}
                variant="nessim"
              />
              <PartnerCard
                href="https://www.workman.se"
                logoSrc="/images/partners/workman-logo.png"
                logoDarkSrc="/images/partners/workman-logo-white.png"
                logoAlt="WorkMan Event"
                title={t.partners.workman_header}
                description={t.partners.workman_desc}
                ctaLabel={t.partners.workman_cta}
                variant="workman"
              />
            </div>
          </div>
        </section>

        <div className="allo-booking-wrap">
          <BookingSection t={t.booking} />
        </div>

        <section id="contact" className="allo-anchor-section allo-contact-section py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-5 md:px-8">
            <SectionHeading eyebrow={t.contact.tag} title={copy.contactTitle} dark />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <PersonCard name="Jerry Fors" role={t.contact.ceo} email="Jerry@alloevent.se" phone="+46 (0) 702 23 96 80" />
              <PersonCard name="Jacob Karlestedt" role={t.contact.cofounder} email="Jacob@alloevent.se" phone="+46 (0) 707 30 96 27" />
              <PersonCard name="Sanna Sigalit" role="Operations & Sales Manager" email="Sanna@alloevent.se" phone="+46 (0) 760 05 18 82" />
            </div>
            <div className="allo-company-card mt-5 grid gap-6 md:grid-cols-[1fr_1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><Building2 className="h-4 w-4 text-white/60" />Allo Event AB</div>
                <p className="mt-2 text-sm text-white/55">{t.contact.org}: 559547-6549</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                <span>Surbrunnsgatan 30<br />113 27 Stockholm</span>
              </div>
              <a href="#booking" className="allo-primary-button justify-center">{copy.startProject}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="allo-footer">
        <div className="mx-auto grid max-w-[1380px] gap-10 px-5 py-12 md:grid-cols-[1.35fr_1fr_1fr_1fr] md:px-8">
          <div>
            <img src={logo} alt="Allo Event" className="h-14 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">{copy.footerBody}</p>
          </div>
          <FooterColumn title={copy.servicesTitle} links={[
            [copy.eventTitle, "#service-event"], [copy.staffingTitle, "#service-staffing"], [copy.expoTitle, "#service-expo"], [copy.logisticsTitle, "#service-logistics"],
          ]} />
          <FooterColumn title={copy.companyTitle} links={[
            [copy.viewCases, "#projects"], [copy.builderNav, "#builder"], [copy.aboutNav, "#about"], [copy.jobsNav, PORTAL_URL],
          ]} />
          <div>
            <h3 className="text-sm font-bold text-white">{t.contact.tag}</h3>
            <div className="mt-4 space-y-3 text-sm text-white/55">
              <a className="flex items-center gap-2 hover:text-white" href="mailto:Jerry@alloevent.se"><Mail className="h-4 w-4" />Jerry@alloevent.se</a>
              <a className="flex items-center gap-2 hover:text-white" href="tel:+46702239680"><Phone className="h-4 w-4" />070-223 96 80</a>
              <a className="flex items-start gap-2 hover:text-white" href="#contact"><MapPin className="mt-0.5 h-4 w-4" />Surbrunnsgatan 30, Stockholm</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/8">
          <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-white/38 md:px-8">
            <span>{t.footer}</span>
            <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">personal.alloevent.se ↗</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, dark, centered = false }: { eyebrow: string; title: string; dark: boolean; centered?: boolean }) {
  return (
    <div className={centered ? "text-center" : ""}>
      <span className={`allo-section-kicker ${dark ? "allo-section-kicker-dark" : ""}`}>{eyebrow}</span>
      <h2 className={`allo-section-title allo-theme-heading mt-3 ${dark ? "allo-theme-heading-dark" : ""}`}>{title}</h2>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, description, href, external, onClick }: { icon: typeof Users; title: string; description: string; href?: string; external?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="allo-service-icon"><Icon className="h-6 w-6" /></span>
        <ChevronRight className="allo-service-arrow h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
      <h3 className="allo-card-title mt-8 text-lg font-extrabold">{title}</h3>
      <p className="allo-card-copy mt-3 text-sm leading-relaxed">{description}</p>
    </>
  );
  const className = "group allo-service-card scroll-mt-28";
  if (onClick) return <button type="button" onClick={onClick} className={`${className} text-left`}>{content}</button>;
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={className}>{content}</a>;
}

function NeedCard({
  number,
  icon: Icon,
  title,
  lead,
  body,
  bullets,
  cta,
  href,
  onClick,
}: {
  number: string;
  icon: typeof Users;
  title: string;
  lead: string;
  body: string;
  bullets: readonly string[];
  cta: string;
  href?: string;
  onClick?: () => void;
}) {
  const actionClass = "allo-choice-action mt-8 inline-flex items-center gap-2";
  return (
    <article className="allo-choice-card">
      <div className="flex items-start justify-between gap-6">
        <span className="allo-choice-number">{number}</span>
        <span className="allo-choice-icon"><Icon className="h-6 w-6" /></span>
      </div>
      <p className="allo-choice-lead mt-10">{lead}</p>
      <h3 className="allo-choice-title mt-2">{title}</h3>
      <p className="allo-choice-body mt-5">{body}</p>
      <div className="allo-choice-bullets mt-7">
        {bullets.map((item) => <span key={item}>{item}</span>)}
      </div>
      {onClick ? (
        <button type="button" onClick={onClick} className={actionClass}>{cta}<ArrowRight className="h-4 w-4" /></button>
      ) : (
        <a href={href} className={actionClass}>{cta}<ArrowRight className="h-4 w-4" /></a>
      )}
    </article>
  );
}

function ProcessStep({ number, icon: Icon, title, body }: { number: string; icon: typeof Users; title: string; body: string }) {
  return (
    <div className="allo-process-step">
      <div className="flex items-center justify-between gap-4">
        <span className="allo-process-number">{number}</span>
        <Icon className="allo-process-icon h-5 w-5" />
      </div>
      <h3 className="allo-process-title mt-10 text-xl font-bold">{title}</h3>
      <p className="allo-process-body mt-3 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function ProofItem({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return (
    <div className="flex items-center gap-4 py-7 md:px-7 md:py-8 first:md:pl-0 last:md:pr-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-white/70"><Icon className="h-5 w-5" /></span>
      <div><div className="text-base font-bold text-white">{title}</div><div className="mt-1 text-xs leading-relaxed text-white/45">{body}</div></div>
    </div>
  );
}

function PartnerCard({
  href,
  logoSrc,
  logoDarkSrc,
  logoAlt,
  title,
  description,
  ctaLabel,
  variant,
}: {
  href: string;
  logoSrc: string;
  logoDarkSrc?: string;
  logoAlt: string;
  title: string;
  description: string;
  ctaLabel: string;
  variant: "nessim" | "workman";
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="allo-partner-card group">
      <div className="allo-partner-logo-zone">
        <img
          src={logoSrc}
          alt={logoAlt}
          className={`allo-partner-logo allo-partner-logo--${variant} ${logoDarkSrc ? "allo-logo-light-only" : ""}`}
        />
        {logoDarkSrc ? (
          <img
            src={logoDarkSrc}
            alt={logoAlt}
            className={`allo-partner-logo allo-partner-logo--${variant} allo-logo-dark-only`}
          />
        ) : null}
      </div>
      <div className="allo-partner-copy-stack">
        <h3 className="allo-card-title text-center text-base font-extrabold">{title}</h3>
        <p className="allo-card-copy mx-auto mt-3 text-center text-sm leading-relaxed">{description}</p>
        <span className="allo-card-link mx-auto mt-5 flex w-fit items-center gap-1 text-xs font-bold">{ctaLabel}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
      </div>
    </a>
  );
}

function PersonCard({ name, role, email, phone }: { name: string; role: string; email: string; phone: string }) {
  return (
    <div className="allo-person-card">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">{role}</div>
      <h3 className="mt-3 text-2xl font-extrabold text-white">{name}</h3>
      <div className="mt-6 space-y-3 text-sm text-white/62">
        <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-white"><Mail className="h-4 w-4" />{email}</a>
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-white"><Phone className="h-4 w-4" />{phone}</a>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-4 grid gap-2.5 text-sm text-white/50">
        {links.map(([label, href]) => <a key={`${label}-${href}`} href={href} className="hover:text-white">{label}</a>)}
      </div>
    </div>
  );
}

function BuilderPreview() {
  return (
    <div className="allo-builder-shell">
      <div className="allo-builder-topbar">
        <span className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-white"><span className="h-2.5 w-2.5 rounded-sm bg-white/80" />ALLO EVENT</span>
        <span className="text-[10px] text-white/40">3D BOOTH BUILDER</span>
      </div>
      <div className="grid min-h-[400px] md:grid-cols-[120px_1fr_150px]">
        <div className="hidden border-r border-white/8 bg-[#0b0c11] p-4 md:block">
          {['RUM','VÄGGAR','GOLV','MÖBLER','BELYSNING','DEKOR','VARUMÄRKE'].map((item, index) => <div key={item} className={`py-3 text-[9px] font-bold tracking-[.12em] ${index === 1 ? 'text-white' : 'text-white/38'}`}>{item}</div>)}
        </div>
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,.09),transparent_28%),linear-gradient(180deg,#151515_0%,#090909_100%)]">
          <div className="absolute inset-x-[8%] bottom-[13%] h-[43%] [transform:perspective(700px)_rotateX(62deg)] border border-white/12 bg-white/[0.035]" />
          <div className="absolute bottom-[32%] left-[18%] h-[36%] w-[64%] border border-white/18 bg-[#f1f1f2] shadow-[0_0_50px_rgba(255,255,255,.06)]">
            <div className="absolute inset-x-[10%] top-[12%] flex h-[31%] items-center justify-center bg-[#171820] text-sm font-black tracking-[.14em] text-white">ALLO EVENT</div>
            <div className="absolute bottom-0 left-[10%] h-[32%] w-[26%] bg-[#171717]" />
            <div className="absolute bottom-0 right-[9%] h-[27%] w-[34%] border border-[#14151b]/20 bg-[#d8d8da]" />
          </div>
          <div className="absolute bottom-[17%] left-1/2 h-12 w-28 -translate-x-1/2 border border-white/15 bg-[#22242d] shadow-xl" />
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] text-white/45 backdrop-blur-md">↻　＋　−　◫　⌂</div>
        </div>
        <div className="hidden border-l border-white/8 bg-[#0b0c11] p-4 md:block">
          <div className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">Offert</div>
          <div className="mt-2 text-xl font-extrabold text-white">Livepris</div>
          <div className="mt-5 space-y-3 text-[10px] text-white/44">
            <div className="flex justify-between"><span>Väggar</span><span>—</span></div><div className="flex justify-between"><span>Golv</span><span>—</span></div><div className="flex justify-between"><span>Möbler</span><span>—</span></div><div className="flex justify-between"><span>Belysning</span><span>—</span></div>
          </div>
          <a href={BUILDER_URL} target="_blank" rel="noopener noreferrer" className="mt-8 flex justify-center rounded-sm border border-white/20 bg-white px-3 py-2.5 text-[10px] font-bold text-black hover:bg-white/90">Öppna verktyget</a>
        </div>
      </div>
    </div>
  );
}

function HeroProof({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return (
    <div className="allo-hero-v61-proof">
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

const svCopy = {
  heroEyebrow: "EVENT · MÄSSA · BEMANNING · PRODUKTION",
  heroLine: "Från första inbärning till sista utlastning.",
  heroBody: "Vi bemannar, bygger och genomför event och mässor i hela Sverige. Personal, monterbygg, rigg och logistik – som enskild resurs eller helhetsleverans.",
  heroCapabilities: ["Personal", "Monterbygg", "Rigg", "Logistik", "Projektledning"],
  heroLocation: "Stockholm · Uppdrag i hela Sverige",
  heroProof1Title: "Erfaren personal",
  heroProof1Body: "Rätt kompetens när du behöver den.",
  heroProof2Title: "Hela kedjan",
  heroProof2Body: "Från planering och bygg till sista utlastning.",
  heroProof3Title: "Lokalt & nationellt",
  heroProof3Body: "Stockholm som bas, uppdrag i hela Sverige.",
  heroProof4Title: "Tryggt & säkert",
  heroProof4Body: "Kvalitet, säkerhet och ansvar i varje steg.",
  staffingCta: "Boka personal",
  quoteCta: "Be om offert",
  startProject: "Be om offert",
  viewCases: "Se våra case",
  choiceEyebrow: "Två vägar in",
  choiceTitle: "Vad behöver ni hjälp med?",
  choiceIntro: "Ni behöver inte veta exakt vilken tjänst ni ska beställa. Börja med behovet: fler händer till ett uppdrag, eller en partner som tar ansvar för en större del av produktionen.",
  choiceStaffingTitle: "Bemanning",
  choiceStaffingLead: "Behöver ni folk till ett uppdrag?",
  choiceStaffingBody: "Vi tillsätter pålitlig personal efter uppdragets krav, tid och plats – från enstaka förstärkning till större team.",
  choiceStaffingBullets: ["Eventpersonal", "Byggare & montörer", "Stagehands", "Servering & värdar", "Lager & flytt"],
  choiceProductionTitle: "Produktion",
  choiceProductionLead: "Behöver ni någon som tar ansvar för genomförandet?",
  choiceProductionBody: "Vi planerar och driver event- och mässleveranser där människor, material, tider och logistik behöver fungera tillsammans.",
  choiceProductionBullets: ["Event & aktivering", "Mässor & monter", "Rigg & montage", "Logistik & transport", "Projektledning"],
  servicesEyebrow: "Våra leveranser",
  servicesTitle: "Från extra händer till komplett genomförande",
  eventTitle: "Eventproduktion",
  eventBody: "Planering och genomförande för event, konferenser och aktiveringar – med en tydlig ansvarig väg från brief till leverans.",
  staffingTitle: "Bemanning",
  staffingBody: "Flexibel och erfaren personal för event, mässor, service, bygg, lager och logistik – anpassat efter pass, kompetens och volym.",
  expoTitle: "Mässor & Monter",
  expoBody: "Monterplanering, byggnation, montage och digital 3D-visualisering som en del av en sammanhållen mässleverans.",
  logisticsTitle: "Rigg & Logistik",
  logisticsBody: "Inbärning, utbärning, montage, rivning, transport och stagehands när flödet på plats måste hålla tiden.",
  processEyebrow: "Så arbetar vi",
  processTitle: "En tydlig väg från brief till leverans",
  processBody: "Event blir bättre när ansvar, timing och nästa steg är tydliga. Därför arbetar vi i ett enkelt flöde som binder ihop kund, produktion, personal och logistik.",
  process1Title: "Brief & behov",
  process1Body: "Vi sätter mål, omfattning, datum och vad som faktiskt behöver lösas.",
  process2Title: "Planering",
  process2Body: "Team, tidsplan, material, logistik och ansvar samlas i en gemensam leveransplan.",
  process3Title: "Produktion",
  process3Body: "Vi bygger, bemannar, riggar och driver genomförandet på plats.",
  process4Title: "Leverans & avslut",
  process4Body: "Vi följer upp, river, lastar ut och ser till att projektet stängs ordentligt.",
  builderNav: "3D-monterverktyg",
  builderKicker: "En del av vår mässleverans",
  builderTitle: "Planera montern i 3D innan vi bygger den",
  builderBody: "Vårt 3D-verktyg gör det enklare att visualisera väggar, golv, möbler och belysning innan produktionen startar. Verktyget är ett stöd i mässleveransen – inte ett separat erbjudande från resten av produktionen.",
  proof1Title: "Helhetsleverans",
  proof1Body: "Från första plan till sista utbärning",
  proof2Title: "3D som verktyg",
  proof2Body: "Visualisering som förenklar mässplaneringen",
  proof3Title: "Flexibla team",
  proof3Body: "Bemanning som skalar efter uppdraget",
  proof4Title: "Stockholm",
  proof4Body: "Med uppdrag och partnerskap över hela Sverige",
  contactTitle: "Människorna bakom leveransen",
  footerBody: "Allo Event bygger, bemannar och genomför event och mässor – från enstaka personalbehov till större produktions- och logistikleveranser.",
  companyTitle: "Allo Event",
  aboutNav: "Om oss",
  jobsNav: "Jobba hos oss",
};

const enCopy = {
  heroEyebrow: "EVENTS · EXHIBITIONS · STAFFING · PRODUCTION",
  heroLine: "From first load-in to final load-out.",
  heroBody: "We staff, build and deliver events and exhibitions across Sweden. Staffing, booth builds, rigging and logistics – as individual resources or a complete delivery.",
  heroCapabilities: ["Staffing", "Booth builds", "Rigging", "Logistics", "Project management"],
  heroLocation: "Stockholm · Projects across Sweden",
  heroProof1Title: "Experienced crew",
  heroProof1Body: "The right skills when you need them.",
  heroProof2Title: "End-to-end",
  heroProof2Body: "From planning and build to final load-out.",
  heroProof3Title: "Local & nationwide",
  heroProof3Body: "Stockholm based, projects across Sweden.",
  heroProof4Title: "Safe & accountable",
  heroProof4Body: "Quality, safety and ownership at every step.",
  staffingCta: "Book staff",
  quoteCta: "Request a quote",
  startProject: "Request a quote",
  viewCases: "View our cases",
  choiceEyebrow: "Two ways in",
  choiceTitle: "What do you need help with?",
  choiceIntro: "You do not need to know the exact service to order. Start with the need: extra hands for an assignment, or a partner who takes responsibility for a larger part of the production.",
  choiceStaffingTitle: "Staffing",
  choiceStaffingLead: "Need people for an assignment?",
  choiceStaffingBody: "We provide reliable staff based on the assignment, schedule and location – from individual reinforcement to larger teams.",
  choiceStaffingBullets: ["Event staff", "Builders & installers", "Stagehands", "Hospitality & hosts", "Warehouse & moving"],
  choiceProductionTitle: "Production",
  choiceProductionLead: "Need someone to own the delivery?",
  choiceProductionBody: "We plan and run event and exhibition deliveries where people, materials, schedules and logistics need to work as one.",
  choiceProductionBullets: ["Events & activations", "Exhibitions & booths", "Rigging & installation", "Logistics & transport", "Project management"],
  servicesEyebrow: "Our delivery",
  servicesTitle: "From extra hands to full execution",
  eventTitle: "Event Production",
  eventBody: "Planning and delivery for events, conferences and activations – with a clear line of responsibility from brief to handover.",
  staffingTitle: "Staffing",
  staffingBody: "Flexible, experienced staff for events, exhibitions, service, construction, warehouse and logistics – matched to shift, skill and scale.",
  expoTitle: "Fairs & Booths",
  expoBody: "Booth planning, construction, installation and digital 3D visualization as part of one coordinated exhibition delivery.",
  logisticsTitle: "Rigging & Logistics",
  logisticsBody: "Load-in, load-out, assembly, dismantling, transport and stagehands when the on-site flow has to stay on schedule.",
  processEyebrow: "How we work",
  processTitle: "A clear path from brief to delivery",
  processBody: "Events work better when ownership, timing and next steps are clear. Our process connects the client, production, staffing and logistics in one delivery flow.",
  process1Title: "Brief & needs",
  process1Body: "We define the goal, scope, dates and what actually needs to be solved.",
  process2Title: "Planning",
  process2Body: "Team, timeline, material, logistics and responsibilities are brought into one delivery plan.",
  process3Title: "Production",
  process3Body: "We build, staff, rig and run the execution on site.",
  process4Title: "Handover & close",
  process4Body: "We follow up, dismantle, load out and make sure the project is properly closed.",
  builderNav: "3D booth tool",
  builderKicker: "Part of our exhibition delivery",
  builderTitle: "Plan the booth in 3D before we build it",
  builderBody: "Our 3D tool makes it easier to visualize walls, flooring, furniture and lighting before production starts. It supports the exhibition delivery rather than standing apart as a separate business.",
  proof1Title: "End-to-end delivery",
  proof1Body: "From first plan to final load-out",
  proof2Title: "3D as a tool",
  proof2Body: "Visualization that simplifies exhibition planning",
  proof3Title: "Flexible teams",
  proof3Body: "Staffing that scales with the assignment",
  proof4Title: "Stockholm",
  proof4Body: "Projects and partnerships across Sweden",
  contactTitle: "The people behind the delivery",
  footerBody: "Allo Event builds, staffs and delivers events and exhibitions – from individual staffing needs to larger production and logistics assignments.",
  companyTitle: "Allo Event",
  aboutNav: "About us",
  jobsNav: "Work with us",
};
