import type { SiteCopy } from "@/lib/site-copy";

export function AboutSection({ copy }: { copy: SiteCopy["about"] }) {
  return (
    <section className="allo-v7-section" id="om-oss" aria-labelledby="allo-v7-about-title">
      <div className="allo-v7-wrap allo-v7-about">
        <div>
          <span className="allo-v7-mono allo-v7-mark">
            {copy.no} / {copy.label}
          </span>
          <h2 id="allo-v7-about-title">{copy.title}</h2>
          <p className="allo-v7-about-body">{copy.body}</p>
        </div>
        <dl className="allo-v7-facts">
          {copy.facts.map(([label, value]) => (
            <div key={label}>
              <dt className="allo-v7-mono">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
