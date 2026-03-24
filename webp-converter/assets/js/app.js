/**
 * app.js — Init + notification preference system
 */
const NOTIF_VERSION = 'v2.0.0-redesign';

function initNotifications() {
  const pref        = localStorage.getItem('notif-pref') || 'reload';
  const lastVersion = localStorage.getItem('notif-last-version');
  const $panel      = $('#notifPanel');
  const $bell       = $('#notifToggleBtn');

  // Set active pref button
  $('[data-pref]').removeClass('active').filter(`[data-pref="${pref}"]`).addClass('active');

  let show = pref === 'always' || pref === 'reload' || (pref === 'update' && lastVersion !== NOTIF_VERSION);
  if (show) { $panel.addClass('open'); $bell.addClass('has-notif'); }
  localStorage.setItem('notif-last-version', NOTIF_VERSION);

  // Bell toggles panel
  $bell.on('click', () => $panel.toggleClass('open'));

  // Close button
  $('#notifClose').on('click', () => { $panel.removeClass('open'); });

  // Pref buttons
  $(document).on('click', '[data-pref]', function() {
    const p = $(this).data('pref');
    $('[data-pref]').removeClass('active');
    $(this).addClass('active');
    localStorage.setItem('notif-pref', p);
    if (p === 'never')  { $panel.removeClass('open'); $bell.removeClass('has-notif'); }
    if (p === 'always') { $panel.addClass('open'); }
  });
}

$(function () {
  window.converter = new ImageConverter();
  initNotifications();
  $(document).on('dragenter dragover drop', (e) => e.preventDefault());
});
