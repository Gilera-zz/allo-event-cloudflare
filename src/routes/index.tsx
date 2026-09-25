import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { HeroSplit } from "@/components/site/HeroSplit";
import { FeaturedCases } from "@/components/site/FeaturedCases";
import { StudioBand } from "@/components/site/StudioBand";
import { PartnersSection } from "@/components/site/PartnersSection";
import { AboutSection } from "@/components/site/AboutSection";
import { ContactSection } from "@/components/site/ContactSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { translations, type Lang } from "@/lib/i18n";
import { siteCopy } from "@/lib/site-copy";
import { EMPTY_HOME_DATA, loadHomeData, type HomeData } from "@/lib/site-data";
import { useAuth } from "@/hooks/use-auth";

import siteCss from "../styles/site.css?url";

export const Route = createFileRoute("/")({
  component: Index,
  // Startsidans data hämtas på servern via loadern, så att case och text finns i server-HTML:en.
  loader: async (): Promise<HomeData> => {
    try {
      return await loadHomeData();
    } catch {
      return EMPTY_HOME_DATA;
    }
  },
  staleTime: 60_000,
  head: () => ({
    meta: [
      { title: "Allo Event – Eventproduktion, Bemanning & Mässor" },
      { name: "description", content: "Allo Event hjälper företag med eventproduktion, mässor, monterbyggnation, rigg, logistik och flexibel bemanning i Stockholm och övriga Sverige." },
      { property: "og:title", content: "Allo Event – Eventproduktion, Bemanning & Mässor" },
      { property: "og:description", content: "Vi bygger, bemannar och genomför event – från idé till färdig leverans." },
      { property: "og:url", content: "https://alloevent.se" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://alloevent.se" },
      { rel: "stylesheet", href: siteCss },
    ],
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
  const data = Route.useLoaderData();
  const [lang, setLang] = useState<Lang>("sv");
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "sv" || stored === "en") setLang(stored);
    } catch {
      // localStorage kan vara avstängt; svenska gäller då.
    }
  }, []);

  const setLangPersist = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      // ignorera
    }
  };

  const copy = siteCopy[lang];
  const t = translations[lang];

  return (
    <div id="top" className="allo-v7">
      <SiteNav lang={lang} setLang={setLangPersist} copy={copy.nav} />

      <main>
        <HeroSplit hero={data.hero} copy={copy.hero} placeholders={copy.placeholder} />
        <FeaturedCases cases={data.cases} copy={copy.cases} placeholder={copy.placeholder.caseCard} />
        <StudioBand copy={copy.studio} />
        <PartnersSection copy={copy.partners} t={t.partners} extra={data.extraPartners} />
        <AboutSection copy={copy.about} />
        <ContactSection copy={copy.contact} />
      </main>

      <SiteFooter copy={copy.footer} nav={copy.nav} />

      {!loading && isAdmin ? (
        <Link to="/admin" className="allo-v7-admin allo-v7-mono">
          {copy.nav.admin} →
        </Link>
      ) : null}
    </div>
  );
}
