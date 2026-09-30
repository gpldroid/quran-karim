import { supabase } from "./client";
import { DEFAULT_THEME, PublicAd, PublicAppSettings, SeoPage, ThemeConfig } from "./admin-config";

export async function getPublicSettings(): Promise<PublicAppSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_settings")
    .select("id,google_analytics_id,theme_config")
    .eq("id", true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    theme_config: { ...DEFAULT_THEME, ...(data.theme_config as Partial<ThemeConfig> | null) },
  };
}

export async function getActiveAds(platform: "web" | "android"): Promise<PublicAd[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("ads_management")
    .select("id,placement,ad_code,is_active,target_platform")
    .eq("is_active", true)
    .in("target_platform", [platform, "both"])
    .order("placement");

  return (data ?? []) as PublicAd[];
}

export async function getPublishedPage(slug: string): Promise<SeoPage | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pages_and_seo")
    .select("id,slug,title,content,meta_title,meta_description,meta_keywords,is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return error || !data ? null : (data as SeoPage);
}

export function applyTheme(theme: Partial<ThemeConfig> | null | undefined): void {
  if (typeof document === "undefined") return;
  const value = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const root = document.documentElement;
  root.style.setProperty("--wow-primary", value.primary);
  root.style.setProperty("--wow-secondary", value.secondary);
  root.style.setProperty("--wow-background", value.background);
  root.style.setProperty("--wow-surface", value.surface);
  root.style.setProperty("--wow-radius", value.radius);
  if (value.font) root.style.setProperty("--wow-font", value.font);
}

export function injectGoogleAnalytics(measurementId: string | null | undefined): void {
  if (typeof document === "undefined" || !measurementId) return;
  if (document.getElementById("wow-google-analytics")) return;

  const script = document.createElement("script");
  script.id = "wow-google-analytics";
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.id = "wow-google-analytics-config";
  inline.text = [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js',new Date());",
    "gtag('config'," + JSON.stringify(measurementId) + ");"
  ].join("");
  document.head.appendChild(inline);
}

export async function initializePublicConfig(): Promise<PublicAppSettings | null> {
  const settings = await getPublicSettings();
  applyTheme(settings?.theme_config);
  injectGoogleAnalytics(settings?.google_analytics_id);
  return settings;
}
