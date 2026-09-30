import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type ThemeConfig = {
  primary:string; secondary:string; background:string; surface:string; font:string; radius:string;
};
export type Settings = {
  id:number; google_analytics_id:string|null; theme_config:ThemeConfig;
};
export type Ad = {
  id:string; placement:"header"|"body_top"|"body_bottom"|"interstitial"; ad_code:string; is_active:boolean; target_platform:"web"|"android"|"both";
};
export type SeoPage = {
  id:string; slug:string; title:string; content:string; meta_title:string|null; meta_description:string|null; meta_keywords:string|null; is_published:boolean;
};
export const defaultTheme:ThemeConfig={primary:"#16a34a",secondary:"#2563eb",background:"#f8fafc",surface:"#ffffff",font:"Tajawal",radius:"16px"};
