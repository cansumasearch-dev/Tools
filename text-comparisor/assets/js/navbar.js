/**
 * navbar.js — shared across all pages
 * Handles: dark/light theme toggle, mobile hamburger, active link
 */
$(function () {

  // ── Theme ───────────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'toolkit-theme';

  function applyTheme(theme) {
    $('html')
      .attr('data-theme', theme)       // our design system
      .attr('data-bs-theme', theme);   // Bootstrap 5.3 dark mode
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Init theme from storage (also set by inline script in <head> to prevent flash)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applyTheme(saved);

  // Toggle
  $(document).on('click', '[data-action="toggle-theme"]', function () {
    const current = $('html').attr('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── Mobile menu ─────────────────────────────────────────────────────────────
  $(document).on('click', '[data-action="toggle-menu"]', function () {
    const $btn   = $(this);
    const $links = $('.navbar__links');
    const open   = $links.hasClass('is-open');

    $links.toggleClass('is-open', !open);
    $btn.toggleClass('is-open', !open);
    $btn.attr('aria-expanded', !open);
  });

  // Close mobile menu when a link is clicked
  $(document).on('click', '.navbar__link', function () {
    $('.navbar__links').removeClass('is-open');
    $('[data-action="toggle-menu"]').removeClass('is-open').attr('aria-expanded', false);
  });

  // Close on outside click
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.navbar').length) {
      $('.navbar__links').removeClass('is-open');
      $('[data-action="toggle-menu"]').removeClass('is-open').attr('aria-expanded', false);
    }
  });

  // ── Active link ─────────────────────────────────────────────────────────────
  // Mark the link whose href matches the current page path
  const path = window.location.pathname;
  $('.navbar__link').each(function () {
    const href = $(this).attr('href');
    if (!href) return;
    // Resolve relative href against current origin for comparison
    const a = document.createElement('a');
    a.href = href;
    const linkPath = a.pathname.replace(/\/$/, '') || '/';
    const curPath  = path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
    if (linkPath === curPath) {
      $(this).addClass('is-active');
    }
  });

});
