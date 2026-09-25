import logo from "@/assets/allo-logo-header.png";
import { COMPANY, CONTACT_PEOPLE, SITE_LINKS, type SiteCopy } from "@/lib/site-copy";

type Props = {
  copy: SiteCopy["footer"];
  nav: SiteCopy["nav"];
  homeBase?: "" | "/";
};

export function SiteFooter({ copy, nav, homeBase = "" }: Props) {
  const anchor = (hash: string) => `${homeBase}${hash}`;
  const jerry = CONTACT_PEOPLE[0];

  return (
    <footer className="allo-v7-footer">
      <div className="allo-v7-wrap allo-v7-footer-grid">
        <div>
          <img src={logo} alt="Allo Event" width={97} height={44} loading="lazy" />
          <p>{copy.body}</p>
        </div>
        <div className="allo-v7-footer-col">
          <h3 className="allo-v7-mono">{copy.pages}</h3>
          <a href={SITE_LINKS.event}>{nav.event}</a>
          <a href={SITE_LINKS.staffing}>{nav.staffing}</a>
          <a href={SITE_LINKS.cases}>{nav.cases}</a>
          <a href={anchor(SITE_LINKS.about)}>{nav.about}</a>
          <a href={anchor(SITE_LINKS.contact)}>{nav.contact}</a>
        </div>
        <div className="allo-v7-footer-col">
          <h3 className="allo-v7-mono">{copy.contact}</h3>
          <a href={`mailto:${jerry.email}`}>{jerry.email}</a>
          <a href={jerry.tel}>{jerry.phone}</a>
          <a href={anchor(SITE_LINKS.contact)}>
            {COMPANY.street}, {COMPANY.postal}
          </a>
        </div>
        <div className="allo-v7-footer-col">
          <h3 className="allo-v7-mono">{copy.staff}</h3>
          <a href={SITE_LINKS.portal} target="_blank" rel="noopener noreferrer">
            {copy.staffLink} ↗
          </a>
          <small>{copy.staffNote}</small>
        </div>
      </div>
      <div className="allo-v7-footer-bottom">
        <div className="allo-v7-wrap">
          <span>{copy.copyright}</span>
          <a href={SITE_LINKS.portal} target="_blank" rel="noopener noreferrer">
            personal.alloevent.se ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
