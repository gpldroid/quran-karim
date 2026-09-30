(function () {
  "use strict";

  const DEFAULT_THEME = {
    primaryColor: "#1b5e20",
    secondaryColor: "#2e7d32"
  };

  function getConfig() {
    return window.WOW_SUPABASE_CONFIG || {};
  }

  async function getClient() {
    const config = getConfig();
    if (!config.url || !config.anonKey || !window.supabase?.createClient) return null;
    return window.supabase.createClient(config.url, config.anonKey);
  }

  function injectGoogleAnalytics(gaId) {
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

  function applyTheme(theme) {
    const root = document.documentElement;
    const value = theme || {};
    root.style.setProperty("--primary-color", value.primaryColor || value.primary || DEFAULT_THEME.primaryColor);
    root.style.setProperty("--secondary-color", value.secondaryColor || value.secondary || DEFAULT_THEME.secondaryColor);
    root.style.setProperty("--wow-primary", value.primaryColor || value.primary || DEFAULT_THEME.primaryColor);
    root.style.setProperty("--wow-secondary", value.secondaryColor || value.secondary || DEFAULT_THEME.secondaryColor);
    if (value.background) {
      root.style.setProperty("--bg-color", value.background);
      root.style.setProperty("--wow-bg", value.background);
    }
    if (value.surface) {
      root.style.setProperty("--dark-card", value.surface);
      root.style.setProperty("--wow-surface", value.surface);
    }
    if (value.radius) root.style.setProperty("--wow-radius", value.radius);
    if (value.font) document.body.style.fontFamily = value.font;
  }

  function renderAd(placement, ads) {
    const host = document.querySelector('[data-ad-placement="' + placement + '"]');
    if (!host) return;

    const active = ads.find(function (ad) {
      return ad.placement === placement &&
        ad.is_active &&
        (ad.target_platform === "web" || ad.target_platform === "both");
    });

    if (!active || !active.ad_code) {
      host.hidden = true;
      return;
    }

    host.hidden = false;
    host.innerHTML = active.ad_code;
  }

  function updateSeo(data) {
    if (!data) return;
    document.title = data.meta_title || data.title || document.title;

    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = data.meta_description || "";

    if (data.meta_keywords) {
      let keywords = document.querySelector('meta[name="keywords"]');
      if (!keywords) {
        keywords = document.createElement("meta");
        keywords.name = "keywords";
        document.head.appendChild(keywords);
      }
      keywords.content = data.meta_keywords;
    }
  }

  async function load(currentSlug) {
    const client = await getClient();
    if (!client) return;

    const settingsResult = await client
      .from("app_settings")
      .select("site_name,site_description,google_analytics_id,theme_config,primary_color,app_dark_mode")
      .eq("id", 1)
      .maybeSingle();

    if (!settingsResult.error && settingsResult.data) {
      applyTheme(Object.assign({}, settingsResult.data.theme_config || {}, {
        primaryColor: settingsResult.data.primary_color || undefined
      }));
      function enableAnalyticsWhenAllowed() {
      if (window.WOWPrivacyConsent?.has("analytics")) {
        injectGoogleAnalytics(settingsResult.data.google_analytics_id);
      }
    }
    enableAnalyticsWhenAllowed();
    window.addEventListener("wow:consent-changed", enableAnalyticsWhenAllowed);
      if (settingsResult.data.site_name) document.title = settingsResult.data.site_name;
      if (settingsResult.data.site_description) {
        var metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) metaDescription.content = settingsResult.data.site_description;
      }
    }

    const adsResult = await client
      .from("ads_management")
      .select("placement,ad_code,is_active,target_platform")
      .eq("is_active", true)
      .in("target_platform", ["web", "both"]);

    if (!adsResult.error) {
      ["header", "body_top", "body_bottom"].forEach(function (placement) {
        renderAd(placement, adsResult.data || []);
      });
    }

    const slug = currentSlug || "/";
    const seoResult = await client
      .from("pages_and_seo")
      .select("title,meta_title,meta_description,meta_keywords")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!seoResult.error) updateSeo(seoResult.data);
  }

  function ensureManagementLinks() {
    // The public site header must not expose an administration entry point.
    // Administration remains available only through the dedicated dashboard URL.
  }

  window.WOWSiteConfigEngine = { load, injectGoogleAnalytics, applyTheme, ensureManagementLinks };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureManagementLinks, { once: true });
  } else {
    ensureManagementLinks();
  }
})();
