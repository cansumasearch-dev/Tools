/**
 * main.js — homepage polish: keyboard access + scroll reveals
 */
$(function () {
  $('.tool-card').on('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = $(this).attr('href'); }
  });

  // Scroll reveal for any .reveal element
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }
});
