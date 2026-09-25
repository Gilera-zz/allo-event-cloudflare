import { ArrowRight, Mail, Phone } from "lucide-react";
import { COMPANY, CONTACT_PEOPLE, SITE_LINKS, type SiteCopy } from "@/lib/site-copy";

export function ContactSection({ copy }: { copy: SiteCopy["contact"] }) {
  return (
    <section className="allo-v7-section" id="kontakt" aria-labelledby="allo-v7-contact-title">
      <div className="allo-v7-wrap">
        <div className="allo-v7-section-head">
          <span className="allo-v7-mono allo-v7-mark">
            {copy.no} / {copy.label}
          </span>
          <h2 id="allo-v7-contact-title">{copy.title}</h2>
        </div>

        <div className="allo-v7-people">
          {CONTACT_PEOPLE.map((person) => (
            <div key={person.email} className="allo-v7-person">
              <span className="allo-v7-mono">{copy[person.roleKey]}</span>
              <h3>{person.name}</h3>
              <a href={`mailto:${person.email}`}>
                <Mail aria-hidden="true" />
                {person.email}
              </a>
              <a href={person.tel}>
                <Phone aria-hidden="true" />
                {person.phone}
              </a>
            </div>
          ))}
        </div>

        <div className="allo-v7-company">
          <dl>
            <dt className="allo-v7-mono">{copy.company}</dt>
            <dd>{COMPANY.name}</dd>
            <dd>
              {copy.org} {COMPANY.orgNo}
            </dd>
          </dl>
          <dl>
            <dt className="allo-v7-mono">{copy.address}</dt>
            <dd>{COMPANY.street}</dd>
            <dd>{COMPANY.postal}</dd>
          </dl>
          <div>
            <a href={SITE_LINKS.request} className="allo-v7-btn allo-v7-btn--primary">
              {copy.cta}
              <ArrowRight aria-hidden="true" />
            </a>
            <small>{copy.ctaNote}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
