/* ============================================================================
   PageSpeed Insights — standalone analyzer
   Routes through the artline-studio Cloudflare worker (has the API key), so it
   no longer hits Google's keyless endpoint that fails with a fast 403/429.
   Every failure path now surfaces a real message instead of dying silently.
   ========================================================================== */
(function () {
  "use strict";

  var WORKER = "https://pagespeed-insights.can-akcam.workers.dev";
  var RING_CIRC = 2 * Math.PI * 46; // r = 46

  var strategy = "mobile";
  var cache = { mobile: null, desktop: null };
  var busy = false;

  var el = {
    url: document.getElementById("psUrl"),
    analyze: document.getElementById("psAnalyze"),
    strategy: document.getElementById("psStrategy"),
    loading: document.getElementById("psLoading"),
    legMobile: document.getElementById("psLegMobile"),
    legDesktop: document.getElementById("psLegDesktop"),
    errorWrap: document.getElementById("psErrorWrap"),
    errorTitle: document.getElementById("psErrorTitle"),
    errorMsg: document.getElementById("psErrorMsg"),
    results: document.getElementById("psResults")
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  function show(node) { node.classList.add("is-on"); }
  function hide(node) { node.classList.remove("is-on"); }
  function band(n) { return n >= 90 ? "good" : n >= 50 ? "avg" : "bad"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cleanDesc(s) {
    if (!s) return "";
    return String(s)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links -> plain text
      .replace(/\s*Learn more\.?\s*$/i, "")     // drop trailing "Learn more"
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeUrl(raw) {
    var u = raw.trim();
    if (!u) return null;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try { new URL(u); } catch (e) { return null; }
    return u;
  }

  function fetchStrategy(url, strat, onDone) {
    return fetch(WORKER + "?url=" + encodeURIComponent(url) + "&strategy=" + strat)
      .then(function (res) {
        return res.text().then(function (text) {
          var data;
          try { data = JSON.parse(text); }
          catch (e) { throw new Error("The analyzer service returned an unexpected response (HTTP " + res.status + "). It may be waking up — try again in a few seconds."); }
          if (data && data.error) throw new Error(data.error.message || "Google PageSpeed returned an error.");
          if (!res.ok) throw new Error("Analyzer request failed (HTTP " + res.status + ").");
          if (!data.lighthouseResult) throw new Error("No Lighthouse data came back for this URL. It may block automated testing or be unreachable.");
          return data;
        });
      })
      .then(function (data) { if (onDone) onDone(true); return data; })
      .catch(function (err) { if (onDone) onDone(false); throw err; });
  }

  // ── main ────────────────────────────────────────────────────────────────────
  function analyze() {
    if (busy) return;
    var url = normalizeUrl(el.url.value);
    if (!url) { el.url.focus(); flashError("Enter a valid URL", "Try something like example.com or https://example.com."); return; }

    busy = true;
    cache = { mobile: null, desktop: null };
    el.analyze.disabled = true;
    el.analyze.innerHTML = '<span class="ps-spinner" style="width:15px;height:15px;border-width:2px"></span> Analyzing…';
    el.legMobile.textContent = "running";
    el.legDesktop.textContent = "running";
    hide(el.errorWrap);
    hide(el.results);
    show(el.loading);

    Promise.all([
      fetchStrategy(url, "mobile", function (ok) { el.legMobile.textContent = ok ? "done" : "failed"; }),
      fetchStrategy(url, "desktop", function (ok) { el.legDesktop.textContent = ok ? "done" : "failed"; })
    ])
      .then(function (res) {
        cache.mobile = res[0];
        cache.desktop = res[1];
        hide(el.loading);
        render(cache[strategy], url);
      })
      .catch(function (err) {
        hide(el.loading);
        flashError("Couldn't analyze that URL", err.message || "Something went wrong. Please try again.");
      })
      .finally(function () {
        busy = false;
        el.analyze.disabled = false;
        el.analyze.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/></svg> Analyze';
      });
  }

  function flashError(title, msg) {
    el.errorTitle.textContent = title;
    el.errorMsg.textContent = msg;
    show(el.errorWrap);
  }

  // ── rendering ────────────────────────────────────────────────────────────────
  function render(data, url) {
    if (!data || !data.lighthouseResult) return;
    var lh = data.lighthouseResult;
    var cats = lh.categories || {};
    var audits = lh.audits || {};

    var scores = [
      { key: "performance", label: "Performance" },
      { key: "accessibility", label: "Accessibility" },
      { key: "best-practices", label: "Best Practices" },
      { key: "seo", label: "SEO" }
    ].map(function (c) {
      return { label: c.label, val: Math.round(((cats[c.key] || {}).score || 0) * 100) };
    });

    var fetchedAt = lh.fetchTime ? new Date(lh.fetchTime).toLocaleString() : "";
    var displayUrl = lh.finalUrl || lh.requestedUrl || url;

    var html = "";
    html += '<div class="ps-result-bar">';
    html += '<span class="ps-result-bar__url">' + esc(displayUrl) + "</span>";
    html += '<span class="ps-result-bar__meta">' + esc(strategy) + (fetchedAt ? " · " + esc(fetchedAt) : "") + "</span>";
    html += "</div>";

    // score rings
    html += '<div class="ps-scores">';
    scores.forEach(function (s) {
      var b = band(s.val);
      html += '<div class="ps-score"><div class="ps-ring">' +
        '<svg viewBox="0 0 104 104">' +
        '<circle class="ps-ring__track" cx="52" cy="52" r="46"/>' +
        '<circle class="ps-ring__bar stroke-' + b + '" cx="52" cy="52" r="46" ' +
        'stroke-dasharray="' + RING_CIRC.toFixed(2) + '" stroke-dashoffset="' + RING_CIRC.toFixed(2) + '" ' +
        'data-target="' + s.val + '"/>' +
        '</svg>' +
        '<div class="ps-ring__num is-' + b + '">' + s.val + "</div></div>" +
        '<div class="ps-score__label">' + s.label + "</div></div>";
    });
    html += "</div>";

    // core web vitals
    var vitals = [
      { id: "largest-contentful-paint", name: "Largest Contentful Paint" },
      { id: "first-contentful-paint", name: "First Contentful Paint" },
      { id: "total-blocking-time", name: "Total Blocking Time" },
      { id: "cumulative-layout-shift", name: "Cumulative Layout Shift" },
      { id: "speed-index", name: "Speed Index" },
      { id: "interactive", name: "Time to Interactive" }
    ];
    var vHtml = "";
    vitals.forEach(function (v) {
      var a = audits[v.id];
      if (!a) return;
      var b = a.score >= 0.9 ? "good" : a.score >= 0.5 ? "avg" : "bad";
      var colorVar = b === "good" ? "var(--good)" : b === "avg" ? "var(--avg)" : "var(--bad)";
      vHtml += '<div class="ps-vital">' +
        '<div class="ps-vital__top"><span class="ps-vital__lbl">' + (a.id.split("-").map(function (w) { return w[0]; }).join("").toUpperCase()) + '</span>' +
        '<span class="ps-vital__dot" style="background:' + colorVar + '"></span></div>' +
        '<div class="ps-vital__val is-' + b + '">' + esc(a.displayValue || "—") + "</div>" +
        '<div class="ps-vital__name">' + v.name + "</div></div>";
    });
    if (vHtml) {
      html += '<div class="ps-panel"><div class="ps-panel__head"><span class="ps-panel__title">Core Web Vitals</span>' +
        '<span class="ps-panel__hint">' + esc(strategy) + " lab data</span></div>" +
        '<div class="ps-panel__body"><div class="ps-vitals">' + vHtml + "</div></div></div>";
    }

    // opportunities
    var opps = Object.keys(audits).map(function (k) { return audits[k]; }).filter(function (a) {
      return a.details && a.details.type === "opportunity" && a.score !== null && a.score < 1 &&
        a.details.overallSavingsMs && a.details.overallSavingsMs > 0;
    }).sort(function (x, y) { return y.details.overallSavingsMs - x.details.overallSavingsMs; }).slice(0, 7);

    html += '<div class="ps-panel"><div class="ps-panel__head"><span class="ps-panel__title">Top opportunities</span>' +
      '<span class="ps-panel__hint">est. time saved</span></div><div class="ps-panel__body">';
    if (opps.length) {
      opps.forEach(function (a) {
        var sec = (a.details.overallSavingsMs / 1000).toFixed(2);
        var b = a.score >= 0.5 ? "avg" : "bad";
        var bg = b === "avg" ? "var(--avg-bg)" : "var(--bad-bg)";
        var col = b === "avg" ? "var(--avg)" : "var(--bad)";
        html += '<div class="ps-opp">' +
          '<div class="ps-opp__icon" style="background:' + bg + ';color:' + col + '">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 4v4l2.5 1.5"/><circle cx="8" cy="8" r="6"/></svg></div>' +
          '<div class="ps-opp__body"><div class="ps-opp__title">' + esc(a.title) + "</div>" +
          '<div class="ps-opp__desc">' + esc(cleanDesc(a.description)) + "</div></div>" +
          '<div class="ps-opp__save is-' + b + '">−' + sec + " s</div></div>";
      });
    } else {
      html += '<div class="ps-empty"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> No major opportunities found — this page is already well optimized.</div>';
    }
    html += "</div></div>";

    el.results.innerHTML = html;
    show(el.results);

    // animate rings on next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var bars = el.results.querySelectorAll(".ps-ring__bar");
        bars.forEach(function (bar) {
          var target = parseFloat(bar.getAttribute("data-target")) || 0;
          bar.style.strokeDashoffset = (RING_CIRC * (1 - target / 100)).toFixed(2);
        });
      });
    });
  }

  // ── events ───────────────────────────────────────────────────────────────────
  el.analyze.addEventListener("click", analyze);
  el.url.addEventListener("keydown", function (e) { if (e.key === "Enter") analyze(); });

  el.strategy.addEventListener("click", function (e) {
    var btn = e.target.closest(".segmented__btn");
    if (!btn) return;
    Array.prototype.forEach.call(el.strategy.children, function (c) { c.classList.remove("is-active"); });
    btn.classList.add("is-active");
    strategy = btn.getAttribute("data-strategy");
    if (cache[strategy]) render(cache[strategy], cache[strategy].lighthouseResult.finalUrl);
  });
})();
