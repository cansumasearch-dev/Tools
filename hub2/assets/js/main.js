/**
 * hub/assets/js/main.js
 * Homepage — no heavy logic needed, just card hover polish
 */
$(function () {
  // Keyboard accessibility: Enter on card acts as click
  $('.tool-card').on('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = $(this).attr('href');
    }
  });
});
