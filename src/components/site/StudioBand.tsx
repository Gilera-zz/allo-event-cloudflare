import { ArrowUpRight } from "lucide-react";
import { SITE_LINKS, type SiteCopy } from "@/lib/site-copy";

export function StudioBand({ copy }: { copy: SiteCopy["studio"] }) {
  return (
    <section className="allo-v7-studio" aria-label="Allo Studio">
      <div className="allo-v7-wrap allo-v7-studio-row">
        <span className="allo-v7-mono allo-v7-mark">
          {copy.no} / {copy.label}
        </span>
        <p>{copy.line}</p>
        <a href={SITE_LINKS.studio} target="_blank" rel="noopener noreferrer" className="allo-v7-btn allo-v7-btn--primary">
          {copy.cta}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
