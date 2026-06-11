/* navbar.js — shared: theme toggle (data-bs-theme) + navbar scroll shadow.
   Mobile menu is handled by Bootstrap's collapse, no custom JS needed. */
$(function () {
  var KEY = 'toolkit-theme';
  function apply(t) { $('html').attr('data-bs-theme', t).attr('data-theme', t); localStorage.setItem(KEY, t); }
  var saved = localStorage.getItem(KEY);
  if (saved) apply(saved);

  $(document).on('click', '[data-action="toggle-theme"]', function () {
    apply($('html').attr('data-bs-theme') === 'dark' ? 'light' : 'dark');
  });

  var $nav = $('.tk-navbar');
  function onScroll() { $nav.toggleClass('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
