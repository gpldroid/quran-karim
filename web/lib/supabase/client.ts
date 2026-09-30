import { createBrowserClient } from "@supabase/ssr";

declare global {
  interface Window {
    WOW_SUPABASE_CONFIG?: { url?: string; anonKey?: string };
  }
}

const runtime = typeof window !== "undefined" ? window.WOW_SUPABASE_CONFIG : undefined;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || runtime?.url || "https://npytwojnxsmxhcssajtg.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || runtime?.anonKey || "sb_publishable_s9DgcPj_TJh-ZbVhPqgnvw_opH6Z5ww";

export const supabase = url && key ? createBrowserClient(url, key) : null;
