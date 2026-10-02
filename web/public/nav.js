document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  /* Header logo: keep the existing image/design, make only the logo clickable. */
  const logo = document.querySelector('.logo');
  const logoImg = logo && logo.querySelector('img');
  if (logoImg && logoImg.parentElement && logoImg.parentElement.tagName !== 'A') {
    const logoLink = document.createElement('a');
    logoLink.href = './index.html';
    logoLink.className = 'logo-home-link';
    logoLink.setAttribute('aria-label', 'العودة إلى الصفحة الرئيسية');
    logoLink.title = 'الصفحة الرئيسية';
    logoLink.style.cssText = 'display:inline-flex;align-items:center;text-decoration:none;color:inherit;flex:none;';
    logoImg.parentNode.insertBefore(logoLink, logoImg);
    logoLink.appendChild(logoImg);
  }

  /* Mobile navigation. */
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('active', !expanded);
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        links.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', function (event) {
      if (!toggle.contains(event.target) && !links.contains(event.target)) {
        links.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Shared floating controls: fixed vertical stack, no overlap. */
  if (!document.getElementById('wow-shared-controls-style')) {
    const style = document.createElement('style');
    style.id = 'wow-shared-controls-style';
    style.textContent = `
      .wow-floating-control{
        position:fixed!important;right:20px!important;width:48px!important;height:48px!important;
        border:1px solid rgba(255,255,255,.38)!important;border-radius:50%!important;
        background:linear-gradient(135deg,#166534,#22c55e)!important;color:#fff!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        cursor:pointer!important;box-shadow:0 10px 28px rgba(0,0,0,.24),0 0 22px rgba(34,197,94,.20)!important;
        z-index:4500!important;font-size:18px!important;
        transition:transform .22s ease,opacity .22s ease,visibility .22s ease!important;
      }
      .wow-floating-control:hover{transform:translateY(-3px) scale(1.04)!important}
      .wow-scroll-top{bottom:136px!important;opacity:0!important;visibility:hidden!important}
      .wow-scroll-top.show{opacity:1!important;visibility:visible!important}
      .wow-scroll-bottom{bottom:80px!important;opacity:1!important;visibility:visible!important}
      .wow-theme-control{bottom:24px!important}
      /* Existing Quran/home controls are assigned the same non-overlapping stack. */
      #backToTop.wow-scroll-top{bottom:136px!important;right:20px!important;width:48px!important;height:48px!important;z-index:4500!important}
      .night-mode-toggle.floating-theme-toggle{bottom:24px!important;right:20px!important;z-index:4501!important}
      @media(max-width:600px){
        .wow-floating-control{right:14px!important;width:46px!important;height:46px!important}
        .wow-scroll-top{bottom:130px!important}
        .wow-scroll-bottom{bottom:76px!important}
        .wow-theme-control{bottom:20px!important}
        #backToTop.wow-scroll-top{bottom:130px!important;right:14px!important;width:46px!important;height:46px!important}
        .night-mode-toggle.floating-theme-toggle{bottom:20px!important;right:14px!important}
      }

      /* Professional privacy/cookie consent. */
      .wow-cookie-consent{
        position:fixed!important;left:18px!important;right:18px!important;bottom:18px!important;
        max-width:980px!important;margin:0 auto!important;padding:18px!important;
        background:rgba(255,255,255,.97)!important;color:#102218!important;
        border:1px solid rgba(22,101,52,.16)!important;border-radius:20px!important;
        box-shadow:0 20px 65px rgba(0,0,0,.24)!important;backdrop-filter:blur(18px)!important;
        z-index:7000!important;direction:rtl!important;
      }
      .night-mode .wow-cookie-consent{background:rgba(13,31,20,.98)!important;color:#e9f7ed!important;border-color:rgba(134,239,172,.16)!important}
      .wow-cookie-head{display:flex;align-items:center;gap:12px;margin-bottom:8px}
      .wow-cookie-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none;
        background:linear-gradient(135deg,#166534,#22c55e);color:#fff;box-shadow:0 8px 20px rgba(22,101,52,.20)}
      .wow-cookie-title{font-size:1.05rem;font-weight:800;margin:0}
      .wow-cookie-text{margin:0 0 12px;line-height:1.8;font-size:.9rem;opacity:.86}
      .wow-cookie-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .wow-cookie-btn{border:0;border-radius:11px;padding:10px 15px;font:inherit;font-weight:800;cursor:pointer}
      .wow-cookie-accept{background:linear-gradient(135deg,#166534,#22c55e);color:#fff}
      .wow-cookie-essential{background:#eef7f0;color:#166534;border:1px solid rgba(22,101,52,.14)}
      .night-mode .wow-cookie-essential{background:#10291a;color:#86efac;border-color:rgba(134,239,172,.16)}
      .wow-cookie-settings{background:transparent;color:inherit;border:1px solid currentColor;opacity:.72}
      .wow-cookie-settings-panel{display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(100,117,106,.18)}
      .wow-cookie-settings-panel.open{display:block}
      .wow-cookie-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0}
      .wow-cookie-row strong{display:block;font-size:.9rem}.wow-cookie-row small{display:block;opacity:.68;margin-top:2px}
      .wow-cookie-switch{width:44px;height:24px;border-radius:99px;background:#94a3b8;position:relative;flex:none}
      .wow-cookie-switch:after{content:"";position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:#fff}
      .wow-cookie-switch.on{background:#22c55e}.wow-cookie-switch.on:after{right:23px}
      @media(max-width:600px){
        .wow-cookie-consent{left:10px!important;right:10px!important;bottom:10px!important;padding:15px!important;border-radius:17px!important}
        .wow-cookie-actions{display:grid;grid-template-columns:1fr 1fr}.wow-cookie-settings{grid-column:1/-1}
        .wow-cookie-btn{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function makeControl(id, className, label, icon) {
    let button = document.getElementById(id);
    if (!button) {
      button = document.createElement('button');
      button.id = id;
      button.type = 'button';
      button.className = 'wow-floating-control ' + className;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.innerHTML = '<i class="' + icon + '" aria-hidden="true"></i>';
      document.body.appendChild(button);
    } else {
      button.classList.add('wow-floating-control', className);
      button.setAttribute('aria-label', label);
      button.title = label;
    }
    return button;
  }

  /* Reuse original Quran/home controls to avoid duplicates. */
  const existingThemeButton = document.querySelector('.night-mode-toggle');
  const existingTopButton = document.getElementById('backToTop');

  const themeButton = existingThemeButton || makeControl(
    'wowThemeControl','wow-theme-control','تبديل الوضع الليلي','fas fa-moon'
  );
  const topButton = existingTopButton || makeControl(
    'wowScrollTop','wow-scroll-top','العودة إلى أعلى الصفحة','fas fa-arrow-up'
  );
  const bottomButton = makeControl(
    'wowScrollBottom','wow-scroll-bottom','الانتقال إلى أسفل الصفحة','fas fa-arrow-down'
  );

  if (existingTopButton) existingTopButton.classList.add('wow-scroll-top');

  function updateThemeIcon() {
    if (existingThemeButton) return;
    const night = document.body.classList.contains('night-mode');
    themeButton.innerHTML = '<i class="fas ' + (night ? 'fa-sun' : 'fa-moon') + '" aria-hidden="true"></i>';
    themeButton.setAttribute('aria-label', night ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع الليلي');
    themeButton.title = night ? 'الوضع النهاري' : 'الوضع الليلي';
  }

  if (!existingThemeButton) {
    themeButton.addEventListener('click', function () {
      const night = !document.body.classList.contains('night-mode');
      document.body.classList.toggle('night-mode', night);
      localStorage.setItem('nightMode', String(night));
      localStorage.setItem('wow_night_mode', night ? '1' : '0');
      updateThemeIcon();
    });
  }

  if (!existingTopButton) {
    topButton.addEventListener('click', function () {
      window.scrollTo({top: 0, behavior: 'smooth'});
    });
  }

  bottomButton.addEventListener('click', function () {
    window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'});
  });

  function updateScrollControls() {
    const y = window.scrollY || window.pageYOffset || 0;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (!existingTopButton) {
      if (y > 220) topButton.classList.add('show');
      else topButton.classList.remove('show');
    }
    bottomButton.style.opacity = max - y > 220 ? '1' : '0';
    bottomButton.style.visibility = max - y > 220 ? 'visible' : 'hidden';
  }

  const savedNight = localStorage.getItem('nightMode') === 'true' ||
    localStorage.getItem('wow_night_mode') === '1';
  if (savedNight && !document.body.classList.contains('night-mode')) {
    if (existingThemeButton) existingThemeButton.click();
    else document.body.classList.add('night-mode');
  }
  updateThemeIcon();
  updateScrollControls();
  window.addEventListener('scroll', updateScrollControls, {passive:true});
  window.addEventListener('resize', updateScrollControls);

  /* Professional privacy/cookie consent, shared by all public pages. */
  (function setupPrivacyConsent(){
    const KEY = 'wow_privacy_consent_v2';
    const saved = localStorage.getItem(KEY);
    let banner = document.getElementById('privacyConsent');

    if (!banner) {
      banner = document.createElement('section');
      banner.id = 'privacyConsent';
      document.body.appendChild(banner);
    }

    banner.className = 'wow-cookie-consent';
    banner.setAttribute('role','dialog');
    banner.setAttribute('aria-modal','false');
    banner.setAttribute('aria-labelledby','wowCookieTitle');
    banner.setAttribute('aria-describedby','wowCookieText');
    banner.innerHTML = `
      <div class="wow-cookie-head">
        <div class="wow-cookie-icon"><i class="fas fa-cookie-bite" aria-hidden="true"></i></div>
        <h2 id="wowCookieTitle" class="wow-cookie-title">نحترم خصوصيتك</h2>
      </div>
      <p id="wowCookieText" class="wow-cookie-text">
        نستخدم التخزين المحلي وملفات تعريف الارتباط الضرورية لحفظ تفضيلات الموقع مثل الوضع الليلي وموضع القراءة.
        ويمكنك اختيار السماح بميزات التحليلات الاختيارية. يمكنك تغيير اختيارك لاحقاً من إعدادات الخصوصية.
      </p>
      <div class="wow-cookie-actions">
        <button type="button" class="wow-cookie-btn wow-cookie-accept" data-consent="all">قبول الكل</button>
        <button type="button" class="wow-cookie-btn wow-cookie-essential" data-consent="essential">الأساسية فقط</button>
        <button type="button" class="wow-cookie-btn wow-cookie-settings" id="wowCookieSettings">إدارة الإعدادات</button>
      </div>
      <div class="wow-cookie-settings-panel" id="wowCookiePanel">
        <div class="wow-cookie-row"><div><strong>الضرورية</strong><small>مطلوبة لحفظ إعدادات الموقع الأساسية.</small></div><span class="wow-cookie-switch on" aria-hidden="true"></span></div>
        <div class="wow-cookie-row"><div><strong>التفضيلات</strong><small>تسمح بحفظ اختيارات مثل الوضع الليلي وموضع القراءة.</small></div><span class="wow-cookie-switch on" aria-hidden="true"></span></div>
        <div class="wow-cookie-row"><div><strong>التحليلات</strong><small>اختيارية وتُفعّل فقط بعد موافقتك.</small></div><span class="wow-cookie-switch" id="wowAnalyticsSwitch" role="switch" aria-checked="false" tabindex="0"></span></div>
        <div class="wow-cookie-actions" style="margin-top:8px">
          <button type="button" class="wow-cookie-btn wow-cookie-accept" id="wowSaveSettings">حفظ الاختيارات</button>
        </div>
      </div>`;

    function has(category){
      try { return JSON.parse(localStorage.getItem(KEY) || '{}')[category] === true; }
      catch(e){ return false; }
    }
    window.WOWPrivacyConsent = {
      has: has,
      get: function(){ try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}; }
    };

    function save(value){
      const data = {
        essential:true,
        preferences:value === 'all' || value.preferences === true,
        analytics:value === 'all' || value.analytics === true,
        timestamp:new Date().toISOString()
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      banner.hidden = true;
      window.dispatchEvent(new CustomEvent('wow:consent-changed',{detail:data}));
    }

    if (saved) banner.hidden = true;
    else banner.hidden = false;

    banner.querySelector('[data-consent="all"]').addEventListener('click',function(){save('all');});
    banner.querySelector('[data-consent="essential"]').addEventListener('click',function(){save('essential');});

    const settings = banner.querySelector('#wowCookieSettings');
    const panel = banner.querySelector('#wowCookiePanel');
    const analyticsSwitch = banner.querySelector('#wowAnalyticsSwitch');
    settings.addEventListener('click',function(){
      panel.classList.toggle('open');
      settings.setAttribute('aria-expanded',String(panel.classList.contains('open')));
    });
    analyticsSwitch.addEventListener('click',function(){
      const on = analyticsSwitch.classList.toggle('on');
      analyticsSwitch.setAttribute('aria-checked',String(on));
    });
    analyticsSwitch.addEventListener('keydown',function(e){
      if(e.key === 'Enter' || e.key === ' '){e.preventDefault();analyticsSwitch.click();}
    });
    banner.querySelector('#wowSaveSettings').addEventListener('click',function(){
      save({
        preferences:true,
        analytics:analyticsSwitch.classList.contains('on')
      });
    });
  }
});
