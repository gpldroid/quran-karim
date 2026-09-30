"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function injectGoogleAnalytics(gaId) {
  if (!gaId || document.getElementById("ga-script")) return;
  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
  document.head.appendChild(script);

  const init = document.createElement("script");
  init.id = "ga-init-script";
  init.textContent =
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
    "gtag('js',new Date());gtag('config'," + JSON.stringify(gaId) + ");";
  document.head.appendChild(init);
}

export function AdPlacement({ placement, ads }) {
  const activeAd = ads.find(
    (ad) =>
      ad.placement === placement &&
      ad.is_active &&
      (ad.target_platform === "web" || ad.target_platform === "both")
  );

  if (!activeAd) return null;

  return (
    <div className="my-4 overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50 p-2 text-center" data-ad-placement={placement}>
      <div dangerouslySetInnerHTML={{ __html: activeAd.ad_code }} />
    </div>
  );
}

export default function SiteConfigEngine({ currentSlug = "/", children }) {
  const [settings, setSettings] = useState(null);
  const [ads, setAds] = useState([]);
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) return;

      const [settingsResult, adsResult, seoResult] = await Promise.all([
        supabase.from("app_settings").select("google_analytics_id,theme_config").eq("id", true).maybeSingle(),
        supabase.from("ads_management").select("placement,ad_code,is_active,target_platform").eq("is_active", true).in("target_platform", ["web", "both"]),
        supabase.from("pages_and_seo").select("title,meta_title,meta_description,meta_keywords").eq("slug", currentSlug).eq("is_published", true).maybeSingle()
      ]);

      if (cancelled) return;

      if (settingsResult.data) {
        setSettings(settingsResult.data);
        const theme = settingsResult.data.theme_config || {};
        const root = document.documentElement;
        root.style.setProperty("--primary-color", theme.primaryColor || theme.primary || "#1b5e20");
        root.style.setProperty("--secondary-color", theme.secondaryColor || theme.secondary || "#2e7d32");
        if (theme.background) root.style.setProperty("--bg-color", theme.background);
        injectGoogleAnalytics(settingsResult.data.google_analytics_id);
      }

      setAds(adsResult.data || []);
      setSeoData(seoResult.data || null);

      if (seoResult.data) {
        document.title = seoResult.data.meta_title || seoResult.data.title || document.title;
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "description";
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", seoResult.data.meta_description || "");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  return (
    <div className="site-wrapper" data-config-loaded={settings ? "true" : "false"}>
      <AdPlacement placement="header" ads={ads} />
      <AdPlacement placement="body_top" ads={ads} />
      <main className="main-content">{children}</main>
      <AdPlacement placement="body_bottom" ads={ads} />
      {seoData ? <span hidden data-seo-slug={currentSlug} /> : null}
    </div>
  );
}
