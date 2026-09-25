import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { FeaturedCase } from "@/lib/site-data";
import { SITE_LINKS, type SiteCopy } from "@/lib/site-copy";
import { PlanPlaceholder } from "./PlanPlaceholder";

type Props = {
  cases: FeaturedCase[];
  copy: SiteCopy["cases"];
  placeholder: SiteCopy["placeholder"]["caseCard"];
};

export function FeaturedCases({ cases, copy, placeholder }: Props) {
  // Döljs helt när det inte finns publicerade case.
  if (!cases.length) return null;

  return (
    <section className="allo-v7-section" id="case" aria-labelledby="allo-v7-cases-title">
      <div className="allo-v7-wrap">
        <div className="allo-v7-section-head">
          <span className="allo-v7-mono allo-v7-mark">
            {copy.no} / {copy.label}
          </span>
          <h2 id="allo-v7-cases-title">{copy.title}</h2>
          <a href={SITE_LINKS.cases} className="allo-v7-arrow-link allo-v7-mono">
            {copy.all}
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <div className="allo-v7-cases">
          {cases.map((item, index) => (
            <CaseCard key={item.id} item={item} index={index} copy={copy} placeholder={placeholder} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseCard({ item, index, copy, placeholder }: { item: FeaturedCase; index: number; copy: SiteCopy["cases"]; placeholder: SiteCopy["placeholder"]["caseCard"] }) {
  const [failed, setFailed] = useState(false);
  const number = String(index + 1).padStart(2, "0");
  const meta = [item.location || item.venue, item.year].filter(Boolean).join(" · ");
  const title = item.title || "Allo Event";
  const href = `/case/${item.slug || item.id}`;

  return (
    <a href={href} className="allo-v7-case">
      <div className="allo-v7-case-media">
        <span className="allo-v7-mono allo-v7-case-no">{number}</span>
        {item.image && !failed ? (
          <img src={item.image} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        ) : (
          <PlanPlaceholder copy={{ ...placeholder, code: `${placeholder.code} ${number}` }} small />
        )}
      </div>
      <div className="allo-v7-case-body">
        <h3>{title}</h3>
        {meta ? <span className="allo-v7-mono allo-v7-case-meta">{meta}</span> : null}
        <span className="allo-v7-mono allo-v7-case-cta">
          {copy.view}
          <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}
