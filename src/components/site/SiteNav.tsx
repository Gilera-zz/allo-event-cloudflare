import { useState } from "react";
import { ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import logo from "@/assets/allo-logo-header.png";
import type { Lang } from "@/lib/i18n";
import { SITE_LINKS, type SiteCopy } from "@/lib/site-copy";

type Props = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  copy: SiteCopy["nav"];
  /** "" på startsidan, "/" på andra sidor så att ankarlänkar blir /#... */
  homeBase?: "" | "/";
  active?: "home" | "event" | "staffing" | "cases";
};

export function SiteNav({ lang, setLang, copy, homeBase = "", active = "home" }: Props) {
  const [open, setOpen] = useState(false);
  const anchor = (hash: string) => `${homeBase}${hash}`;
  const toggleLang = () => setLang(lang === "sv" ? "en" : "sv");

  const links: { label: string; href: string; key: Props["active"] | "about" | "contact"; no: string }[] = [
    { label: copy.event, href: SITE_LINKS.event, key: "event", no: "01" },
    { label: copy.staffing, href: SITE_LINKS.staffing, key: "staffing", no: "02" },
    { label: copy.cases, href: SITE_LINKS.cases, key: "cases", no: "03" },
    { label: copy.about, href: anchor(SITE_LINKS.about), key: "about", no: "06" },
    { label: copy.contact, href: anchor(SITE_LINKS.contact), key: "contact", no: "07" },
  ];

  return (
    <header className="allo-v7-header">
      <div className="allo-v7-wrap allo-v7-header-row">
        <a href={homeBase || "/"} className="allo-v7-logo" aria-label={copy.home}>
          <img src={logo} alt="Allo Event" width={88} height={40} />
        </a>

        <nav className="allo-v7-nav" aria-label="Huvudmeny">
          {links.map((link) => (
            <a key={link.key} href={link.href} className={active === link.key ? "is-active" : undefined}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="allo-v7-header-tools">
          <a href={SITE_LINKS.portal} target="_blank" rel="noopener noreferrer" className="allo-v7-tool allo-v7-tool--jobs">
            <UserRound aria-hidden="true" />
            <span>{copy.jobs}</span>
          </a>
          <button type="button" onClick={toggleLang} className="allo-v7-tool allo-v7-lang" aria-label={copy.langLabel} title={copy.langSwitch}>
            <b>{lang === "sv" ? "SV" : "EN"}</b>
            <span aria-hidden="true">/</span>
            <span>{lang === "sv" ? "EN" : "SV"}</span>
          </button>
          <a href={anchor(SITE_LINKS.contact)} className="allo-v7-btn allo-v7-btn--primary">
            {copy.cta}
          </a>
        </div>

        <button
          type="button"
          className="allo-v7-burger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="allo-v7-menu"
          aria-label={open ? copy.menuClose : copy.menuOpen}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="allo-v7-menu" className="allo-v7-menu">
          <div className="allo-v7-wrap">
            <nav aria-label="Meny">
              {links.map((link) => (
                <a key={link.key} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                  <small>{link.no}</small>
                </a>
              ))}
            </nav>
            <div className="allo-v7-menu-tools">
              <a href={SITE_LINKS.portal} target="_blank" rel="noopener noreferrer" className="allo-v7-tool">
                <UserRound aria-hidden="true" />
                {copy.jobs}
                <ArrowUpRight aria-hidden="true" />
              </a>
              <button type="button" onClick={toggleLang} className="allo-v7-tool allo-v7-lang" aria-label={copy.langLabel}>
                <b>{lang === "sv" ? "SV" : "EN"}</b>
                <span aria-hidden="true">/</span>
                <span>{lang === "sv" ? "EN" : "SV"}</span>
              </button>
              <a href={anchor(SITE_LINKS.contact)} onClick={() => setOpen(false)} className="allo-v7-btn allo-v7-btn--primary">
                {copy.cta}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
