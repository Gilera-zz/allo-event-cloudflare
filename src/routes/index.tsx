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
import { translations, type Lang } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
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
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    const storedLang = localStorage.getItem("lang") as Lang | null;
    if (storedLang) setLang(storedLang);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("projects")
          .select("image_url")
          .not("image_url", "is", null)
          .order("starts_at", { ascending: false, nullsFirst: false })
          .limit(1);
        const image = data?.[0]?.image_url;
        if (typeof image === "string" && image.trim()) setHeroImage(image);
      } catch {
        // The graphical hero fallback is intentional when no project image is available.
      }
    })();
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
      <SiteHeader lang={lang} setLang={setLangPersist} theme={theme} toggleTheme={toggleTheme} t={t} />

      {!loading && isAdmin && (
        <Link to="/admin" className="allo-admin-fab">
          <LayoutDashboard className="h-4 w-4" />
          Adminpanelen
        </Link>
      )}

      <main>
        <section className="allo-hero relative isolate overflow-hidden">
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-700"
            style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
          />
          {!heroImage && <HeroFallback />}
          <div className="allo-hero-overlay absolute inset-0 -z-10" />

          <div className="mx-auto flex min-h-[680px] max-w-[1380px] items-end px-5 pb-16 pt-24 md:min-h-[720px] md:px-8 md:pb-20 lg:pb-24">
            <div className="max-w-4xl">
              <div className="allo-eyebrow animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.heroEyebrow}
              </div>
              <h1 className="allo-display mt-5 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                WE MAKE IT<br />HAPPEN<span className="text-white/45">.</span>
              </h1>
              <p className="mt-6 text-xl font-semibold text-white md:text-2xl">{copy.heroLine}</p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/72 md:text-lg">{copy.heroBody}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#booking" className="allo-primary-button">
                  {copy.startProject}<ArrowRight className="h-4 w-4" />
                </a>
                <a href="#projects" className="allo-hero-secondary">
                  {copy.viewCases}<ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="allo-light-section scroll-mt-24 py-20 md:py-24">
          <div className="mx-auto max-w-[1380px] px-5 md:px-8">
            <SectionHeading eyebrow={copy.servicesEyebrow} title={copy.servicesTitle} dark={false} />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ServiceCard id="service-event" icon={CalendarDays} title={copy.eventTitle} description={copy.eventBody} href="#about" />
              <ServiceCard id="service-staffing" icon={Users} title={copy.staffingTitle} description={copy.staffingBody} onClick={() => setBemanningOpen(true)} />
              <ServiceCard id="service-expo" icon={Cuboid} title={copy.expoTitle} description={copy.expoBody} href={BUILDER_URL} external />
              <ServiceCard id="service-logistics" icon={Truck} title={copy.logisticsTitle} description={copy.logisticsBody} href="#booking" />
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
            <a href="#booking" onClick={() => setBemanningOpen(false)} className="allo-primary-button mt-2 w-fit">{copy.startProject}</a>
          </DialogContent>
        </Dialog>

        <div className="allo-dark-section">
          <ProjectsSection t={t.projectsSection} />
        </div>

        <section id="builder" className="allo-light-section py-20 md:py-28">
          <div className="mx-auto grid max-w-[1380px] items-center gap-10 px-5 md:px-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <span className="allo-section-kicker">{copy.builderKicker}</span>
              <h2 className="allo-section-title mt-3 text-[#111218]">{copy.builderTitle}</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#565966] md:text-lg">{t.about.techDesc}</p>
              <ul className="mt-7 grid gap-3 text-sm text-[#272934] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {t.showcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#181818]/15 bg-[#181818] text-white"><Check className="h-3.5 w-3.5" /></span>
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

        <section id="about" className="allo-proof-strip scroll-mt-24">
          <div className="mx-auto grid max-w-[1380px] divide-y divide-white/10 px-5 md:grid-cols-4 md:divide-x md:divide-y-0 md:px-8">
            <ProofItem icon={PackageCheck} title={copy.proof1Title} body={copy.proof1Body} />
            <ProofItem icon={Cuboid} title={copy.proof2Title} body={copy.proof2Body} />
            <ProofItem icon={Users} title={copy.proof3Title} body={copy.proof3Body} />
            <ProofItem icon={MapPin} title={copy.proof4Title} body={copy.proof4Body} />
          </div>
        </section>

        <section className="allo-about-panel py-20 md:py-28">
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

        <section id="partners" className="allo-light-section py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-5 md:px-8">
            <SectionHeading eyebrow={t.partners.kicker} title={t.partners.title} dark={false} centered />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <PartnerCard
                href="https://www.nessim.se"
                logoSrc="/images/partners/nessim-logo.png"
                logoAlt="Nessim Fair Support"
                title={t.partners.nessim_header}
                description={t.partners.nessim_desc}
              />
              <PartnerCard
                href="https://www.workman.se"
                logoSrc="/images/partners/workman-logo.png"
                logoAlt="WorkMan Event"
                title={t.partners.workman_header}
                description={t.partners.workman_desc}
                workman
              />
            </div>
          </div>
        </section>

        <div className="allo-booking-wrap">
          <BookingSection t={t.booking} />
        </div>

        <section id="contact" className="allo-contact-section scroll-mt-24 py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-5 md:px-8">
            <SectionHeading eyebrow={t.contact.tag} title={copy.contactTitle} dark />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <PersonCard name="Jerry Fors" role={t.contact.ceo} email="Jerry@alloevent.se" phone="+46 (0) 702 23 96 80" />
              <PersonCard name="Jacob Karlestedt" role={t.contact.cofounder} email="Jacob@alloevent.se" phone="+46 (0) 707 30 96 27" />
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
            [copy.viewCases, "#projects"], [copy.builderTitle, BUILDER_URL], [copy.aboutNav, "#about"], [copy.jobsNav, PORTAL_URL],
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
      <span className={`allo-section-kicker ${dark ? "text-white/55" : "text-[#151515]/55"}`}>{eyebrow}</span>
      <h2 className={`allo-section-title mt-3 ${dark ? "text-white" : "text-[#111218]"}`}>{title}</h2>
    </div>
  );
}

function ServiceCard({ id, icon: Icon, title, description, href, external, onClick }: { id: string; icon: typeof Users; title: string; description: string; href?: string; external?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="allo-service-icon"><Icon className="h-6 w-6" /></span>
        <ChevronRight className="h-5 w-5 text-[#151515]/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#151515]" />
      </div>
      <h3 className="mt-8 text-lg font-extrabold text-[#171820]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#666977]">{description}</p>
    </>
  );
  const className = "group allo-service-card scroll-mt-28";
  if (onClick) return <button id={id} type="button" onClick={onClick} className={`${className} text-left`}>{content}</button>;
  return <a id={id} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={className}>{content}</a>;
}

function ProofItem({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return (
    <div className="flex items-center gap-4 py-7 md:px-7 md:py-8 first:md:pl-0 last:md:pr-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-white/70"><Icon className="h-5 w-5" /></span>
      <div><div className="text-base font-bold text-white">{title}</div><div className="mt-1 text-xs leading-relaxed text-white/45">{body}</div></div>
    </div>
  );
}

function PartnerCard({ href, logoSrc, logoAlt, title, description, workman }: { href: string; logoSrc: string; logoAlt: string; title: string; description: string; workman?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="allo-partner-card group">
      <div className="flex min-h-24 items-center justify-center border-b border-[#151824]/8 pb-7">
        <img src={logoSrc} alt={logoAlt} className={`max-h-16 max-w-[220px] object-contain ${workman ? "" : ""}`} />
      </div>
      <h3 className="mt-6 text-center text-base font-extrabold text-[#171820]">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-[#686b78]">{description}</p>
      <span className="mx-auto mt-5 flex w-fit items-center gap-1 text-xs font-bold text-[#151515]/60">{logoAlt}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
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

function HeroFallback() {
  return (
    <div className="absolute inset-0 -z-20 overflow-hidden bg-[#050505]">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_68%_10%,rgba(255,255,255,.10),transparent_28%),radial-gradient(circle_at_32%_18%,rgba(255,255,255,.04),transparent_30%)]" />
      <div className="absolute bottom-[14%] right-[8%] h-[52%] w-[46%] border border-white/8 bg-white/[0.025] shadow-[0_0_80px_rgba(255,255,255,.035)]" />
      <div className="absolute bottom-[14%] right-[8%] h-[6px] w-[46%] bg-white/18 blur-sm" />
      <div className="absolute inset-x-0 top-[14%] h-px bg-white/10" />
      <div className="absolute left-[12%] top-[14%] h-[38%] w-px rotate-[17deg] bg-white/10" />
      <div className="absolute right-[14%] top-[14%] h-[38%] w-px -rotate-[17deg] bg-white/10" />
      <div className="absolute right-[17%] top-[25%] text-[clamp(2rem,5vw,5rem)] font-black tracking-[.1em] text-white/[0.035]">ALLO EVENT</div>
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

const svCopy = {
  heroEyebrow: "Eventproduktion · Bemanning · Mässor",
  heroLine: "Eventproduktion. Bemanning. Mässor.",
  heroBody: "Vi bygger, bemannar och genomför event från idé till färdig leverans – med rätt människor, rätt struktur och varje detalj på plats.",
  startProject: "Starta ett projekt",
  viewCases: "Se våra case",
  servicesEyebrow: "Vad vi gör",
  servicesTitle: "Allt som krävs för att få eventet på plats",
  eventTitle: "Eventproduktion",
  eventBody: "Helhetsproduktion för event, konferenser och aktiveringar – från planering till genomförande.",
  staffingTitle: "Bemanning",
  staffingBody: "Flexibel och erfaren personal för event, mässor, service, bygg, lager och logistik.",
  expoTitle: "Mässor & Monter",
  expoBody: "Monterplanering, byggnation och digital 3D-visualisering för en smidigare mässleverans.",
  logisticsTitle: "Rigg & Logistik",
  logisticsBody: "Inbärning, utbärning, montage, rivning, transport och stagehands när allt måste fungera i tid.",
  builderKicker: "Digital monterplanering",
  builderTitle: "Bygg din monter innan den finns",
  proof1Title: "Helhetsleverans",
  proof1Body: "Från första plan till sista utbärning",
  proof2Title: "3D i realtid",
  proof2Body: "Visualisering och offert direkt i verktyget",
  proof3Title: "Flexibla team",
  proof3Body: "Bemanning som skalar efter uppdraget",
  proof4Title: "Stockholm",
  proof4Body: "Med projekt och partnerskap över Sverige",
  contactTitle: "Människorna bakom leveransen",
  footerBody: "Allo Event kombinerar eventproduktion, bemanning och smarta digitala verktyg för att göra komplexa leveranser enklare.",
  companyTitle: "Allo Event",
  aboutNav: "Om oss",
  jobsNav: "Jobba hos oss",
};

const enCopy = {
  heroEyebrow: "Event production · Staffing · Exhibitions",
  heroLine: "Event production. Staffing. Exhibitions.",
  heroBody: "We build, staff and deliver events from first idea to final handover – with the right people, clear structure and every detail in place.",
  startProject: "Start a project",
  viewCases: "View our cases",
  servicesEyebrow: "What we do",
  servicesTitle: "Everything required to make the event happen",
  eventTitle: "Event Production",
  eventBody: "Full-service production for events, conferences and activations – from planning to execution.",
  staffingTitle: "Staffing",
  staffingBody: "Flexible, experienced staff for events, exhibitions, service, construction, warehouse and logistics.",
  expoTitle: "Fairs & Booths",
  expoBody: "Booth planning, construction and digital 3D visualization for a smoother exhibition delivery.",
  logisticsTitle: "Rigging & Logistics",
  logisticsBody: "Load-in, load-out, assembly, dismantling, transport and stagehands when timing matters.",
  builderKicker: "Digital booth planning",
  builderTitle: "Build your booth before it exists",
  proof1Title: "End-to-end delivery",
  proof1Body: "From first plan to final load-out",
  proof2Title: "Real-time 3D",
  proof2Body: "Visualization and quote inside the tool",
  proof3Title: "Flexible teams",
  proof3Body: "Staffing that scales with the assignment",
  proof4Title: "Stockholm",
  proof4Body: "Projects and partnerships across Sweden",
  contactTitle: "The people behind the delivery",
  footerBody: "Allo Event combines event production, staffing and smart digital tools to make complex deliveries easier.",
  companyTitle: "Allo Event",
  aboutNav: "About us",
  jobsNav: "Work with us",
};
