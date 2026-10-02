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

  /* Shared controls: dark mode + scroll to top/bottom on every public page. */
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
        z-index:4500!important;font-size:18px!important;transition:transform .22s ease,opacity .22s ease,visibility .22s ease!important;
      }
      .wow-floating-control:hover{transform:translateY(-3px) scale(1.04)!important}
      .wow-scroll-top{bottom:136px!important;opacity:0!important;visibility:hidden!important}
      .wow-scroll-top.show{opacity:1!important;visibility:visible!important}
      .wow-scroll-bottom{bottom:80px!important}
      .wow-theme-control{bottom:24px!important}
      @media(max-width:600px){
        .wow-floating-control{right:14px!important;width:46px!important;height:46px!important}
        .wow-scroll-top{bottom:130px!important}.wow-scroll-bottom{bottom:76px!important}.wow-theme-control{bottom:20px!important}
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
    }
    return button;
  }

  const themeButton = makeControl(
    'wowThemeControl',
    'wow-theme-control',
    'تبديل الوضع الليلي',
    'fas fa-moon'
  );
  const topButton = document.getElementById('backToTop') ||
    makeControl('wowScrollTop', 'wow-scroll-top', 'العودة إلى أعلى الصفحة', 'fas fa-arrow-up');
  const bottomButton = makeControl(
    'wowScrollBottom',
    'wow-scroll-bottom',
    'الانتقال إلى أسفل الصفحة',
    'fas fa-arrow-down'
  );

  function updateThemeIcon() {
    const night = document.body.classList.contains('night-mode');
    themeButton.innerHTML = '<i class="fas ' + (night ? 'fa-sun' : 'fa-moon') + '" aria-hidden="true"></i>';
    themeButton.setAttribute('aria-label', night ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع الليلي');
    themeButton.title = night ? 'الوضع النهاري' : 'الوضع الليلي';
  }

  themeButton.addEventListener('click', function () {
    const existingToggle = document.querySelector('.night-mode-toggle');
    if (existingToggle && existingToggle !== themeButton) {
      existingToggle.click();
    } else {
      const night = !document.body.classList.contains('night-mode');
      document.body.classList.toggle('night-mode', night);
      localStorage.setItem('nightMode', String(night));
      localStorage.setItem('wow_night_mode', night ? '1' : '0');
    }
    updateThemeIcon();
  });

  topButton.addEventListener('click', function () {
    window.scrollTo({top: 0, behavior: 'smooth'});
  });

  bottomButton.addEventListener('click', function () {
    window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'});
  });

  function updateScrollControls() {
    const y = window.scrollY || window.pageYOffset || 0;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (y > 220) {
      topButton.classList.add('show');
    } else {
      topButton.classList.remove('show');
    }
    bottomButton.style.opacity = max - y > 220 ? '1' : '0';
    bottomButton.style.visibility = max - y > 220 ? 'visible' : 'hidden';
  }

  /* Restore the saved theme on pages that do not already manage it themselves. */
  const savedNight = localStorage.getItem('nightMode') === 'true' ||
    localStorage.getItem('wow_night_mode') === '1';
  if (savedNight && !document.body.classList.contains('night-mode')) {
    const existingToggle = document.querySelector('.night-mode-toggle');
    if (existingToggle) {
      existingToggle.click();
    } else {
      document.body.classList.add('night-mode');
    }
  }

  updateThemeIcon();
  updateScrollControls();
  window.addEventListener('scroll', updateScrollControls, {passive:true});
  window.addEventListener('resize', updateScrollControls);
});
