import { useState } from "react";
import { ChevronDown, Globe, Menu, UserRound, X } from "lucide-react";
import logo from "@/assets/allo-logo.png";
import type { Lang } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";
import type { Theme, ThemePreference } from "@/hooks/use-theme";

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  preference: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  t: any;
  /** Prefix anchor links with / when the header is rendered away from the homepage. */
  homeBase?: "" | "/";
  activeNav?: "home" | "cases";
}

const PORTAL_URL = "https://personal.alloevent.se";

export function SiteHeader({ lang, setLang, theme, preference, setTheme, homeBase = "", activeNav = "home" }: Props) {
  const [open, setOpen] = useState(false);
  const homeAnchor = (hash: string) => `${homeBase}${hash}`;
  const sv = lang === "sv";

  const labels = {
    home: sv ? "Hem" : "Home",
    services: sv ? "Tjänster" : "Services",
    cases: sv ? "Case" : "Cases",
    builder: sv ? "3D-monterverktyg" : "3D booth tool",
    process: sv ? "Så arbetar vi" : "How we work",
    about: sv ? "Om Allo" : "About Allo",
    contact: sv ? "Kontakt" : "Contact",
    jobs: sv ? "Jobba hos oss" : "Work with us",
    start: sv ? "Be om offert" : "Request a quote",
    event: sv ? "Eventproduktion" : "Event production",
    staffing: sv ? "Bemanning" : "Staffing",
    expo: sv ? "Mässor & monter" : "Fairs & booths",
    logistics: sv ? "Rigg & logistik" : "Rigging & logistics",
  };

  return (
    <header className="allo-header sticky top-0 z-50">
      <div className="mx-auto flex h-[74px] max-w-[1380px] items-center justify-between gap-4 px-5 lg:px-8">
        <a href={homeAnchor("#top")} className="flex shrink-0 items-center" aria-label="Allo Event – startsida">
          <img src={logo} alt="Allo Event" className="h-14 w-auto object-contain" />
        </a>

        <nav className="hidden items-center gap-7 text-[13px] font-semibold lg:flex">
          <a href={homeAnchor("#top")} className={`allo-nav-link ${activeNav === "home" ? "allo-nav-link-active" : ""}`}>{labels.home}</a>
          <div className="group relative">
            <a href={homeAnchor("#services")} className="allo-nav-link inline-flex items-center gap-1.5">
              {labels.services}<ChevronDown className="h-3.5 w-3.5" />
            </a>
            <div className="pointer-events-none absolute left-1/2 top-full w-60 -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
              <div className="allo-menu-card overflow-hidden rounded-2xl p-2">
                <a href={homeAnchor("#service-event")} className="allo-menu-item">{labels.event}</a>
                <a href={homeAnchor("#service-staffing")} className="allo-menu-item">{labels.staffing}</a>
                <a href={homeAnchor("#service-expo")} className="allo-menu-item">{labels.expo}</a>
                <a href={homeAnchor("#service-logistics")} className="allo-menu-item">{labels.logistics}</a>
                <a href={homeAnchor("#builder")} className="allo-menu-item">{labels.builder}</a>
              </div>
            </div>
          </div>
          <a href={homeAnchor("#projects")} className={`allo-nav-link ${activeNav === "cases" ? "allo-nav-link-active" : ""}`}>{labels.cases}</a>
          <a href={homeAnchor("#process")} className="allo-nav-link">{labels.process}</a>
          <a href={homeAnchor("#about")} className="allo-nav-link">{labels.about}</a>
          <a href={homeAnchor("#contact")} className="allo-nav-link">{labels.contact}</a>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={() => setLang(lang === "sv" ? "en" : "sv")}
            className="allo-header-icon"
            aria-label="Byt språk"
            title={lang === "sv" ? "Switch to English" : "Byt till svenska"}
          >
            <Globe className="h-4 w-4" />
            <span className="text-[11px] font-bold">{lang.toUpperCase()}</span>
          </button>
          <ThemeToggle theme={theme} preference={preference} setTheme={setTheme} lang={lang} />
          <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer" className="allo-header-jobs">
            <UserRound className="h-4 w-4" />
            {labels.jobs}
          </a>
          <a href={homeAnchor("#booking")} data-booking-intent="quote" className="allo-primary-button h-10 px-5 text-[12px]">
            {labels.start}
          </a>
        </div>

        <button
          type="button"
          className="allo-header-icon lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Stäng meny" : "Öppna meny"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="allo-mobile-menu border-t px-5 py-5 lg:hidden">
          <div className="mx-auto grid max-w-[1380px] gap-1">
            <a onClick={() => setOpen(false)} href={homeAnchor("#top")} className="allo-mobile-link">{labels.home}</a>
            <a onClick={() => setOpen(false)} href={homeAnchor("#services")} className="allo-mobile-link">{labels.services}</a>
            <a onClick={() => setOpen(false)} href={homeAnchor("#projects")} className="allo-mobile-link">{labels.cases}</a>
            <a onClick={() => setOpen(false)} href={homeAnchor("#process")} className="allo-mobile-link">{labels.process}</a>
            <a onClick={() => setOpen(false)} href={homeAnchor("#builder")} className="allo-mobile-link">{labels.builder}</a>
            <a onClick={() => setOpen(false)} href={homeAnchor("#about")} className="allo-mobile-link">{labels.about}</a>
            <a onClick={() => setOpen(false)} href={homeAnchor("#contact")} className="allo-mobile-link">{labels.contact}</a>
            <div className="mt-4 flex items-center justify-between gap-3 border-b border-current/10 pb-4">
              <button
                onClick={() => setLang(lang === "sv" ? "en" : "sv")}
                className="allo-header-icon"
                aria-label="Byt språk"
              >
                <Globe className="h-4 w-4" />
                <span className="text-[11px] font-bold">{lang.toUpperCase()}</span>
              </button>
              <ThemeToggle theme={theme} preference={preference} setTheme={setTheme} lang={lang} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer" className="allo-secondary-button justify-center">{labels.jobs}</a>
              <a onClick={() => setOpen(false)} href={homeAnchor("#booking")} data-booking-intent="quote" className="allo-primary-button justify-center">{labels.start}</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
