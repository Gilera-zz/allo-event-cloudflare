export type HeroMode = "fixed" | "cases";

export type HomepageHeroSettings = {
  id: string;
  hero_mode: HeroMode;
  hero_image_url: string | null;
  hero_mobile_image_url: string | null;
  hero_image_position: string;
  hero_overlay: number;
  hero_slide_seconds: number;
  hero_slow_zoom: boolean;
  hero_show_case_meta: boolean;
  updated_at?: string | null;
};

export type HomepageHeroCase = {
  id: string;
  title: string | null;
  slug: string | null;
  location: string | null;
  category: string | null;
  case_year: number | null;
  image_url: string | null;
  case_hero_image_url: string | null;
  case_published: boolean | null;
  case_show_in_hero: boolean | null;
  case_hero_priority: number | null;
};

export const DEFAULT_HOMEPAGE_HERO: HomepageHeroSettings = {
  id: "homepage",
  hero_mode: "fixed",
  hero_image_url: null,
  hero_mobile_image_url: null,
  hero_image_position: "center center",
  hero_overlay: 66,
  hero_slide_seconds: 7,
  hero_slow_zoom: true,
  hero_show_case_meta: true,
};

export const HOMEPAGE_HERO_SETTINGS_SELECT = [
  "id",
  "hero_mode",
  "hero_image_url",
  "hero_mobile_image_url",
  "hero_image_position",
  "hero_overlay",
  "hero_slide_seconds",
  "hero_slow_zoom",
  "hero_show_case_meta",
  "updated_at",
].join(",");

export const HOMEPAGE_HERO_CASE_SELECT = [
  "id",
  "title",
  "slug",
  "location",
  "category",
  "case_year",
  "image_url",
  "case_hero_image_url",
  "case_published",
  "case_show_in_hero",
  "case_hero_priority",
].join(",");
