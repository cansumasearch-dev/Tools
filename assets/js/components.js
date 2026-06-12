/* ============================================================================
   components.js — reusable navbar + footer, injected into every page.
   Drop <div id="tk-nav"></div> near the top and <div id="tk-footer"></div>
   near the bottom of any page, load this script, and you get identical chrome
   everywhere. Also handles theme toggle, navbar scroll shadow, scroll-reveal.
   No jQuery dependency.
   ========================================================================== */
(function () {
  "use strict";

  var NAV = [
    { key: "home",              label: "Home",           path: "index.html" },
    { key: "text-comparisor",   label: "TextMatch",      path: "text-comparisor/index.html" },
    { key: "bootstrap-builder", label: "BS Builder",     path: "bootstrap-builder/index.html" },
    { key: "webp-converter",    label: "WebP Converter", path: "webp-converter/index.html" },
    { key: "qr-code-generator", label: "QR Generator",   path: "qr-code-generator/index.html" },
    { key: "pagespeed",         label: "PageSpeed",      path: "pagespeed/index.html" }
  ];

  // Work out how deep we are so links resolve from any folder.
  function basePrefix() {
    if (typeof window.TK_BASE === "string") return window.TK_BASE;
    var segs = window.location.pathname.split("/").filter(Boolean);
    if (segs.length && /\.html?$/i.test(segs[segs.length - 1])) segs.pop(); // drop filename
    return segs.length ? new Array(segs.length + 1).join("../") : "";
  }

  // Which nav item is the current page?
  function currentKey() {
    var segs = window.location.pathname.split("/").filter(Boolean);
    if (segs.length && /\.html?$/i.test(segs[segs.length - 1])) segs.pop();
    if (!segs.length) return "home";
    var folder = segs[segs.length - 1];
    for (var i = 0; i < NAV.length; i++) if (NAV[i].key === folder) return NAV[i].key;
    return "home";
  }

  function navbarHTML(prefix, active) {
    var items = NAV.map(function (n) {
      var isActive = n.key === active;
      return '<li class="nav-item"><a class="nav-link' + (isActive ? " active" : "") + '"' +
        (isActive ? ' aria-current="page"' : "") + ' href="' + prefix + n.path + '">' + n.label + "</a></li>";
    }).join("");
    return '' +
      '<nav class="navbar navbar-expand-lg tk-navbar sticky-top">' +
        '<div class="container">' +
          '<a class="navbar-brand d-flex align-items-center gap-2 fw-semibold" href="' + prefix + 'index.html">' +
            '<span class="tk-brand-dot"></span>toolkit<span class="text-secondary fw-normal d-none d-sm-inline">.artline-studio.de</span>' +
          '</a>' +
          '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#tkNav" aria-controls="tkNav" aria-expanded="false" aria-label="Toggle navigation">' +
            '<span class="navbar-toggler-icon"></span>' +
          '</button>' +
          '<div class="collapse navbar-collapse justify-content-lg-end gap-lg-3" id="tkNav">' +
            '<ul class="navbar-nav d-flex align-items-lg-center gap-1 mb-3 mb-lg-0">' + items + '</ul>' +
            '<button class="btn btn-sm tk-theme-btn mb-2 mb-lg-0" data-action="toggle-theme" title="Toggle theme" aria-label="Toggle dark / light mode">' +
              '<i class="bi bi-sun-fill"></i><i class="bi bi-moon-stars-fill"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</nav>';
  }

  function footerHTML(prefix) {
    return '' +
      '<footer class="tk-footer mt-5">' +
        '<div class="container py-4 d-flex flex-wrap align-items-center gap-2 gap-md-3">' +
          '<a class="fw-semibold text-body" href="' + prefix + 'index.html">toolkit.artline-studio.de</a>' +
          '<span class="d-none d-md-inline">·</span>' +
          '<span>5 tools · all browser-based · no data sent</span>' +
        '</div>' +
      '</footer>';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute("data-bs-theme", t);
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("toolkit-theme", t); } catch (e) {}
  }

  function init() {
    var prefix = basePrefix();
    var active = currentKey();

    var navMount = document.getElementById("tk-nav");
    if (navMount) navMount.outerHTML = navbarHTML(prefix, active);
    var footMount = document.getElementById("tk-footer");
    if (footMount) footMount.outerHTML = footerHTML(prefix);

    // theme toggle (delegated so it works on injected button)
    document.addEventListener("click", function (e) {
      var btn = e.target.closest('[data-action="toggle-theme"]');
      if (!btn) return;
      applyTheme(document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
    });

    // navbar scroll shadow
    var nav = document.querySelector(".tk-navbar");
    function onScroll() { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // scroll reveal
    var els = document.querySelectorAll(".tk-reveal");
    if ("IntersectionObserver" in window && els.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
