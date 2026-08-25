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

export function casePresetPayload() {
  // A safe editorial starter preset for the public Case CMS. It deliberately
  // contains no client names, fake metrics, quotes or media so it can never be
  // mistaken for a real project if someone previews it before filling it in.
  return {
    slug: null,
    case_published: false,
    case_featured: false,
    case_sort_order: 100,
    case_subtitle: "",
    case_excerpt: "",
    case_hero_image_url: null,
    case_hero_video_url: null,
    case_intro_title: "Om projektet",
    case_intro_body: "",
    case_challenge_title: "Utmaningen",
    case_challenge_body: "",
    case_solution_title: "Så löste vi det",
    case_solution_body: "",
    case_result_title: "Resultatet",
    case_result_body: "",
    case_services: [],
    case_facts: [],
    case_timeline: [],
    case_gallery: [],
    case_credits: [],
    case_quote: null,
    case_quote_author: null,
    case_quote_role: null,
    case_cta_title: "Har ni något som ska byggas?",
    case_cta_body: "Berätta vad ni planerar så hjälper vi till med produktion, bemanning, mässa eller hela leveransen.",
    seo_title: "",
    seo_description: "",
    og_image_url: null,
  };
}
