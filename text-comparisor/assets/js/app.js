/**
 * TextMatch v3 — scripts/main.js
 * jQuery: sidebar toggle, theme toggle, diff logic
 */

$(function () {

  const $html = $('html');

  // ──────────────────────────────────────────────────────────
  //  SIDEBAR
  // ──────────────────────────────────────────────────────────

  function setSidebar(open) {
    $('#sidebar').toggleClass('sidebar--open', open);
    // sidebar state;
  }

  $('#sidebarOpen').on('click', function () { setSidebar(true); });
  $('#sidebarClose').on('click', function () { setSidebar(false); });


  // ──────────────────────────────────────────────────────────
  //  THEME TOGGLE
  // ──────────────────────────────────────────────────────────


  // ──────────────────────────────────────────────────────────
  //  STATE
  // ──────────────────────────────────────────────────────────

  let _diff      = null;
  let _fixedHTML = null;
  const MAX_TOKENS = 2500;


  // ──────────────────────────────────────────────────────────
  //  LIVE WORD COUNTS
  // ──────────────────────────────────────────────────────────

  function wordCount(text) {
    const m = text.match(/\S+/g);
    return m ? m.length : 0;
  }

  function updateWordCounts() {
    const hv = $('#htmlInput').val();
    const wv = $('#wordInput').val();
    $('#htmlWC').text(hv.trim() ? wordCount(normalize(stripHTML(hv))).toLocaleString() + ' words' : '—');
    $('#wordWC').text(wv.trim() ? wordCount(normalize(wv)).toLocaleString() + ' words' : '—');
  }

  $('#htmlInput, #wordInput').on('input', updateWordCounts);


  // ──────────────────────────────────────────────────────────
  //  CLEAR
  // ──────────────────────────────────────────────────────────

  $(document).on('click', '.panel__clear-btn', function () {
    const p = $(this).data('panel');
    $(`#${p}Input`).val('');
    $(`#${p}WC`).text('—');
  });

  $('#clearAllBtn').on('click', function () {
    $('#htmlInput, #wordInput').val('');
    $('#htmlWC, #wordWC').text('—');
    $('#statsWrap').hide();
    $('#fixBtn, #copyFixBtn').hide();
    $('#progressFill').css('width', '0%');
    _diff = null;
    _fixedHTML = null;
    showEmpty();
    toast('Cleared.');
  });


  // ──────────────────────────────────────────────────────────
  //  TEXT PROCESSING
  // ──────────────────────────────────────────────────────────

  function stripHTML(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      $(doc).find('p,div,h1,h2,h3,h4,h5,h6,li,tr,td,th,section,article,header,footer,main,aside,blockquote,dd,dt,figcaption')
        .each(function () { $(this).prepend('\n'); });
      $(doc).find('br').replaceWith('\n');
      return doc.body ? (doc.body.textContent || '') : html.replace(/<[^>]+>/g, ' ');
    } catch (e) {
      return html.replace(/<[^>]+>/g, ' ');
    }
  }

  function normalize(text) {
    return text
      .replace(/[\u2018\u2019\u02BC\u0060]/g, "'")
      .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
      .replace(/[\u2013\u2014\u2015]/g, '-')
      .replace(/[\u00A0\u202F\u2009]/g, ' ')
      .replace(/\r\n|\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function getWords(text) {
    return text.match(/\S+/g) || [];
  }


  // ──────────────────────────────────────────────────────────
  //  LCS DIFF
  // ──────────────────────────────────────────────────────────

  function buildLCS(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1].toLowerCase() === b[j-1].toLowerCase()
          ? dp[i-1][j-1] + 1
          : Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
    return dp;
  }

  function backtrack(dp, a, b) {
    const ops = [];
    let i = a.length, j = b.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i-1].toLowerCase() === b[j-1].toLowerCase()) {
        ops.unshift({ t: 'eq',  v: a[i-1] }); i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
        ops.unshift({ t: 'ins', v: b[j-1] }); j--;
      } else {
        ops.unshift({ t: 'del', v: a[i-1] }); i--;
      }
    }
    return ops;
  }

  function computeDiff(hText, wText) {
    const a = getWords(hText).slice(0, MAX_TOKENS);
    const b = getWords(wText).slice(0, MAX_TOKENS);
    const trunc = getWords(hText).length > MAX_TOKENS || getWords(wText).length > MAX_TOKENS;
    return { ops: backtrack(buildLCS(a, b), a, b), trunc };
  }


  // ──────────────────────────────────────────────────────────
  //  COMPARE
  // ──────────────────────────────────────────────────────────

  function compare() {
    const hv = $('#htmlInput').val().trim();
    const wv = $('#wordInput').val().trim();
    if (!hv || !wv) { toast('⚠ Paste content into both panels first.'); return; }

    const { ops, trunc } = computeDiff(normalize(stripHTML(hv)), normalize(wv));
    _diff = ops;
    _fixedHTML = null;

    let eq = 0, ins = 0, del = 0;
    $.each(ops, function (_, o) {
      if      (o.t === 'eq')  eq++;
      else if (o.t === 'ins') ins++;
      else                    del++;
    });

    const pct = (eq + ins) > 0 ? Math.round(eq / (eq + ins) * 100) : 100;

    $('#statsWrap').show();
    $('#sMatch').text(pct + '%');
    $('#sMissing').text(ins + (ins === 1 ? ' word' : ' words'));
    $('#sExtra').text(del + (del === 1 ? ' word' : ' words'));
    $('#progressFill').css('width', pct + '%');
    $('#fixBtn').toggle(ins > 0);
    $('#copyFixBtn').hide();

    renderDiff(ops, pct, ins, del, trunc);
  }

  $('#compareBtn').on('click', compare);
  $(document).on('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); compare(); }
  });


  // ──────────────────────────────────────────────────────────
  //  RENDER DIFF
  // ──────────────────────────────────────────────────────────

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderDiff(ops, pct, ins, del, trunc) {
    const $sec = $('#resultsSection');

    if (pct === 100 && ins === 0 && del === 0) {
      $sec.html(`
        <div class="perfect">
          <div class="perfect__ring">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 12l5 5L20 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="perfect__title">Perfect Match</div>
          <div class="perfect__sub">Both texts are identical — nothing to fix.</div>
        </div>`);
      return;
    }

    let tokens = '';
    let runType = null, runBuf = [];

    function flush() {
      if (!runBuf.length) return;
      const txt = esc(runBuf.join(' '));
      if      (runType === 'eq')  tokens += `<span class="diff__token diff__token--eq">${txt} </span>`;
      else if (runType === 'ins') tokens += `<span class="diff__token diff__token--miss" title="In Word — missing from HTML">${txt}</span> `;
      else                        tokens += `<span class="diff__token diff__token--xtra" title="In HTML — not in Word">${txt}</span> `;
      runBuf = [];
    }

    $.each(ops, function (_, o) {
      if (o.t !== runType) { flush(); runType = o.t; }
      runBuf.push(o.v);
    });
    flush();

    $sec.html(`
      <div class="diff">
        ${trunc ? `<div class="warn-chip">⚠ Truncated to ${MAX_TOKENS} words — results may be partial.</div>` : ''}
        <div class="diff__meta-bar">
          <div class="diff__legend">
            <div class="diff__legend-item"><div class="diff__legend-dot diff__legend-dot--miss"></div>Missing (${ins})</div>
            <div class="diff__legend-item"><div class="diff__legend-dot diff__legend-dot--xtra"></div>Extra (${del})</div>
            <div class="diff__legend-item"><div class="diff__legend-dot diff__legend-dot--same"></div>Match</div>
          </div>
          <div class="diff__match-pct">${pct}% match</div>
        </div>
        <div class="diff__body">${tokens}</div>
        <div id="fixedContainer"></div>
      </div>`);
  }


  // ──────────────────────────────────────────────────────────
  //  FIX HTML
  // ──────────────────────────────────────────────────────────

  function findCtxEnd(html, words) {
    let pos = 0, last = -1;
    for (const w of words) {
      const i = html.toLowerCase().indexOf(w.toLowerCase(), pos);
      if (i === -1) return last;
      last = i + w.length; pos = last;
    }
    return last;
  }

  $('#fixBtn').on('click', function () {
    const htmlRaw = $('#htmlInput').val().trim();
    if (!_diff || !htmlRaw) return;

    const groups = [];
    let ctxBuf = [], cur = null;

    $.each(_diff, function (_, op) {
      if (op.t === 'eq') {
        if (cur) { groups.push(cur); cur = null; }
        ctxBuf.push(op.v);
        if (ctxBuf.length > 6) ctxBuf.shift();
      } else if (op.t === 'ins') {
        if (!cur) cur = { tokens: [], ctx: [...ctxBuf] };
        cur.tokens.push(op.v);
      } else {
        if (cur) { groups.push(cur); cur = null; }
      }
    });
    if (cur) groups.push(cur);

    if (!groups.length) { toast('✓ No missing text found!'); return; }

    let fixed = htmlRaw, count = 0;

    $.each(groups, function (_, g) {
      const missing = g.tokens.join(' ');
      const ctxEnd  = findCtxEnd(fixed, g.ctx.slice(-4));
      let ins;

      if (ctxEnd !== -1) {
        let pos = ctxEnd;
        const after = fixed.slice(pos);
        const m = after.match(/^(\s*<\/[a-zA-Z][^>]*>)+/);
        if (m) pos += m[0].length;
        ins = `<!-- TEXTMATCH_INSERTED --><span style="background:rgba(239,68,68,0.12);outline:2px dashed #ef4444;outline-offset:2px;border-radius:3px;padding:1px 3px;">${missing}</span><!-- /TEXTMATCH_INSERTED -->`;
        fixed = fixed.slice(0, pos) + ins + fixed.slice(pos);
      } else {
        const bi = fixed.toLowerCase().lastIndexOf('</body>');
        ins = `\n<!-- TEXTMATCH_INSERTED -->\n<p style="background:rgba(239,68,68,0.08);border:1px dashed #ef4444;padding:8px;margin:8px;">${missing}</p>\n<!-- /TEXTMATCH_INSERTED -->`;
        fixed = bi !== -1 ? fixed.slice(0, bi) + ins + fixed.slice(bi) : fixed + ins;
      }
      count++;
    });

    _fixedHTML = fixed;

    $('#fixedContainer').html(`
      <div class="fixed">
        <div class="fixed__header">
          <div class="fixed__title">
            <svg viewBox="0 0 14 14" fill="none"><path d="M2 12l2.5-2.5 6-6a1.77 1.77 0 00-2.5-2.5l-6 6L2 12z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Fixed — ${count} insertion${count !== 1 ? 's' : ''} applied
          </div>
          <div class="fixed__hint">Search <code>TEXTMATCH_INSERTED</code> to find spots</div>
        </div>
        <textarea class="fixed__textarea" id="fixedTextarea" readonly></textarea>
      </div>`);

    document.getElementById('fixedTextarea').value = fixed;
    $('#copyFixBtn').show();
    toast(`🔧 ${count} insertion${count !== 1 ? 's' : ''} applied.`);

    const $fc = $('#fixedContainer');
    $('#resultsSection').animate({ scrollTop: $fc.position().top + $('#resultsSection').scrollTop() - 16 }, 380);
  });


  // ──────────────────────────────────────────────────────────
  //  COPY FIXED HTML
  // ──────────────────────────────────────────────────────────

  function copyFixed() {
    if (!_fixedHTML) { toast('⚠ Run "Fix HTML Text" first.'); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(_fixedHTML)
        .then(function () { toast('✓ Copied to clipboard!'); })
        .catch(fallbackCopy);
    } else { fallbackCopy(); }
  }

  function fallbackCopy() {
    const ta = document.getElementById('fixedTextarea');
    if (!ta) return;
    ta.select();
    document.execCommand('copy');
    toast('✓ Copied!');
  }

  $('#copyFixBtn').on('click', copyFixed);


  // ──────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────

  function showEmpty() {
    $('#resultsSection').html(`
      <div class="results__empty">
        <svg class="results__empty-icon" viewBox="0 0 48 48" fill="none">
          <rect x="4"  y="4"  width="17" height="40" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
          <rect x="27" y="4"  width="17" height="40" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
          <line x1="8"  y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="8"  y1="18" x2="17" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="8"  y1="24" x2="14" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="31" y1="12" x2="40" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="31" y1="18" x2="40" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="31" y1="24" x2="40" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="31" y1="30" x2="37" y2="30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <div class="results__empty-title">No comparison yet</div>
        <div class="results__empty-sub">Paste both texts above and hit Compare</div>
      </div>`);
  }

  let _toastTimer = null;
  function toast(msg) {
    const $t = $('#toast');
    $t.text(msg).addClass('toast--show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { $t.removeClass('toast--show'); }, 2800);
  }

}); // end ready