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

  function ensureStyles() {
    if (document.getElementById("wow-consent-styles")) return;
    const style = document.createElement("style");
    style.id = "wow-consent-styles";
    style.textContent = `
      .wow-consent-backdrop{position:fixed;inset:0;background:rgba(2,10,5,.48);backdrop-filter:blur(4px);z-index:9998}
      .wow-consent-panel{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:min(720px,calc(100% - 24px));max-height:calc(100vh - 36px);overflow:auto;z-index:9999;background:var(--wow-surface,#fff);color:var(--wow-text,#102218);border:1px solid var(--wow-border,rgba(22,101,52,.15));border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.28);direction:rtl}
      .wow-consent-panel h2{margin:0 0 8px;font-size:1.3rem}.wow-consent-panel p{margin:0 0 16px;line-height:1.85;color:var(--wow-muted,#64756a)}
      .wow-consent-grid{display:grid;gap:10px;margin:12px 0 18px}.wow-consent-option{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border:1px solid var(--wow-border,rgba(22,101,52,.13));border-radius:14px;background:var(--wow-surface-2,#eef7f0)}
      .wow-consent-option strong{display:block}.wow-consent-option small{display:block;margin-top:3px;opacity:.75}.wow-consent-option input{width:20px;height:20px;accent-color:var(--wow-secondary,#22c55e)}
      .wow-consent-actions{display:flex;flex-wrap:wrap;gap:9px}.wow-consent-actions button{border:0;border-radius:12px;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer}.wow-consent-primary{background:linear-gradient(135deg,var(--wow-primary,#166534),var(--wow-secondary,#22c55e));color:#fff}.wow-consent-secondary{background:var(--wow-surface-2,#eef7f0);color:var(--wow-text,#102218);border:1px solid var(--wow-border)!important}.wow-consent-manage{position:fixed;left:18px;bottom:18px;z-index:4500;border:1px solid var(--wow-border,rgba(22,101,52,.15));background:var(--wow-surface,#fff);color:var(--wow-text,#102218);border-radius:999px;padding:9px 13px;font:inherit;font-size:.82rem;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.14)}.wow-footer-privacy{border:0;background:none;color:inherit;font:inherit;font-weight:800;cursor:pointer;padding:6px 0;text-decoration:underline;text-underline-offset:3px}
      @media(max-width:600px){.wow-consent-panel{bottom:8px;padding:17px;border-radius:18px}.wow-consent-actions{display:grid;grid-template-columns:1fr}.wow-consent-actions button{width:100%}.wow-consent-manage{left:10px;bottom:10px}}
    `;
    document.head.appendChild(style);
  }

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
    const button = document.createElement("button");
    button.id = "wowPrivacyManage";
    button.className = "wow-consent-manage";
    button.type = "button";
    button.textContent = "إدارة الخصوصية";
    button.setAttribute("aria-label", "إدارة الخصوصية وملفات تعريف الارتباط");
    button.onclick = function(){ open("manage"); };
    if (footer) {\n      const target = footer.querySelector(".footer-social, .footer-legal, .site-footer-inner > section, .site-footer-inner") || footer;\n      target.appendChild(button);\n    } else {\n      document.body.appendChild(button);\n    }
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