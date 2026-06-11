/**
 * navbar.js — shared across all pages
 * Handles: theme toggle, mobile hamburger, active link, scroll shadow
 */
$(function () {
  const STORAGE_KEY = 'toolkit-theme';

  function applyTheme(theme) {
    $('html').attr('data-theme', theme).attr('data-bs-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applyTheme(saved);

  $(document).on('click', '[data-action="toggle-theme"]', function () {
    const current = $('html').attr('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── Mobile menu ───────────────────────────────────────────────────────────
  $(document).on('click', '[data-action="toggle-menu"]', function () {
    const $btn = $(this), $links = $('.navbar__links'), open = $links.hasClass('is-open');
    $links.toggleClass('is-open', !open);
    $btn.toggleClass('is-open', !open).attr('aria-expanded', !open);
  });
  $(document).on('click', '.navbar__link', function () {
    $('.navbar__links').removeClass('is-open');
    $('[data-action="toggle-menu"]').removeClass('is-open').attr('aria-expanded', false);
  });
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.navbar').length) {
      $('.navbar__links').removeClass('is-open');
      $('[data-action="toggle-menu"]').removeClass('is-open').attr('aria-expanded', false);
    }
  });

  // ── Active link ───────────────────────────────────────────────────────────
  const path = window.location.pathname;
  $('.navbar__link').each(function () {
    const href = $(this).attr('href');
    if (!href) return;
    const a = document.createElement('a'); a.href = href;
    const linkPath = a.pathname.replace(/\/$/, '') || '/';
    const curPath = path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
    if (linkPath === curPath) $(this).addClass('is-active');
  });

  // ── Scroll shadow on navbar ───────────────────────────────────────────────
  const $nav = $('.navbar');
  function onScroll() { $nav.toggleClass('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
