export type ThemeConfig = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  font: string;
  radius: string;
};

export type PublicAppSettings = {
  id: boolean;
  google_analytics_id: string | null;
  theme_config: ThemeConfig;
};

export type PublicAd = {
  id: string;
  placement: "header" | "body_top" | "body_bottom" | "interstitial";
  ad_code: string;
  is_active: boolean;
  target_platform: "web" | "android" | "both";
};

export type SeoPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_published: boolean;
};

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#16a34a",
  secondary: "#2563eb",
  background: "#f8fafc",
  surface: "#ffffff",
  font: "Tajawal",
  radius: "16px",
};
