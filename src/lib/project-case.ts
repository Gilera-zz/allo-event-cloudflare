export type CaseFact = {
  label: string;
  value: string;
};

export type CaseTimelineItem = {
  time: string;
  title: string;
  detail?: string;
};

export type CaseGalleryItem = {
  url: string;
  alt: string;
  caption?: string;
  layout?: "wide" | "half" | "portrait";
};

export type CaseCredit = {
  label: string;
  value: string;
};

export type ProjectCase = {
  id: string;
  title: string | null;
  category: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  positions_needed: number | null;
  image_url: string | null;
  description?: string | null;
  status?: string | null;
  slug?: string | null;
  case_published?: boolean | null;
  case_featured?: boolean | null;
  case_sort_order?: number | null;
  case_client_name?: string | null;
  case_venue?: string | null;
  case_year?: number | null;
  case_subtitle?: string | null;
  case_excerpt?: string | null;
  case_hero_image_url?: string | null;
  case_hero_video_url?: string | null;
  case_intro_title?: string | null;
  case_intro_body?: string | null;
  case_challenge_title?: string | null;
  case_challenge_body?: string | null;
  case_solution_title?: string | null;
  case_solution_body?: string | null;
  case_result_title?: string | null;
  case_result_body?: string | null;
  case_services?: CaseServiceValue | null;
  case_facts?: CaseFactValue | null;
  case_timeline?: CaseTimelineValue | null;
  case_gallery?: CaseGalleryValue | null;
  case_credits?: CaseCreditValue | null;
  case_quote?: string | null;
  case_quote_author?: string | null;
  case_quote_role?: string | null;
  case_cta_title?: string | null;
  case_cta_body?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  case_published_at?: string | null;
};

type CaseServiceValue = string[] | string | unknown;
type CaseFactValue = CaseFact[] | string | unknown;
type CaseTimelineValue = CaseTimelineItem[] | string | unknown;
type CaseGalleryValue = CaseGalleryItem[] | string | unknown;
type CaseCreditValue = CaseCredit[] | string | unknown;

export const PROJECT_CASE_SELECT = [
  "id",
  "title",
  "category",
  "location",
  "starts_at",
  "ends_at",
  "positions_needed",
  "image_url",
  "description",
  "status",
  "slug",
  "case_published",
  "case_featured",
  "case_sort_order",
  "case_client_name",
  "case_venue",
  "case_year",
  "case_subtitle",
  "case_excerpt",
  "case_hero_image_url",
  "case_hero_video_url",
  "case_intro_title",
  "case_intro_body",
  "case_challenge_title",
  "case_challenge_body",
  "case_solution_title",
  "case_solution_body",
  "case_result_title",
  "case_result_body",
  "case_services",
  "case_facts",
  "case_timeline",
  "case_gallery",
  "case_credits",
  "case_quote",
  "case_quote_author",
  "case_quote_role",
  "case_cta_title",
  "case_cta_body",
  "seo_title",
  "seo_description",
  "og_image_url",
  "case_published_at",
].join(",");

function parseJson<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T;
  if (value && typeof value === "object") return value as T;
  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function caseServices(project: ProjectCase): string[] {
  return parseJson<string[]>(project.case_services, []).filter((item): item is string => typeof item === "string" && !!item.trim());
}

export function caseFacts(project: ProjectCase): CaseFact[] {
  return parseJson<CaseFact[]>(project.case_facts, []).filter((item) => item && typeof item.label === "string" && typeof item.value === "string");
}

export function caseTimeline(project: ProjectCase): CaseTimelineItem[] {
  return parseJson<CaseTimelineItem[]>(project.case_timeline, []).filter((item) => item && typeof item.time === "string" && typeof item.title === "string");
}

export function caseGallery(project: ProjectCase): CaseGalleryItem[] {
  return parseJson<CaseGalleryItem[]>(project.case_gallery, []).filter((item) => item && typeof item.url === "string" && !!item.url.trim());
}

export function caseCredits(project: ProjectCase): CaseCredit[] {
  return parseJson<CaseCredit[]>(project.case_credits, []).filter((item) => item && typeof item.label === "string" && typeof item.value === "string");
}

export function slugifyCaseTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const DEMO_CASE_SLUG = "future-retail-summit-2026";

export const demoCase: ProjectCase = {
  id: "demo-future-retail-summit-2026",
  title: "Future Retail Summit 2026",
  category: "Eventproduktion",
  location: "Stockholm",
  starts_at: "2026-10-15T06:30:00+02:00",
  ends_at: "2026-10-16T20:00:00+02:00",
  positions_needed: 18,
  image_url: "/images/cases/future-retail-summit-2026/hero.webp",
  description: "Ett fiktivt demo-case som visar hur Allo Events nya caseformat kan användas för riktiga projekt.",
  status: "completed",
  slug: DEMO_CASE_SLUG,
  case_published: true,
  case_featured: true,
  case_sort_order: 1,
  case_client_name: "Future Retail Summit",
  case_venue: "Stockholm",
  case_year: 2026,
  case_subtitle: "Två dagar där retail, e-handel och innovation möttes i en komplett eventproduktion.",
  case_excerpt: "Från tom venue till färdig scen, expo, registrering och bemannad gästupplevelse – byggt som ett sammanhållet flöde.",
  case_hero_image_url: "/images/cases/future-retail-summit-2026/hero.webp",
  case_intro_title: "En mötesplats för framtidens handel.",
  case_intro_body: "Future Retail Summit samlade ledande aktörer inom retail, e-handel och innovation. I det här demo-caset ansvarar Allo Event för helheten bakom upplevelsen: produktionsplanering, scen, expo, registrering, bemanning, logistik och den sista detaljen innan dörrarna öppnar.",
  case_challenge_title: "Utmaningen",
  case_challenge_body: "Venue skulle gå från rå produktionsyta till representativ konferens- och expomiljö på ett snävt tidsfönster, samtidigt som flera leverantörer, teknikteam och gästyta behövde samordnas utan att störa varandras flöden.",
  case_solution_title: "Så byggde vi det",
  case_solution_body: "Leveransen delades upp i zoner med egna ansvariga, men drevs från en gemensam produktionsplan. Load-in, mattläggning, scen, signage, registrering och bemanning synkades så att varje team kunde lämna över till nästa utan väntetid.",
  case_result_title: "Resultatet",
  case_result_body: "En färdig eventmiljö med tydlig wayfinding, snabb registrering och ett produktionsflöde som kunde växla från bygg till live drift utan omtag. Demo-siffrorna nedan är medvetet märkta som exempel och ska ersättas med riktiga projektsiffror när ett case publiceras.",
  case_services: ["Projektledning", "Eventproduktion", "Scen & teknik", "Expo", "Bemanning", "Rigg & logistik"],
  case_facts: [
    { label: "Crew", value: "18 personer" },
    { label: "Build", value: "2 dagar" },
    { label: "Crew-tid", value: "72 h" },
    { label: "Leverans", value: "6 områden" },
  ],
  case_timeline: [
    { time: "06:30", title: "Load-in", detail: "Material, flightcases och signage in i venue." },
    { time: "08:15", title: "Build start", detail: "Golv, scen och expozoner byggs parallellt." },
    { time: "11:40", title: "Scen klar", detail: "AV-teamet tar över för test och programmering." },
    { time: "15:30", title: "Ljussättning", detail: "Front-of-house, lounge och wayfinding färdigställs." },
    { time: "18:45", title: "Detaljer", detail: "Registrering, möbler, print och guest flow checkas." },
    { time: "10:00", title: "Doors open", detail: "Crew går över till live drift och värdskap." },
  ],
  case_gallery: [
    { url: "/images/cases/future-retail-summit-2026/build.webp", alt: "Allo Event crew bygger scen och eventyta", caption: "Build: scen, mattor, truss och teknik på väg upp.", layout: "wide" },
    { url: "/images/cases/future-retail-summit-2026/registration.webp", alt: "Registrering och eventpersonal", caption: "Front-of-house och registrering – första mötet med gästen.", layout: "half" },
    { url: "/images/cases/future-retail-summit-2026/hero.webp", alt: "Färdig eventyta på Future Retail Summit 2026", caption: "Från produktionsyta till färdig mötesplats.", layout: "half" },
  ],
  case_credits: [
    { label: "Projektledning", value: "Allo Event" },
    { label: "Produktion", value: "Allo Event" },
    { label: "Demo", value: "AI-genererat presentationscase" },
  ],
  case_quote: "Allo Event levererade en helhetslösning som höll ihop hela vägen från första load-in till öppnade dörrar.",
  case_quote_author: "Demokund",
  case_quote_role: "Fiktivt citat för layoutdemo",
  case_cta_title: "Har ni något som ska byggas?",
  case_cta_body: "Berätta vad ni planerar så hjälper vi till med produktion, bemanning, mässa eller hela leveransen.",
  seo_title: "Future Retail Summit 2026 – Demo Case | Allo Event",
  seo_description: "Demo av Allo Events nya caseformat för eventproduktion, bemanning, expo och logistik.",
  og_image_url: "/images/cases/future-retail-summit-2026/hero.webp",
};

export function demoCasePayload() {
  // Deliberately exclude operational project fields. The admin demo helper is
  // allowed to populate presentation content, but must never silently change a
  // real project's title, staffing need, dates, status or location.
  return {
    slug: null,
    case_published: false,
    case_featured: false,
    case_sort_order: demoCase.case_sort_order,
    case_client_name: demoCase.case_client_name,
    case_venue: demoCase.case_venue,
    case_year: demoCase.case_year,
    case_subtitle: demoCase.case_subtitle,
    case_excerpt: demoCase.case_excerpt,
    case_hero_image_url: demoCase.case_hero_image_url,
    case_hero_video_url: demoCase.case_hero_video_url,
    case_intro_title: demoCase.case_intro_title,
    case_intro_body: demoCase.case_intro_body,
    case_challenge_title: demoCase.case_challenge_title,
    case_challenge_body: demoCase.case_challenge_body,
    case_solution_title: demoCase.case_solution_title,
    case_solution_body: demoCase.case_solution_body,
    case_result_title: demoCase.case_result_title,
    case_result_body: demoCase.case_result_body,
    case_services: demoCase.case_services,
    case_facts: demoCase.case_facts,
    case_timeline: demoCase.case_timeline,
    case_gallery: demoCase.case_gallery,
    case_credits: demoCase.case_credits,
    case_quote: demoCase.case_quote,
    case_quote_author: demoCase.case_quote_author,
    case_quote_role: demoCase.case_quote_role,
    case_cta_title: demoCase.case_cta_title,
    case_cta_body: demoCase.case_cta_body,
    seo_title: demoCase.seo_title,
    seo_description: demoCase.seo_description,
    og_image_url: demoCase.og_image_url,
    case_published_at: null,
  };
}
