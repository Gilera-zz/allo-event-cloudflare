import { ArrowUpRight } from "lucide-react";
import type { ExtraPartner } from "@/lib/site-data";
import type { SiteCopy } from "@/lib/site-copy";

/** Formen på translations[lang].partners i src/lib/i18n.ts. */
type PartnerTexts = {
  description: string;
  nessim_header: string;
  nessim_desc: string;
  nessim_cta: string;
  workman_header: string;
  workman_desc: string;
  workman_cta: string;
};

type Props = {
  copy: SiteCopy["partners"];
  /** Samma texter, loggor och länkar som i dag, från translations.partners. */
  t: PartnerTexts;
  extra: ExtraPartner[];
};

const MAIN_PARTNERS = [
  {
    key: "nessim",
    href: "https://www.nessim.se",
    logo: "/images/partners/nessim-logo-cropped.png",
    alt: "Nessim Fair Support",
  },
  {
    key: "workman",
    href: "https://www.workman.se",
    logo: "/images/partners/workman-logo-white.png",
    alt: "WorkMan Event",
  },
] as const;

export function PartnersSection({ copy, t, extra }: Props) {
  return (
    <section className="allo-v7-section" id="partners" aria-labelledby="allo-v7-partners-title">
      <div className="allo-v7-wrap">
        <div className="allo-v7-section-head">
          <span className="allo-v7-mono allo-v7-mark">
            {copy.no} / {copy.label}
          </span>
          <h2 id="allo-v7-partners-title">{copy.title}</h2>
          <p className="allo-v7-lead">{t.description}</p>
        </div>

        {/* Nessim och WorkMan står alltid överst. */}
        <div className="allo-v7-partners">
          {MAIN_PARTNERS.map((partner) => (
            <a key={partner.key} href={partner.href} target="_blank" rel="noopener noreferrer" className="allo-v7-partner">
              <div className={`allo-v7-partner-logo allo-v7-partner-logo--${partner.key}`}>
                <img src={partner.logo} alt={partner.alt} loading="lazy" decoding="async" />
              </div>
              <h3>{partner.key === "nessim" ? t.nessim_header : t.workman_header}</h3>
              <p>{partner.key === "nessim" ? t.nessim_desc : t.workman_desc}</p>
              <span className="allo-v7-arrow-link allo-v7-mono">
                {partner.key === "nessim" ? t.nessim_cta : t.workman_cta}
                <ArrowUpRight aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>

        <ExtraPartners partners={extra} title={copy.alsoTitle} />
      </div>
    </section>
  );
}

/** "Vi samarbetar även med". Datakällan kommer senare; döljs helt när listan är tom. */
export function ExtraPartners({ partners, title }: { partners: ExtraPartner[]; title: string }) {
  if (!partners.length) return null;
  return (
    <div className="allo-v7-partners-extra">
      <h3>{title}</h3>
      <div className="allo-v7-partners-extra-list">
        {partners.map((partner) => {
          const content = partner.logo ? <img src={partner.logo} alt={partner.name} loading="lazy" /> : <span>{partner.name}</span>;
          return partner.url ? (
            <a key={partner.id} href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={partner.name}>
              {content}
            </a>
          ) : (
            <div key={partner.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
