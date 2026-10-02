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


(function () {
  "use strict";

  const KEY = "wow_privacy_consent_v1";
  const DEFAULTS = { necessary: true, analytics: false, ads: false };

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!value || value.version !== 1) return null;
      return {
        necessary: true,
        analytics: value.analytics === true,
        ads: value.ads === true,
        updatedAt: value.updatedAt || null
      };
    } catch (_) {
      return null;
    }
  }

  function save(value) {
    const consent = {
      version: 1,
      necessary: true,
      analytics: value.analytics === true,
      ads: value.ads === true,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent("wow:consent-changed", { detail: consent }));
    return consent;
  }

  function has(category) {
    const value = read();
    if (!value) return category === "necessary";
    return value[category] === true;
  }

  function ensureStyles() {}

  function open(mode) {
    ensureStyles();
    close();
    const current = read() || DEFAULTS;
    const backdrop = document.createElement("div");
    backdrop.className = "wow-consent-backdrop";
    backdrop.id = "wow-consent-backdrop";
    const panel = document.createElement("section");
    panel.className = "wow-consent-panel";
    panel.id = "wow-consent-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "wowConsentTitle");
    panel.innerHTML = `
      <h2 id="wowConsentTitle">الخصوصية وملفات تعريف الارتباط</h2>
      <p>نستخدم التقنيات الضرورية لتشغيل الموقع وحفظ تفضيلاتك. التحليلات والإعلانات الاختيارية لا تعمل قبل موافقتك، ويمكنك تغيير اختيارك في أي وقت.</p>
      <div class="wow-consent-grid">
        <label class="wow-consent-option"><span><strong>ضرورية</strong><small>مطلوبة لتشغيل الموقع وحفظ اختيار الخصوصية.</small></span><input type="checkbox" checked disabled></label>
        <label class="wow-consent-option"><span><strong>تحليلات</strong><small>تساعدنا على فهم استخدام الموقع وتحسين الأداء.</small></span><input id="wowConsentAnalytics" type="checkbox"></label>
        <label class="wow-consent-option"><span><strong>إعلانات</strong><small>تسمح بتشغيل الإعلانات والخدمات المرتبطة بها عند الحاجة.</small></span><input id="wowConsentAds" type="checkbox"></label>
      </div>
      <div class="wow-consent-actions">
        <button class="wow-consent-primary" id="wowConsentAll" type="button">السماح بالكل</button>
        <button class="wow-consent-secondary" id="wowConsentEssential" type="button">الضرورية فقط</button>
        <button class="wow-consent-secondary" id="wowConsentSave" type="button">حفظ التخصيص</button>
      </div>`;
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    panel.querySelector("#wowConsentAnalytics").checked = current.analytics === true;
    panel.querySelector("#wowConsentAds").checked = current.ads === true;
    panel.querySelector("#wowConsentAll").onclick = function(){ save({analytics:true,ads:true}); close(); };
    panel.querySelector("#wowConsentEssential").onclick = function(){ save({analytics:false,ads:false}); close(); };
    panel.querySelector("#wowConsentSave").onclick = function(){
      save({
        analytics: panel.querySelector("#wowConsentAnalytics").checked,
        ads: panel.querySelector("#wowConsentAds").checked
      });
      close();
    };
    backdrop.onclick = function(){ if (mode === "manage") close(); };
  }

  function close() {
    document.getElementById("wow-consent-backdrop")?.remove();
    document.getElementById("wow-consent-panel")?.remove();
  }

  function ensureManagerButton() {
    if (document.getElementById("wowPrivacyManage")) return;
    const button=document.createElement("button");
    button.id="wowPrivacyManage";button.className="wow-consent-manage";button.type="button";
    button.textContent="إدارة الخصوصية";button.setAttribute("aria-label","إدارة الخصوصية وملفات تعريف الارتباط");
    button.onclick=function(){open("manage")};document.body.appendChild(button);
  }

  function init() {
    ensureStyles();
    ensureManagerButton();
    if (!read()) open("initial");
  }

  window.WOWPrivacyConsent = {
    key: KEY,
    read: read,
    save: save,
    has: has,
    open: function(){ open("manage"); },
    init: init
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

document.addEventListener('DOMContentLoaded',function(){
  const toggle=document.getElementById('navToggle'),links=document.getElementById('navLinks');
  const logo=document.querySelector('.logo'),logoImg=logo&&logo.querySelector('img');
  if(logoImg&&logoImg.parentElement&&logoImg.parentElement.tagName!=='A'){
    const a=document.createElement('a');a.href='./index.html';a.className='logo-home-link';a.setAttribute('aria-label','العودة إلى الصفحة الرئيسية');a.title='الصفحة الرئيسية';a.style.cssText='display:inline-flex;align-items:center;text-decoration:none;color:inherit;flex:none;';logoImg.parentNode.insertBefore(a,logoImg);a.appendChild(logoImg);
  }
  if(toggle&&links){toggle.addEventListener('click',function(){const e=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!e));links.classList.toggle('active',!e)});links.addEventListener('click',function(e){if(e.target.closest('a')){links.classList.remove('active');toggle.setAttribute('aria-expanded','false')}});document.addEventListener('click',function(e){if(!toggle.contains(e.target)&&!links.contains(e.target)){links.classList.remove('active');toggle.setAttribute('aria-expanded','false')}})}
  function makeControl(id,cls,label,icon){let b=document.getElementById(id);if(!b){b=document.createElement('button');b.id=id;b.type='button';b.className='wow-floating-control '+cls;b.setAttribute('aria-label',label);b.title=label;b.innerHTML='<i class="'+icon+'" aria-hidden="true"></i>';document.body.appendChild(b)}return b}
  const existingTheme=document.querySelector('.night-mode-toggle'),existingTop=document.getElementById('backToTop');
  const theme=existingTheme||makeControl('wowThemeControl','wow-theme-control','تبديل الوضع الليلي','fas fa-moon');
  const top=existingTop||makeControl('wowScrollTop','wow-scroll-top','العودة إلى أعلى الصفحة','fas fa-arrow-up');
  const bottom=makeControl('wowScrollBottom','wow-scroll-bottom','الانتقال إلى أسفل الصفحة','fas fa-arrow-down');
  function setTheme(night){document.body.classList.toggle('night-mode',night);localStorage.setItem('nightMode',String(night));localStorage.setItem('wow_night_mode',night?'1':'0');if(!existingTheme){theme.innerHTML='<i class="fas '+(night?'fa-sun':'fa-moon')+'" aria-hidden="true"></i>';theme.setAttribute('aria-label',night?'تبديل إلى الوضع النهاري':'تبديل إلى الوضع الليلي');theme.title=night?'الوضع النهاري':'الوضع الليلي'}}
  if(!existingTheme)theme.addEventListener('click',()=>setTheme(!document.body.classList.contains('night-mode')));
  if(!existingTop)top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  bottom.addEventListener('click',()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}));
  const saved=localStorage.getItem('nightMode')==='true'||localStorage.getItem('wow_night_mode')==='1';if(saved&&!existingTheme&&!document.body.classList.contains('night-mode'))setTheme(true)
  function scroll(){const y=window.scrollY||0,max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);if(!existingTop)top.classList.toggle('show',y>220);bottom.style.opacity=max-y>220?'1':'0';bottom.style.visibility=max-y>220?'visible':'hidden'}
  scroll();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);
});

if(document.getElementById('quran-playlist')){
// بيانات السور مع معلومات إضافية
        const surahs = [
            { number: 1, name: "الفاتحة", verses: 7, type: "مكية", revelationOrder: 5 },
            { number: 2, name: "البقرة", verses: 286, type: "مدنية", revelationOrder: 87 },
            { number: 3, name: "آل عمران", verses: 200, type: "مدنية", revelationOrder: 89 },
            { number: 4, name: "النساء", verses: 176, type: "مدنية", revelationOrder: 92 },
            { number: 5, name: "المائدة", verses: 120, type: "مدنية", revelationOrder: 112 },
            { number: 6, name: "الأنعام", verses: 165, type: "مكية", revelationOrder: 55 },
            { number: 7, name: "الأعراف", verses: 206, type: "مكية", revelationOrder: 39 },
            { number: 8, name: "الأنفال", verses: 75, type: "مدنية", revelationOrder: 88 },
            { number: 9, name: "التوبة", verses: 129, type: "مدنية", revelationOrder: 113 },
            { number: 10, name: "يونس", verses: 109, type: "مكية", revelationOrder: 51 },
            { number: 11, name: "هود", verses: 123, type: "مكية", revelationOrder: 52 },
            { number: 12, name: "يوسف", verses: 111, type: "مكية", revelationOrder: 53 },
            { number: 13, name: "الرعد", verses: 43, type: "مدنية", revelationOrder: 96 },
            { number: 14, name: "إبراهيم", verses: 52, type: "مكية", revelationOrder: 72 },
            { number: 15, name: "الحجر", verses: 99, type: "مكية", revelationOrder: 54 },
            { number: 16, name: "النحل", verses: 128, type: "مكية", revelationOrder: 70 },
            { number: 17, name: "الإسراء", verses: 111, type: "مكية", revelationOrder: 50 },
            { number: 18, name: "الكهف", verses: 110, type: "مكية", revelationOrder: 69 },
            { number: 19, name: "مريم", verses: 98, type: "مكية", revelationOrder: 44 },
            { number: 20, name: "طه", verses: 135, type: "مكية", revelationOrder: 45 },
            { number: 21, name: "الأنبياء", verses: 112, type: "مكية", revelationOrder: 73 },
            { number: 22, name: "الحج", verses: 78, type: "مدنية", revelationOrder: 103 },
            { number: 23, name: "المؤمنون", verses: 118, type: "مكية", revelationOrder: 74 },
            { number: 24, name: "النور", verses: 64, type: "مدنية", revelationOrder: 102 },
            { number: 25, name: "الفرقان", verses: 77, type: "مكية", revelationOrder: 42 },
            { number: 26, name: "الشعراء", verses: 227, type: "مكية", revelationOrder: 47 },
            { number: 27, name: "النمل", verses: 93, type: "مكية", revelationOrder: 48 },
            { number: 28, name: "القصص", verses: 88, type: "مكية", revelationOrder: 49 },
            { number: 29, name: "العنكبوت", verses: 69, type: "مكية", revelationOrder: 85 },
            { number: 30, name: "الروم", verses: 60, type: "مكية", revelationOrder: 84 },
            { number: 31, name: "لقمان", verses: 34, type: "مكية", revelationOrder: 57 },
            { number: 32, name: "السجدة", verses: 30, type: "مكية", revelationOrder: 75 },
            { number: 33, name: "الأحزاب", verses: 73, type: "مدنية", revelationOrder: 90 },
            { number: 34, name: "سبأ", verses: 54, type: "مكية", revelationOrder: 58 },
            { number: 35, name: "فاطر", verses: 45, type: "مكية", revelationOrder: 43 },
            { number: 36, name: "يس", verses: 83, type: "مكية", revelationOrder: 41 },
            { number: 37, name: "الصافات", verses: 182, type: "مكية", revelationOrder: 56 },
            { number: 38, name: "ص", verses: 88, type: "مكية", revelationOrder: 38 },
            { number: 39, name: "الزمر", verses: 75, type: "مكية", revelationOrder: 59 },
            { number: 40, name: "غافر", verses: 85, type: "مكية", revelationOrder: 60 },
            { number: 41, name: "فصلت", verses: 54, type: "مكية", revelationOrder: 61 },
            { number: 42, name: "الشورى", verses: 53, type: "مكية", revelationOrder: 62 },
            { number: 43, name: "الزخرف", verses: 89, type: "مكية", revelationOrder: 63 },
            { number: 44, name: "الدخان", verses: 59, type: "مكية", revelationOrder: 64 },
            { number: 45, name: "الجاثية", verses: 37, type: "مكية", revelationOrder: 65 },
            { number: 46, name: "الأحقاف", verses: 35, type: "مكية", revelationOrder: 66 },
            { number: 47, name: "محمد", verses: 38, type: "مدنية", revelationOrder: 95 },
            { number: 48, name: "الفتح", verses: 29, type: "مدنية", revelationOrder: 111 },
            { number: 49, name: "الحجرات", verses: 18, type: "مدنية", revelationOrder: 106 },
            { number: 50, name: "ق", verses: 45, type: "مكية", revelationOrder: 34 },
            { number: 51, name: "الذاريات", verses: 60, type: "مكية", revelationOrder: 67 },
            { number: 52, name: "الطور", verses: 49, type: "مكية", revelationOrder: 76 },
            { number: 53, name: "النجم", verses: 62, type: "مكية", revelationOrder: 23 },
            { number: 54, name: "القمر", verses: 55, type: "مكية", revelationOrder: 37 },
            { number: 55, name: "الرحمن", verses: 78, type: "مدنية", revelationOrder: 97 },
            { number: 56, name: "الواقعة", verses: 96, type: "مكية", revelationOrder: 46 },
            { number: 57, name: "الحديد", verses: 29, type: "مدنية", revelationOrder: 94 },
            { number: 58, name: "المجادلة", verses: 22, type: "مدنية", revelationOrder: 105 },
            { number: 59, name: "الحشر", verses: 24, type: "مدنية", revelationOrder: 101 },
            { number: 60, name: "الممتحنة", verses: 13, type: "مدنية", revelationOrder: 91 },
            { number: 61, name: "الصف", verses: 14, type: "مدنية", revelationOrder: 109 },
            { number: 62, name: "الجمعة", verses: 11, type: "مدنية", revelationOrder: 110 },
            { number: 63, name: "المنافقون", verses: 11, type: "مدنية", revelationOrder: 104 },
            { number: 64, name: "التغابن", verses: 18, type: "مدنية", revelationOrder: 108 },
            { number: 65, name: "الطلاق", verses: 12, type: "مدنية", revelationOrder: 99 },
            { number: 66, name: "التحريم", verses: 12, type: "مدنية", revelationOrder: 107 },
            { number: 67, name: "الملك", verses: 30, type: "مكية", revelationOrder: 77 },
            { number: 68, name: "القلم", verses: 52, type: "مكية", revelationOrder: 2 },
            { number: 69, name: "الحاقة", verses: 52, type: "مكية", revelationOrder: 78 },
            { number: 70, name: "المعارج", verses: 44, type: "مكية", revelationOrder: 79 },
            { number: 71, name: "نوح", verses: 28, type: "مكية", revelationOrder: 71 },
            { number: 72, name: "الجن", verses: 28, type: "مكية", revelationOrder: 40 },
            { number: 73, name: "المزمل", verses: 20, type: "مكية", revelationOrder: 3 },
            { number: 74, name: "المدثر", verses: 56, type: "مكية", revelationOrder: 4 },
            { number: 75, name: "القيامة", verses: 40, type: "مكية", revelationOrder: 31 },
            { number: 76, name: "الإنسان", verses: 31, type: "مدنية", revelationOrder: 98 },
            { number: 77, name: "المرسلات", verses: 50, type: "مكية", revelationOrder: 33 },
            { number: 78, name: "النبأ", verses: 40, type: "مكية", revelationOrder: 80 },
            { number: 79, name: "النازعات", verses: 46, type: "مكية", revelationOrder: 81 },
            { number: 80, name: "عبس", verses: 42, type: "مكية", revelationOrder: 24 },
            { number: 81, name: "التكوير", verses: 29, type: "مكية", revelationOrder: 7 },
            { number: 82, name: "الانفطار", verses: 19, type: "مكية", revelationOrder: 82 },
            { number: 83, name: "المطففين", verses: 36, type: "مكية", revelationOrder: 86 },
            { number: 84, name: "الانشقاق", verses: 25, type: "مكية", revelationOrder: 83 },
            { number: 85, name: "البروج", verses: 22, type: "مكية", revelationOrder: 27 },
            { number: 86, name: "الطارق", verses: 17, type: "مكية", revelationOrder: 36 },
            { number: 87, name: "الأعلى", verses: 19, type: "مكية", revelationOrder: 8 },
            { number: 88, name: "الغاشية", verses: 26, type: "مكية", revelationOrder: 68 },
            { number: 89, name: "الفجر", verses: 30, type: "مكية", revelationOrder: 10 },
            { number: 90, name: "البلد", verses: 20, type: "مكية", revelationOrder: 35 },
            { number: 91, name: "الشمس", verses: 15, type: "مكية", revelationOrder: 26 },
            { number: 92, name: "الليل", verses: 21, type: "مكية", revelationOrder: 9 },
            { number: 93, name: "الضحى", verses: 11, type: "مكية", revelationOrder: 11 },
            { number: 94, name: "الشرح", verses: 8, type: "مكية", revelationOrder: 12 },
            { number: 95, name: "التين", verses: 8, type: "مكية", revelationOrder: 28 },
            { number: 96, name: "العلق", verses: 19, type: "مكية", revelationOrder: 1 },
            { number: 97, name: "القدر", verses: 5, type: "مكية", revelationOrder: 25 },
            { number: 98, name: "البينة", verses: 8, type: "مدنية", revelationOrder: 100 },
            { number: 99, name: "الزلزلة", verses: 8, type: "مدنية", revelationOrder: 93 },
            { number: 100, name: "العاديات", verses: 11, type: "مكية", revelationOrder: 14 },
            { number: 101, name: "القارعة", verses: 11, type: "مكية", revelationOrder: 30 },
            { number: 102, name: "التكاثر", verses: 8, type: "مكية", revelationOrder: 16 },
            { number: 103, name: "العصر", verses: 3, type: "مكية", revelationOrder: 13 },
            { number: 104, name: "الهمزة", verses: 9, type: "مكية", revelationOrder: 32 },
            { number: 105, name: "الفيل", verses: 5, type: "مكية", revelationOrder: 19 },
            { number: 106, name: "قريش", verses: 4, type: "مكية", revelationOrder: 29 },
            { number: 107, name: "الماعون", verses: 7, type: "مكية", revelationOrder: 17 },
            { number: 108, name: "الكوثر", verses: 3, type: "مكية", revelationOrder: 15 },
            { number: 109, name: "الكافرون", verses: 6, type: "مكية", revelationOrder: 18 },
            { number: 110, name: "النصر", verses: 3, type: "مدنية", revelationOrder: 114 },
            { number: 111, name: "المسد", verses: 5, type: "مكية", revelationOrder: 6 },
            { number: 112, name: "الإخلاص", verses: 4, type: "مكية", revelationOrder: 22 },
            { number: 113, name: "الفلق", verses: 5, type: "مكية", revelationOrder: 20 },
            { number: 114, name: "الناس", verses: 6, type: "مكية", revelationOrder: 21 }
        ];

        // بيانات القراء
        const reciters = {
            "ajm": "https://server8.mp3quran.net/ajm/",
            "jleel": "https://server10.mp3quran.net/jleel/",
            "salman[11]": "https://server10.mp3quran.net/salman/",
            "shur[7]": "https://server8.mp3quran.net/shur/",
            "bu_khtr[8]": "https://server10.mp3quran.net/bu_khtr/",
            "basit[7]": "https://server8.mp3quran.net/basit/",
            "sds[11]": "https://server10.mp3quran.net/sds/",
            "hthfi[9]": "https://server10.mp3quran.net/hthfi/",
            "frs_a[8]": "https://server10.mp3quran.net/frs_a/",
            "maher[12]": "https://server10.mp3quran.net/maher/",
            "jbrl[8]": "https://server10.mp3quran.net/jbrl/",
            "minsh": "https://server10.mp3quran.net/minsh/",
            "husr[13]": "https://server10.mp3quran.net/husr/",
            "afs[8]": "https://server10.mp3quran.net/afs/",
            "mansor[11]": "https://server10.mp3quran.net/mansor/",
            "yasser[11]": "https://server10.mp3quran.net/yasser/"
        };

        // عناصر DOM
        const audioPlayer = document.getElementById('baPlayer');
        const audioSource = document.getElementById('audioSource');
        const reciterSelect = document.getElementById('reciterSelect');
        const autoplayCheckbox = document.getElementById('autoplayCheckbox');
        const quranPlaylist = document.getElementById('quran-playlist');
        const backToTopBtn = document.getElementById('backToTop');
        const lyricsContent = document.getElementById('lyrics-content');
        const currentSurahName = document.getElementById('currentSurahName');
        const lyricsLoader = document.getElementById('lyricsLoader');
        const versesCount = document.getElementById('versesCount');
        const surahType = document.getElementById('surahType');
        const revelationOrder = document.getElementById('revelationOrder');
        const btnArabic = document.getElementById('btnArabic');
        const btnTranslation = document.getElementById('btnTranslation');
        const btnTafsir = document.getElementById('btnTafsir');
        const surahInfo = document.getElementById('surahInfo');
        const nightModeToggle = document.getElementById('nightModeToggle');
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        const saveProgressBtn = document.getElementById('saveProgressBtn');
        const savedProgress = document.getElementById('savedProgress');
        
        // المتغيرات
        let currentReciter = "minsh";
        let currentSurahIndex = 0;
        let currentTextMode = 'arabic';
        let nightMode = false;
        let userProgress = JSON.parse(localStorage.getItem('quranProgress')) || { surah: 1, time: 0 };
        
        // تهيئة القائمة
        function initializePlaylist() {
            quranPlaylist.innerHTML = '';
            
            surahs.forEach((surah, index) => {
                const surahItem = document.createElement('div');
                surahItem.className = 'surah-item';
                if (index === currentSurahIndex) {
                    surahItem.classList.add('active');
                }
                
                surahItem.innerHTML = `
                    <div class="surah-number">${surah.number}</div>
                    <div class="surah-name">${surah.name}</div>
                `;
                
                surahItem.addEventListener('click', () => {
                    selectSurah(index);
                });
                
                quranPlaylist.appendChild(surahItem);
            });
        }
        
        // تحديث معلومات السورة
        function updateSurahInfo(index) {
            const surah = surahs[index];
            versesCount.textContent = surah.verses;
            surahType.textContent = surah.type;
            revelationOrder.textContent = surah.revelationOrder;
        }
        
        // تحديث تقدم المستخدم
        function updateProgressDisplay() {
            if (userProgress.surah) {
                savedProgress.textContent = `السورة ${userProgress.surah} - الوقت ${Math.floor(userProgress.time)} ثانية`;
            } else {
                savedProgress.textContent = "غير محفوظ";
            }
        }
        
        // حفظ التقدم
        function saveProgress() {
            userProgress = {
                surah: currentSurahIndex + 1,
                time: audioPlayer.currentTime || 0,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('quranProgress', JSON.stringify(userProgress));
            updateProgressDisplay();
            
            // إشعار للمستخدم
            showNotification('تم حفظ تقدمك بنجاح!');
        }
        
        // استعادة التقدم
        function loadProgress() {
            if (userProgress.surah) {
                if (confirm('هل تريد استعادة آخر تقدم محفوظ؟')) {
                    selectSurah(userProgress.surah - 1);
                    setTimeout(() => {
                        audioPlayer.currentTime = userProgress.time;
                        if (autoplayCheckbox.checked) {
                            audioPlayer.play();
                        }
                    }, 500);
                }
            }
        }
        
        // اختيار سورة
        function selectSurah(index) {
            currentSurahIndex = index;
            
            // تحديث النشاط في القائمة
            document.querySelectorAll('.surah-item').forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.classList.remove('active');
                }
            });
            
            // تحديث المشغل
            updateAudioSource();
            
            // تحديث اسم السورة الحالية
            currentSurahName.textContent = surahs[index].name;
            
            // تحديث معلومات السورة
            updateSurahInfo(index);
            
            // تحميل النص
            loadSurahText(index + 1);
        }
        
        // تحديث مصدر الصوت
        function updateAudioSource() {
            const surahNumber = (currentSurahIndex + 1).toString().padStart(3, '0');
            const audioUrl = `${reciters[currentReciter]}${surahNumber}.mp3`;
            
            audioSource.src = audioUrl;
            audioPlayer.load();
            
            if (autoplayCheckbox.checked) {
                audioPlayer.play().catch(e => console.log("التشغيل التلقائي معطل:", e));
            }
        }
        
        // تحميل نص السورة من API
        async function loadSurahText(surahNumber) {
            // إظهار مؤشر التحميل
            lyricsLoader.classList.add('active');
            lyricsContent.innerHTML = '';
            
            try {
                // استخدام AlQuran Cloud API
                const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`);
                
                if (!response.ok) throw new Error('فشل في جلب النص');
                
                const data = await response.json();
                
                if (data.code === 200 && data.data) {
                    displayQuranText(data.data.ayahs);
                } else {
                    throw new Error('بيانات غير صالحة');
                }
                
            } catch (error) {
                console.error('خطأ في تحميل النص:', error);
                displayDefaultText(surahNumber);
            } finally {
                lyricsLoader.classList.remove('active');
            }
        }
        
        // عرض النص القرآني
        function displayQuranText(ayahs) {
            let html = '<div class="quran-text">';
            
            // إضافة البسملة للسور ما عدا التوبة
            if (currentSurahIndex + 1 !== 9) {
                html += `
                    <div class="verse">
                        <div class="verse-number">1</div>
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                `;
            }
            
            // إضافة الآيات
            ayahs.forEach((ayah, index) => {
                const verseNumber = (currentSurahIndex + 1 === 9 || index > 0) ? index + 1 : index + 2;
                const verseText = ayah.text.replace(/\n/g, '<br>');
                
                html += `
                    <div class="verse">
                        <div class="verse-number">${verseNumber}</div>
                        ${verseText}
                    </div>
                `;
            });
            
            html += '</div>';
            lyricsContent.innerHTML = html;
            lyricsContent.scrollTop = 0;
        }
        
        // عرض النص الافتراضي
        function displayDefaultText(surahNumber) {
            if (surahNumber === 1) {
                const fatihaText = `
                    <div class="quran-text">
                        <div class="verse">
                            <div class="verse-number">1</div>
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                        <div class="verse">
                            <div class="verse-number">2</div>
                            الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
                        </div>
                        <div class="verse">
                            <div class="verse-number">3</div>
                            الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                        <div class="verse">
                            <div class="verse-number">4</div>
                            مَالِكِ يَوْمِ الدِّينِ
                        </div>
                        <div class="verse">
                            <div class="verse-number">5</div>
                            إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
                        </div>
                        <div class="verse">
                            <div class="verse-number">6</div>
                            اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ
                        </div>
                        <div class="verse">
                            <div class="verse-number">7</div>
                            صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ
                        </div>
                    </div>
                `;
                lyricsContent.innerHTML = fatihaText;
            } else {
                lyricsContent.innerHTML = `
                    <div class="lyrics-placeholder">
                        <i class="fas fa-wifi-slash" style="font-size: 3rem; margin-bottom: 15px; display: block; color: #cbd5e0;"></i>
                        <p>تعذر تحميل النص من الخادم</p>
                    </div>
                `;
            }
        }
        
        // تغيير وضع النص
        function setTextMode(mode) {
            currentTextMode = mode;
            
            [btnArabic, btnTranslation, btnTafsir].forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (mode === 'arabic') {
                btnArabic.classList.add('active');
                loadSurahText(currentSurahIndex + 1);
            } else if (mode === 'translation') {
                btnTranslation.classList.add('active');
                displayTranslation();
            } else if (mode === 'tafsir') {
                btnTafsir.classList.add('active');
                displayTafsir();
            }
        }
        
        // عرض الترجمة
        function displayTranslation() {
            lyricsContent.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-language" style="font-size: 3rem; color: var(--light-color); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--primary-color); margin-bottom: 15px;">ترجمة معاني القرآن الكريم</h3>
                    <p>ميزة الترجمة قيد التطوير</p>
                </div>
            `;
        }
        
        // عرض التفسير
        function displayTafsir() {
            lyricsContent.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-book" style="font-size: 3rem; color: var(--light-color); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--primary-color); margin-bottom: 15px;">التفسير الميسر</h3>
                    <p>ميزة التفسير قيد التطوير</p>
                </div>
            `;
        }
        
        // تبديل وضع الليل
        function toggleNightMode() {
            nightMode = !nightMode;
            document.body.classList.toggle('night-mode', nightMode);
            nightModeToggle.innerHTML = nightMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            localStorage.setItem('nightMode', nightMode); localStorage.setItem('wow_night_mode', nightMode ? '1' : '0');
        }
        
        // إظهار إشعار
        function showNotification(message) {
            // إنشاء عنصر الإشعار
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                background-color: var(--primary-color);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // إزالة الإشعار بعد 3 ثواني
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
        
        // إضافة أنيميشن للإشعارات
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // أحداث المستخدم
        reciterSelect.addEventListener('change', function() {
            currentReciter = this.value;
            updateAudioSource();
        });
        
        audioPlayer.addEventListener('ended', function() {
            if (autoplayCheckbox.checked && currentSurahIndex < surahs.length - 1) {
                selectSurah(currentSurahIndex + 1);
            }
        });
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        btnArabic.addEventListener('click', () => setTextMode('arabic'));
        btnTranslation.addEventListener('click', () => setTextMode('translation'));
        btnTafsir.addEventListener('click', () => setTextMode('tafsir'));
        
        nightModeToggle.addEventListener('click', toggleNightMode);
        
        // تتم إدارة القائمة الموحدة بواسطة الجزء المشترك من app.js.
        
        saveProgressBtn.addEventListener('click', saveProgress);
        
        // تهيئة التطبيق عند تحميل الصفحة
        document.addEventListener('DOMContentLoaded', function() {
            // استعادة وضع الليل
            const savedNightMode = localStorage.getItem('nightMode') === 'true' || localStorage.getItem('wow_night_mode') === '1';
            if (savedNightMode) {
                toggleNightMode();
            }
            
            // استعادة التقدم
            updateProgressDisplay();
            
            // عرض استعادة التقدم إذا كان موجودًا
            if (userProgress.surah && userProgress.surah > 1) {
                setTimeout(() => {
                    if (confirm('لديك تقدم محفوظ. هل تريد استعادته؟')) {
                        loadProgress();
                    }
                }, 1000);
            }
            
            // تهيئة المكونات
            initializePlaylist();
            loadSurahText(1);
            updateSurahInfo(0);
        });
}

document.addEventListener("DOMContentLoaded",function(){if(window.WOWSiteConfigEngine&&document.getElementById("quran-playlist"))window.WOWSiteConfigEngine.load("/");});
