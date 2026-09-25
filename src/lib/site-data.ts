// Samlad datahämtning för den nya publika startsidan.
// Allt som startsidan behöver från databasen går genom loadHomeData(), som körs i
// route-loadern (på servern vid SSR). När case flyttar till en egen tabell räcker det
// att byta här.

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOMEPAGE_HERO,
  HOMEPAGE_HERO_CASE_SELECT,
  HOMEPAGE_HERO_SETTINGS_SELECT,
  type HomepageHeroCase,
  type HomepageHeroSettings,
} from "@/lib/homepage-hero";

export type HeroSlide = {
  id: string;
  image: string;
  title: string | null;
  slug: string | null;
  location: string | null;
  year: number | null;
  category: string | null;
};

export type HomeHero = {
  /** "cases" = bildspel från case med case_show_in_hero, "fixed" = manuell bild. */
  mode: "cases" | "fixed";
  /** Bilder för eventhalvan på dator. Första bilden laddas direkt, resten vid hovring. */
  slides: HeroSlide[];
  /** Bild för eventhalvan i mobilen (manuell mobilbild eller första case-bilden). */
  mobileImage: string | null;
  slideSeconds: number;
  showCaseMeta: boolean;
};

export type FeaturedCase = {
  id: string;
  slug: string | null;
  title: string | null;
  location: string | null;
  venue: string | null;
  year: number | null;
  category: string | null;
  image: string | null;
  excerpt: string | null;
};

/** Partner i "Vi samarbetar även med". Ingen datakälla ännu (kommer i admin-steget). */
export type ExtraPartner = {
  id: string;
  name: string;
  url: string | null;
  logo: string | null;
};

export type HomeData = {
  hero: HomeHero;
  cases: FeaturedCase[];
  extraPartners: ExtraPartner[];
};

export const FEATURED_CASE_SELECT = [
  "id",
  "slug",
  "title",
  "location",
  "case_venue",
  "case_year",
  "category",
  "image_url",
  "case_hero_image_url",
  "case_excerpt",
  "case_subtitle",
].join(",");

type FeaturedCaseRow = {
  id: string;
  slug: string | null;
  title: string | null;
  location: string | null;
  case_venue: string | null;
  case_year: number | null;
  category: string | null;
  image_url: string | null;
  case_hero_image_url: string | null;
  case_excerpt: string | null;
  case_subtitle: string | null;
};

export const HERO_SLIDE_LIMIT = 5;
export const FEATURED_CASE_LIMIT = 3;
const QUERY_TIMEOUT_MS = 2500;

export const EMPTY_HOME_DATA: HomeData = {
  hero: {
    mode: "fixed",
    slides: [],
    mobileImage: null,
    slideSeconds: DEFAULT_HOMEPAGE_HERO.hero_slide_seconds,
    showCaseMeta: DEFAULT_HOMEPAGE_HERO.hero_show_case_meta,
  },
  cases: [],
  extraPartners: [],
};

/** Ett långsamt eller trasigt databasanrop får inte stoppa server-renderingen. */
function withTimeout<T>(promise: PromiseLike<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), QUERY_TIMEOUT_MS);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

async function fetchHeroSettings(): Promise<HomepageHeroSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(HOMEPAGE_HERO_SETTINGS_SELECT)
    .eq("id", "homepage")
    .maybeSingle();
  if (error || !data) return DEFAULT_HOMEPAGE_HERO;
  return { ...DEFAULT_HOMEPAGE_HERO, ...(data as unknown as HomepageHeroSettings) };
}

async function fetchHeroCases(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(HOMEPAGE_HERO_CASE_SELECT)
    .eq("case_published", true)
    .eq("public_visible", true)
    .eq("case_show_in_hero", true)
    .order("case_hero_priority", { ascending: true })
    .order("case_published_at", { ascending: false, nullsFirst: false })
    .limit(HERO_SLIDE_LIMIT);
  if (error || !data) return [];
  return (data as unknown as HomepageHeroCase[])
    .map((project) => ({
      id: project.id,
      image: project.case_hero_image_url || project.image_url || "",
      title: project.title,
      slug: project.slug,
      location: project.location,
      year: project.case_year,
      category: project.category,
    }))
    .filter((slide) => !!slide.image);
}

async function fetchFeaturedCases(): Promise<FeaturedCase[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(FEATURED_CASE_SELECT)
    .eq("case_published", true)
    .eq("public_visible", true)
    .order("case_featured", { ascending: false })
    .order("case_sort_order", { ascending: true, nullsFirst: false })
    .limit(FEATURED_CASE_LIMIT);
  if (error || !data) return [];
  return (data as unknown as FeaturedCaseRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    venue: row.case_venue,
    year: row.case_year,
    category: row.category,
    image: row.case_hero_image_url || row.image_url || null,
    excerpt: row.case_excerpt || row.case_subtitle || null,
  }));
}

/** Datakällan för "Vi samarbetar även med" finns inte ännu. Sektionen döljs när listan är tom. */
async function fetchExtraPartners(): Promise<ExtraPartner[]> {
  return [];
}

export async function loadHomeData(): Promise<HomeData> {
  const [settings, heroCases, cases, extraPartners] = await Promise.all([
    withTimeout(fetchHeroSettings(), DEFAULT_HOMEPAGE_HERO),
    withTimeout(fetchHeroCases(), [] as HeroSlide[]),
    withTimeout(fetchFeaturedCases(), [] as FeaturedCase[]),
    withTimeout(fetchExtraPartners(), [] as ExtraPartner[]),
  ]);

  const useCases = settings.hero_mode === "cases" && heroCases.length > 0;
  const manualDesktop = settings.hero_image_url || null;
  const manualMobile = settings.hero_mobile_image_url || manualDesktop;

  const hero: HomeHero = useCases
    ? {
        mode: "cases",
        slides: heroCases,
        mobileImage: heroCases[0]?.image ?? null,
        slideSeconds: clampSeconds(settings.hero_slide_seconds),
        showCaseMeta: !!settings.hero_show_case_meta,
      }
    : {
        mode: "fixed",
        slides: manualDesktop
          ? [{ id: "manual", image: manualDesktop, title: null, slug: null, location: null, year: null, category: null }]
          : [],
        mobileImage: manualMobile,
        slideSeconds: clampSeconds(settings.hero_slide_seconds),
        showCaseMeta: false,
      };

  return { hero, cases, extraPartners };
}

function clampSeconds(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_HOMEPAGE_HERO.hero_slide_seconds;
  return Math.max(3, Math.min(12, n));
}
