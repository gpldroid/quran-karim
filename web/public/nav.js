document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
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
});