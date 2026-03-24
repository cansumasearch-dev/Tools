/**
 * navbar.js — theme toggle for Bootstrap data-bs-theme
 */
$(function () {
  const KEY = 'toolkit-theme';

  function applyTheme(t) {
    $('html').attr('data-bs-theme', t);
    localStorage.setItem(KEY, t);
  }

  // Init — read from storage
  applyTheme(localStorage.getItem(KEY) || 'light');

  // Toggle button — reads data-bs-theme (not data-theme)
  $(document).on('click', '[data-action="toggle-theme"]', function () {
    const cur = $('html').attr('data-bs-theme') || 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
});
