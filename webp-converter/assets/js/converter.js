/**
 * converter.js — ImageConverter (jQuery rewrite)
 * Full conversion engine with presets, history, preview
 */

class ImageConverter {
  constructor() {
    this.files          = [];
    this.quality        = 0.8;
    this.convMode       = 'webp';
    this.targetW        = 1920;
    this.targetH        = 1080;
    this.keepAspect     = true;
    this.isConverting   = false;
    this.totalOrigSize  = 0;
    this.totalConvSize  = 0;
    this.renamePrefix   = '';
    this.targetFormat   = 'image/webp';
    this.urlList        = [];
    this.fileTransforms = new Map();
    this.activePresetId = null; // persists across file adds
    this.isMixed = false;

    this.history = this.loadHistory();
    this.presets = this.loadPresets();

    this.pagespeedStrategy       = 'mobile';
    this.currentPageSpeedData    = { mobile: null, desktop: null };
    this.isAnalyzingPageSpeed    = false;
    this.previousPageSpeedResults = this.loadPreviousPageSpeed();
    this.githubRepo              = 'cansumasearch-dev/Tools';
    this.changelogCache          = this.loadChangelogCache();
    this.changelogFetched        = false;
    this.accordionStates         = {};

    this._init();
  }

  // ── Init ─────────────────────────────────────────────────────────────
  _init() {
    this._bindEvents();
    this._renderHistory();
    this._renderPresets();
    this._updateSidebarStats();
    this._initNotifications();
    // No section restore needed - index.html only has the converter
    this._updatePresetSelector();
  }

  // ── Section management ────────────────────────────────────────────────
  // No switchSection needed - each page is its own HTML file



  // ── Event binding ─────────────────────────────────────────────────────
  _bindEvents() {
    const self = this;

    // Sidebar nav — links are real href links, no JS interception needed
    // Just close offcanvas when a link is clicked
    $(document).on('click', '.sidebar-nav-link', function() {
      const oc = bootstrap.Offcanvas.getInstance($('#sidebar')[0]);
      if (oc) oc.hide();
    });

    // Upload zone — input is now absolute-positioned overlay, no click handling needed
    // just bind the file input change event
    $('#fileInput').on('change', e => this._handleFileSelect(e));
    $('#uploadZone')
      .on('dragover', e => { e.preventDefault(); $('#uploadZone').addClass('dragover'); })
      .on('dragleave', e => { e.preventDefault(); $('#uploadZone').removeClass('dragover'); })
      .on('drop',      e => { e.preventDefault(); $('#uploadZone').removeClass('dragover'); this._handleDrop(e.originalEvent); });

    // Quality
    $('#qualitySlider').on('input', function() {
      self.quality = this.value / 100;
      $('#qualityVal').text(this.value + '%');
    });

    // Mode
    $('input[name="convMode"]').on('change', function() {
      self.convMode = this.value;
      self._updateModeUI();
      if (self.files.length) self._renderFileList();
    });

    // Format
    $('#outputFormatSelect').on('change', function() {
      self.targetFormat = this.value;
      const isPng = self.targetFormat === 'image/png';
      $('#qualitySlider').prop('disabled', isPng).css('opacity', isPng ? 0.4 : 1);
      if (self.files.length) { self._renderFileList(); self._updateRenamePreview(); }
    });

    // Dimensions
    $('#aspectBtn').on('click', () => this._toggleAspect());
    $('#widthInput').on('input', function() {
      self.targetW = parseInt(this.value) || 1920;
      if (self.keepAspect && self.files.length) {
        const f = self.files[0];
        if (f.dims) {
          const [w, h] = f.dims.split('x').map(Number);
          self.targetH = Math.round(self.targetW * h / w);
          $('#heightInput').val(self.targetH);
        }
      }
      if (self.files.length) self._renderFileList();
    });
    $('#heightInput').on('input', function() {
      if (!self.keepAspect) {
        self.targetH = parseInt(this.value) || 1080;
        if (self.files.length) self._renderFileList();
      }
    });

    // Actions
    $('#convertBtn').on('click', () => this.startConversion());
    $('#clearBtn').on('click', () => this.clearAll());
    $('#downloadAllBtn').on('click', () => this._downloadAll());

    // Rename
    $('#renameInput').on('input', function() {
      self.renamePrefix = this.value.trim();
      self._updateRenamePreview();
    });

    // Bulk
    $('#sortSizeBtn').on('click', () => { this.files.sort((a,b) => b.size - a.size); this._renderFileList(); });
    $('#sortSavingsBtn').on('click', () => { this.files.sort((a,b) => b.savings - a.savings); this._renderFileList(); });
    $('#removeFailed').on('click', () => { this.files = this.files.filter(f => f.status !== 'error'); this._updateUI(); });

    // Preview
    $('#togglePreviewBtn').on('click', () => { $('#previewPanel').addClass('d-none'); $('#reopenPreviewBtn').addClass('visible'); });
    $('#reopenPreviewBtn').on('click', () => { $('#previewPanel').removeClass('d-none'); $('#reopenPreviewBtn').removeClass('visible'); this._updateLivePreview(); });

    // URL upload
    $('#toggleUrlBtn').on('click', () => $('#urlSection').toggleClass('d-none'));
    $('#urlAddBtn').on('click', () => this._addUrl());
    $('#urlInput').on('keypress', e => { if (e.key === 'Enter') this._addUrl(); });

    // Preset selector (persists)
    $('#presetSelectorSelect').on('change', function() {
      const id = parseInt(this.value);
      if (id) self._applyPreset(id, false); // false = don't navigate away
    });

    // Save preset
    $('#confirmSavePreset').on('click', () => this._savePreset());

    // Duplicate detection
    $('#dupesModal').on('show.bs.modal', () => this._scanDupes());
    $('#removeDupesBtn').on('click', () => this._removeDupes());

    // History clear
    $('#clearHistoryBtn').on('click', () => {
      if (confirm('Clear all conversion history?')) {
        this.history = [];
        localStorage.removeItem('converterHistory');
        this._renderHistory();
        this._updateSidebarStats();
        this._renderStats();
      }
    });

    // PageSpeed
    $('#analyzeBtn').on('click', () => this.analyzePageSpeed());
    $('#pagespeedUrl').on('keypress', e => { if (e.key === 'Enter') this.analyzePageSpeed(); });
    $(document).on('click', '.device-btn', function() {
      $('.device-btn').removeClass('active');
      $(this).addClass('active');
      const self2 = window.converter;
      if (self2) {
        self2.pagespeedStrategy = $(this).data('strategy');
        self2.displayCurrentStrategy();
      }
    });

    // File list delegated events
    $(document).on('click', '.tool-btn[data-tool]', function() {
      const id = parseFloat($(this).data('id'));
      const tool = $(this).data('tool');
      window.converter._applyTool(id, tool);
    });
    // .icon-btn handlers removed — using .tool-btn.dl/.remove/.preview instead

    // ── File list — delegated on document (bound ONCE, never re-bound) ──
    $(document).on('click', '#fileList .tool-btn[data-tool]', e => {
      const id = parseFloat($(e.currentTarget).data('id'));
      const tool = $(e.currentTarget).data('tool');
      this._applyTool(id, tool);
    });
    $(document).on('click', '#fileList .tool-btn.dl', e => {
      this._downloadFile(parseFloat($(e.currentTarget).data('id')));
    });
    $(document).on('click', '#fileList .tool-btn.remove', e => {
      this._removeFile(parseFloat($(e.currentTarget).data('id')));
    });
    $(document).on('click', '#fileList .tool-btn.preview', e => {
      this._showCompare(parseFloat($(e.currentTarget).data('id')));
    });
    $(document).on('change', '#fileList .file-mode-sel', e => {
      const id = parseFloat($(e.target).data('id'));
      const f  = this.files.find(x => x.id === id);
      if (!f) return;
      f._mode = e.target.value;
      this._renderFileList();
    });
    $(document).on('change', '#fileList .file-format-sel', e => {
      const id = parseFloat($(e.target).data('id'));
      const f  = this.files.find(x => x.id === id);
      if (f) f._format = e.target.value;
    });
    $(document).on('input', '#fileList .file-quality-sel', function() {
      const id = parseFloat($(this).data('id'));
      const f  = window.converter.files.find(x => x.id === id);
      if (f) f._quality = this.value / 100;
      $(`#fileList .file-quality-val[data-id="${id}"]`).text(this.value + '%');
    });
    $(document).on('change', '#fileList .file-width-sel', function() {
      const id = parseFloat($(this).data('id'));
      const f  = window.converter.files.find(x => x.id === id);
      if (!f) return;
      f._width = parseInt(this.value) || 1920;
      if (f._keepAspect !== false && f.dims) {
        const [w, h] = f.dims.split('x').map(Number);
        f._height = Math.round(f._width * h / w);
        $(`#fileList .file-height-sel[data-id="${id}"]`).val(f._height);
      }
    });
    $(document).on('change', '#fileList .file-height-sel', function() {
      const id = parseFloat($(this).data('id'));
      const f  = window.converter.files.find(x => x.id === id);
      if (f && f._keepAspect === false) f._height = parseInt(this.value) || 1080;
    });
    $(document).on('click', '#fileList .file-aspect-btn', function() {
      const id = parseFloat($(this).data('id'));
      const f  = window.converter.files.find(x => x.id === id);
      if (!f) return;
      f._keepAspect = !(f._keepAspect !== false);
      $(this).toggleClass('active', f._keepAspect !== false);
      $(this).find('i').attr('class', `bi bi-${f._keepAspect !== false ? 'lock' : 'unlock'}`);
      $(`#fileList .file-height-sel[data-id="${id}"]`).prop('disabled', f._keepAspect !== false);
    });

    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); $('#fileInput').trigger('click'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!window.converter.isConverting && window.converter.files.length > 0) window.converter.startConversion();
      }
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────
  _initNotifications() {
    const closed = localStorage.getItem('notifClosed');
    if (!closed) {
      setTimeout(() => $('#notifPanel').addClass('active'), 600);
    } else {
      $('#notifReopen').addClass('visible');
    }

    $('#notifClose').on('click', () => {
      $('#notifPanel').removeClass('active');
      setTimeout(() => { $('#notifReopen').addClass('visible'); }, 300);
      localStorage.setItem('notifClosed', '1');
    });

    $('#notifReopen, #notifReopenTopbar').on('click', () => {
      $('#notifPanel').addClass('active');
      $('#notifReopen').removeClass('visible');
      localStorage.removeItem('notifClosed');
    });
  }

  // ── Sidebar stats ─────────────────────────────────────────────────────
  _updateSidebarStats() {
    const totalConv  = this.history.reduce((s, i) => s + i.fileCount, 0);
    const totalSaved = this.history.reduce((s, i) => s + (i.originalSize - i.convertedSize), 0);
    $('#sidebarConversions').text(totalConv);
    $('#sidebarSaved').text(this._fmtSize(totalSaved));
  }

  // ── Mode UI ───────────────────────────────────────────────────────────
  // Update mode-related UI — no recursive calls
  _updateModeUI() {
    const m = this.convMode;
    if (m === 'webp')   { $('#qualityBlock').removeClass('d-none'); $('#resizeCard').addClass('d-none'); }
    if (m === 'resize') { $('#qualityBlock').addClass('d-none');    $('#resizeCard').removeClass('d-none'); }
    if (m === 'both')   { $('#qualityBlock').removeClass('d-none'); $('#resizeCard').removeClass('d-none'); }
  }

  // ─── Mixed-mode manager ─────────────────────────────────────────────
  // Called ONLY from _addFiles / _removeFile — NEVER from _updateModeUI
  _checkWebpOnlyMode() {
    if (!this.files.length) return;

    const hasWebp    = this.files.some(f => f.file.type === 'image/webp');
    const hasNonWebp = this.files.some(f => f.file.type !== 'image/webp');
    const allWebp    = hasWebp && !hasNonWebp;
    const mixed      = hasWebp && hasNonWebp;

    const wasMixed = this.isMixed;
    this.isMixed   = mixed;

    if (mixed) {
      // Hide entire top controls strip — everything moves per-file
      $('#controlsTopWrap').addClass('d-none');
    } else if (allWebp) {
      // WebP only: show controls but only Resize mode, no preset, no format
      $('#controlsTopWrap').removeClass('d-none');
      $('#presetSelectorWrap').addClass('d-none');
      $('#outputFormatBlock').addClass('d-none');
      $('#modeConvert').closest('.mode-card').hide();
      $('#modeBoth').closest('.mode-card').hide();
      $('#modeResize').closest('.mode-card').show();
      this.convMode = 'resize';
      $('input[name="convMode"]').prop('checked', false);
      $('#modeResize').prop('checked', true);
    } else {
      // Non-webp only: show all controls
      $('#controlsTopWrap').removeClass('d-none');
      $('#presetSelectorWrap').removeClass('d-none');
      $('#outputFormatBlock').addClass('d-none');
      $('.mode-card').show();
      if (this.convMode === 'resize') {
        // Restore to default if was forced
        this.convMode = 'webp';
        $('#modeConvert').prop('checked', true);
      }
    }

    // When transitioning FROM mixed back to pure: average per-file settings
    if (wasMixed && !mixed && this.files.length > 0) {
      this._restoreAvgSettings();
    }

    this._updateModeUI();
  }

  // Average per-file settings → restore to top controls
  _restoreAvgSettings() {
    const files = this.files.filter(f => f._quality !== undefined || f._mode !== undefined);
    if (!files.length) return;

    const modes = files.map(f => f._mode || this.convMode);
    // Most common mode
    const modeCounts = {};
    modes.forEach(m => { modeCounts[m] = (modeCounts[m] || 0) + 1; });
    const bestMode = Object.keys(modeCounts).sort((a,b) => modeCounts[b]-modeCounts[a])[0];

    const avgQ = files.reduce((s,f) => s + (f._quality !== undefined ? f._quality : this.quality), 0) / files.length;

    this.convMode = bestMode || this.convMode;
    this.quality  = Math.round(avgQ * 100) / 100;

    $('input[name="convMode"]').prop('checked', false);
    const modeIdMap = { webp: 'modeConvert', resize: 'modeResize', both: 'modeBoth' };
    $(`#${modeIdMap[this.convMode] || 'modeConvert'}`).prop('checked', true);
    $('#qualitySlider').val(Math.round(this.quality * 100));
    $('#qualityVal').text(Math.round(this.quality * 100) + '%');
  }

  // ── Aspect ratio ─────────────────────────────────────────────────────
  _toggleAspect() {
    this.keepAspect = !this.keepAspect;
    if (this.keepAspect) {
      $('#aspectBtn').addClass('active').html('<i class="bi bi-lock me-1"></i>Lock Aspect');
      $('#heightInput').prop('disabled', true);
    } else {
      $('#aspectBtn').removeClass('active').html('<i class="bi bi-unlock me-1"></i>Free Dimensions');
      $('#heightInput').prop('disabled', false);
    }
    if (this.files.length) this._renderFileList();
  }

  // ── File handling ─────────────────────────────────────────────────────
  _handleFileSelect(e) {
    this._addFiles(Array.from(e.target.files));
  }

  _handleDrop(e) {
    const files = Array.from(e.dataTransfer.files)
      .filter(f => ['image/jpeg','image/jpg','image/png','image/svg+xml','image/webp'].includes(f.type));
    this._addFiles(files);
  }

  _addFiles(newFiles) {
    newFiles.forEach(file => {
      if (!this.files.some(f => f.name === file.name && f.size === file.size)) {
        const obj = {
          id       : Date.now() + Math.random(),
          file     : file,
          name     : file.name,
          size     : file.size,
          status   : 'pending',
          convBlob : null,
          convSize : 0,
          savings  : 0,
          origDataUrl: null,
          convDataUrl: null,
          dims     : null,
        };
        this.files.push(obj);
        this.totalOrigSize += file.size;
        this.fileTransforms.set(obj.id, { rotate:0, flipH:false, flipV:false, bg:null });
        this._loadDims(obj);
      }
    });

    this._updateUI();
    this._updateRenamePreview();
    this._updateLivePreview();
    this._checkWebpOnlyMode();
    // Re-apply active preset if one is selected (persists)
    if (this.activePresetId) {
      this._applyPreset(this.activePresetId, false);
    }
  }

  async _loadDims(obj) {
    const url = await this._toDataUrl(obj.file);
    obj.origDataUrl = url; // store immediately for thumbnail
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        obj.dims = `${img.width}x${img.height}`;
        // Update only this file's meta text and thumb — no full re-render
        const $item = $(`[data-file-id="${obj.id}"]`);
        if ($item.length) {
          $item.find('.file-item__thumb').attr('src', url).show();
          const meta = $item.find('.file-item__meta');
          if (meta.length) {
            const idx = this.files.indexOf(obj);
            const parts = [
              this._fmtSize(obj.size),
              obj.dims,
              this._getDimText(obj),
            ].filter(Boolean).join(' · ');
            meta.text(parts);
          }
        } else {
          // Item not rendered yet — trigger a clean single render
          this._renderFileList();
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  _removeFile(id) {
    const idx = this.files.findIndex(f => f.id === id);
    if (idx > -1) {
      this.totalOrigSize -= this.files[idx].size;
      if (this.files[idx].convSize) this.totalConvSize -= this.files[idx].convSize;
      this.files.splice(idx, 1);
      this.fileTransforms.delete(id);
      this._updateUI();
      this._updateLivePreview();
      this._checkWebpOnlyMode();
    }
  }

  // ── UI updates ────────────────────────────────────────────────────────
  _updateUI() {
    this._renderFileList();
    this._renderStats();

    const hasFiles = this.files.length > 0;
    $('#controlsWrap,#actionBar,#progressSection,#bulkBar').toggleClass('d-none', !hasFiles);
    if (hasFiles) $('#controlsTopWrap').toggleClass('d-none', this.isMixed);
    if (hasFiles) {
      this._updateModeUI();
      $('#presetSelectorWrap').removeClass('d-none');
    } else {
      $('#presetSelectorWrap').addClass('d-none');
    }
  }

  // ── File list rendering ─────────────────────────────────────────────
  _renderFileList() {
    const $list = $('#fileList').empty();

    this.files.forEach((f, idx) => {
      const tr = this.fileTransforms.get(f.id) || {};
      const hasTr = tr.rotate !== 0 || tr.flipH || tr.flipV || tr.bg;

      const statusHtml = {
        pending   : '<i class="bi bi-clock status-icon pending"></i>',
        processing: '<i class="bi bi-arrow-repeat status-icon processing"></i>',
        completed : '<i class="bi bi-check-circle-fill status-icon completed"></i>',
        error     : '<i class="bi bi-exclamation-circle-fill status-icon error"></i>',
      }[f.status] || '';

      const savings = f.status === 'completed' && f.savings > 0
        ? `<span class="savings-badge">-${f.savings}%</span>` : '';

      const finalName = this._getFinalName(f, idx);

      // Thumbnail
      const thumbSrc = f.origDataUrl || '';
      const thumbHtml = thumbSrc
        ? `<img class="file-item__thumb" src="${thumbSrc}" alt="" />`
        : `<div class="file-item__thumb d-flex align-items-center justify-content-center">
             <i class="bi bi-image" style="font-size:22px;color:var(--bs-tertiary-color)"></i>
           </div>`;

      const metaParts = [
        this._fmtSize(f.size),
        f.convSize > 0 ? `→ ${this._fmtSize(f.convSize)}` : '',
        f.dims || '',
        this._getDimText(f),
        tr.rotate ? `${tr.rotate}°` : '',
        tr.flipH ? 'Flip H' : '',
        tr.flipV ? 'Flip V' : '',
        tr.bg    ? 'White BG' : '',
      ].filter(Boolean).join(' · ');

      const nameHtml = finalName !== f.name
        ? `${f.name} <span style="color:var(--bs-tertiary-color)">→ ${finalName}</span>`
        : f.name;

      // Transform + action buttons
      const toolBtns = f.status === 'pending' ? `
        <button class="tool-btn" data-id="${f.id}" data-tool="rotate" title="Rotate 90°"><i class="bi bi-arrow-clockwise"></i></button>
        <button class="tool-btn ${tr.flipH?'active':''}" data-id="${f.id}" data-tool="flipH" title="Flip H"><i class="bi bi-symmetry-vertical"></i></button>
        <button class="tool-btn ${tr.flipV?'active':''}" data-id="${f.id}" data-tool="flipV" title="Flip V"><i class="bi bi-symmetry-horizontal"></i></button>
        <button class="tool-btn ${tr.bg?'active':''}" data-id="${f.id}" data-tool="bg" title="White BG"><i class="bi bi-paint-bucket"></i></button>
        ${hasTr ? `<button class="tool-btn" data-id="${f.id}" data-tool="reset" title="Reset"><i class="bi bi-arrow-counterclockwise"></i></button>` : ''}
      ` : '';
      const actionBtns = f.status === 'completed' ? `
        <button class="tool-btn preview" data-id="${f.id}" title="Compare"><i class="bi bi-eye"></i></button>
        <button class="tool-btn dl" data-id="${f.id}" title="Download"><i class="bi bi-download"></i></button>
      ` : '';

      // ─ Per-file controls (only when mixed mode) ──────────────────────────
      let perFileCtrl = '';
      if (this.isMixed) {
        const isWebp = f.file.type === 'image/webp';
        const fMode  = f._mode || (isWebp ? 'resize' : 'webp');
        const fQual  = f._quality !== undefined ? f._quality : this.quality;
        const fW     = f._width   !== undefined ? f._width   : this.targetW;
        const fH     = f._height  !== undefined ? f._height  : this.targetH;
        const fFmt   = f._format  || 'image/webp';
        const fAspect = f._keepAspect !== undefined ? f._keepAspect : true;

        const showQuality = fMode === 'webp' || fMode === 'both';
        const showResize  = fMode === 'resize' || fMode === 'both';
        const showFormat  = isWebp;   // format selector only for WebP files

        const modeOptions = isWebp
          ? `<option value="resize" ${fMode==='resize'?'selected':''}>Resize only</option>`
          : `<option value="webp"   ${fMode==='webp'  ?'selected':''}>Convert</option>
             <option value="resize" ${fMode==='resize'?'selected':''}>Resize only</option>
             <option value="both"   ${fMode==='both'  ?'selected':''}>Both</option>`;

        perFileCtrl = `
          <div class="file-item__controls" id="fc-${f.id}">
            <div class="row g-3 align-items-start">

              <div class="col-auto">
                <label class="fc-label"><i class="bi bi-gear"></i> Mode</label>
                <select class="form-select form-select-sm file-mode-sel" data-id="${f.id}" style="min-width:120px">
                  ${modeOptions}
                </select>
              </div>

              ${showFormat ? `
              <div class="col-auto">
                <label class="fc-label"><i class="bi bi-file-image"></i> Output</label>
                <select class="form-select form-select-sm file-format-sel" data-id="${f.id}" style="min-width:110px">
                  <option value="image/webp" ${fFmt==='image/webp'?'selected':''}>WebP</option>
                  <option value="image/jpeg" ${fFmt==='image/jpeg'?'selected':''}>JPEG</option>
                  <option value="image/png"  ${fFmt==='image/png' ?'selected':''}>PNG</option>
                </select>
              </div>` : ''}

              ${showQuality ? `
              <div class="col fc-quality-col" style="min-width:180px">
                <label class="fc-label"><i class="bi bi-sliders"></i> Quality</label>
                <div class="d-flex align-items-center gap-2">
                  <input type="range" class="form-range file-quality-sel flex-grow-1" data-id="${f.id}" min="1" max="100" value="${Math.round(fQual*100)}" style="accent-color:var(--accent)"/>
                  <span class="file-quality-val" data-id="${f.id}" style="font-family:var(--bs-font-monospace);font-size:12px;color:var(--accent);min-width:34px;text-align:right">${Math.round(fQual*100)}%</span>
                </div>
              </div>` : ''}

              ${showResize ? `
              <div class="col-auto">
                <label class="fc-label"><i class="bi bi-rulers"></i> Width</label>
                <input type="number" class="form-control form-control-sm file-width-sel" data-id="${f.id}" value="${fW}" min="1" style="width:90px"/>
              </div>
              <div class="col-auto">
                <label class="fc-label"><i class="bi bi-rulers"></i> Height</label>
                <input type="number" class="form-control form-control-sm file-height-sel" data-id="${f.id}" value="${fH}" min="1" style="width:90px" ${fAspect?'disabled':''}/>
              </div>
              <div class="col-auto d-flex align-items-end pb-1">
                <button class="btn btn-sm btn-outline-secondary file-aspect-btn ${fAspect?'active':''}" data-id="${f.id}" title="Lock aspect ratio">
                  <i class="bi bi-${fAspect?'lock':'unlock'}"></i>
                </button>
              </div>` : ''}

            </div>
          </div>`;
      }

      const $item = $(`
        <div class="file-item status-${f.status}" data-file-id="${f.id}">
          <div class="file-item__main">
            ${thumbHtml}
            <div class="file-item__info">
              <div class="file-item__name">${nameHtml}</div>
              <div class="file-item__meta">${metaParts}</div>
            </div>
            <div class="file-item__actions">
              ${savings}
              ${statusHtml}
              ${toolBtns}
              ${actionBtns}
              <button class="tool-btn remove" data-id="${f.id}" title="Remove"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>
          ${perFileCtrl}
        </div>
      `);
      $list.append($item);
    });

    // Thumbnails are loaded by _loadDims — just set src if already available
    this.files.forEach(f => {
      if (f.origDataUrl) {
        $(`[data-file-id="${f.id}"] img.file-item__thumb`).attr('src', f.origDataUrl);
      }
    });

  }

    _getDimText(f) {
    if (!f.dims) return '';
    const shouldResize = this.convMode === 'resize' || this.convMode === 'both';
    if (!shouldResize) return '';
    const [ow, oh] = f.dims.split('x').map(Number);
    let tw, th;
    if (this.keepAspect) {
      if (ow > this.targetW) { tw = this.targetW; th = Math.round(this.targetW * oh / ow); }
      else { tw = ow; th = oh; }
    } else { tw = this.targetW; th = this.targetH; }
    const tr = this.fileTransforms.get(f.id) || {};
    if (tr.rotate === 90 || tr.rotate === 270) [tw, th] = [th, tw];
    return `→ ${tw}x${th}`;
  }

  // ── Transforms ────────────────────────────────────────────────────────
  _applyTool(id, tool) {
    const tr = this.fileTransforms.get(id);
    if (!tr) return;
    if (tool === 'rotate')  tr.rotate = (tr.rotate + 90) % 360;
    if (tool === 'flipH')   tr.flipH = !tr.flipH;
    if (tool === 'flipV')   tr.flipV = !tr.flipV;
    if (tool === 'bg')      tr.bg = tr.bg === 'white' ? null : 'white';
    if (tool === 'reset')   { tr.rotate=0; tr.flipH=false; tr.flipV=false; tr.bg=null; }
    this._renderFileList();
    this._updateLivePreview();
  }

  // ── Stats ─────────────────────────────────────────────────────────────
  _renderStats() {
    const done = this.files.filter(f => f.status === 'completed').length;
    const pct  = this.files.length > 0 ? Math.round(done / this.files.length * 100) : 0;
    const savedPct = this._calcSavings();

    $('#statTotal').text(this.files.length);
    $('#statDone').text(done);
    $('#statSaved').text(savedPct > 0 ? savedPct + '%' : '—');
    $('#progressFill').css('width', (this.files.length > 0 ? Math.round(done/this.files.length*100) : 0) + '%');

    if (done === this.files.length && this.files.length > 0 && !this.isConverting) {
      $('#progressText').html(`<i class="bi bi-check-circle" style="color:var(--ok)"></i> Complete! Saved ${savedPct}%`);
      $('#downloadAllBtn').removeClass('d-none');
    } else if (this.isConverting) {
      $('#progressText').html(`<i class="bi bi-arrow-repeat spin-anim" style="color:var(--color-accent)"></i> Converting ${done}/${this.files.length}...`);
    } else {
      $('#progressText').html(`<i class="bi bi-images" style="color:var(--color-accent)"></i> Ready to convert ${this.files.length} files`);
    }

    // Section stats
    const totalConv  = this.history.reduce((s,i) => s + i.fileCount, 0);
    const totalSaved = this.history.reduce((s,i) => s + (i.originalSize - i.convertedSize), 0);
    const avgSavings = this.history.length ? Math.round(this.history.reduce((s,i) => s+i.totalSavings,0)/this.history.length) : 0;

    $('#statTotalConv').text(totalConv);
    $('#statSpaceSaved').text(this._fmtSize(totalSaved));
    $('#statAvgSavings').text(avgSavings + '%');
    $('#statSessions').text(this.history.length);
  }

  _calcSavings() {
    if (!this.totalOrigSize) return 0;
    return Math.round((this.totalOrigSize - this.totalConvSize) / this.totalOrigSize * 100);
  }

  // ── Rename preview ────────────────────────────────────────────────────
  _updateRenamePreview() {
    if (this.renamePrefix && this.files.length > 0) {
      const examples = this.files.slice(0, 3).map((f, i) => {
        return `<span class="preview-badge">${this.renamePrefix}_${i+1}.${this._getExt(f)}</span>`;
      }).join('');
      $('#renamePreview').html(examples + (this.files.length > 3 ? '<span class="preview-badge">…</span>' : ''));
    } else {
      $('#renamePreview').html('<small style="color:var(--text-3)">Keep empty to preserve original names</small>');
    }
  }

  _getExt(f) {
    const conv = this.convMode === 'webp' || this.convMode === 'both';
    if (!conv) {
      if (f.file.type === 'image/svg+xml') return 'png';
      return f.name.split('.').pop().toLowerCase().replace('jpeg','jpg');
    }
    if (this.targetFormat === 'image/jpeg') return 'jpg';
    if (this.targetFormat === 'image/png')  return 'png';
    return 'webp';
  }

  _getFinalName(f, idx) {
    const ext = this._getExt(f);
    if (this.renamePrefix) return `${this.renamePrefix}_${idx+1}.${ext}`;
    return f.name.replace(/\.(jpe?g|png|svg|webp)$/i, `.${ext}`);
  }

  // ── Conversion ────────────────────────────────────────────────────────
  async startConversion() {
    if (this.isConverting || !this.files.length) return;
    this.isConverting = true;
    $('#convertBtn').prop('disabled', true).html('<i class="bi bi-arrow-repeat spin-anim me-1"></i> Converting...');

    for (let i = 0; i < this.files.length; i++) {
      const f = this.files[i];
      if (f.status !== 'completed') {
        $('#progressText').html(`<i class="bi bi-arrow-repeat spin-anim" style="color:var(--color-accent)"></i> Processing: ${f.name} (${i+1}/${this.files.length})`);
        await this._convertFile(f);
      }
    }

    this.isConverting = false;
    $('#convertBtn').prop('disabled', false).html('<i class="bi bi-stars me-1"></i> Start Conversion');
    this._renderStats();
    this._saveToHistory();
    this._updateLivePreview();
  }

  async _convertFile(f) {
    try {
      f.status = 'processing';
      this._renderFileList();

      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d');
      const img    = new Image();
      const origUrl = await this._toDataUrl(f.file);
      f.origDataUrl = origUrl;

      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = origUrl; });
      f.dims = `${img.width}x${img.height}`;

      let cw = img.width, ch = img.height;
      const shouldResize = (this.isMixed && f._mode ? (f._mode === 'resize' || f._mode === 'both') : (this.convMode === 'resize' || this.convMode === 'both'));

      if (shouldResize) {
        if (this.keepAspect) {
          if (img.width > this.targetW) { cw = this.targetW; ch = Math.round(this.targetW * img.height / img.width); }
        } else { cw = this.targetW; ch = this.targetH; }
      }

      const tr = this.fileTransforms.get(f.id) || {};
      if (tr.rotate === 90 || tr.rotate === 270) { canvas.width = ch; canvas.height = cw; }
      else { canvas.width = cw; canvas.height = ch; }

      ctx.save();
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(tr.rotate * Math.PI / 180);
      if (tr.flipH) ctx.scale(-1, 1);
      if (tr.flipV) ctx.scale(1, -1);
      if (tr.bg === 'white') { ctx.fillStyle = '#fff'; ctx.fillRect(-cw/2, -ch/2, cw, ch); }
      ctx.drawImage(img, -cw/2, -ch/2, cw, ch);
      ctx.restore();

      // Per-file settings override global when in mixed mode
      const fileMode   = this.isMixed && f._mode   ? f._mode   : this.convMode;
      const fileQual   = this.isMixed && f._quality !== undefined ? f._quality : this.quality;
      const fileFormat = this.isMixed && f._format  ? f._format  : this.targetFormat;

      const shouldConvert = fileMode === 'webp' || fileMode === 'both';
      const shouldResizeF = fileMode === 'resize' || fileMode === 'both';
      let mime, qual;

      if (shouldConvert) {
        mime = fileFormat;
        qual = mime === 'image/png' ? 1.0 : fileQual;
        if (mime === 'image/jpeg' && !tr.bg) {
          const tmp = document.createElement('canvas');
          tmp.width = canvas.width; tmp.height = canvas.height;
          const tc = tmp.getContext('2d');
          tc.fillStyle = '#fff'; tc.fillRect(0, 0, tmp.width, tmp.height);
          tc.drawImage(canvas, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tmp, 0, 0);
        }
      } else {
        mime = f.file.type === 'image/svg+xml' ? 'image/png' : f.file.type;
        qual = 0.92;
      }

      await new Promise(res => {
        canvas.toBlob(blob => {
          f.convBlob  = blob;
          f.convSize  = blob.size;
          this.totalConvSize += blob.size;
          f.savings   = Math.max(0, Math.round((f.size - blob.size) / f.size * 100));
          f.status    = 'completed';
          f.newDims   = `${canvas.width}x${canvas.height}`;
          const reader = new FileReader();
          reader.onload = e => { f.convDataUrl = e.target.result; res(); };
          reader.readAsDataURL(blob);
        }, mime, qual);
      });

      await new Promise(r => setTimeout(r, 80));
    } catch(err) {
      console.error('Conversion error:', err);
      f.status = 'error';
    }
    this._renderFileList();
  }

  // ── Preview ───────────────────────────────────────────────────────────
  async _updateLivePreview() {
    if ($('#previewPanel').hasClass('d-none') || this.files.length === 0) {
      $('#previewGrid').html(`
        <div class="preview-empty">
          <i class="bi bi-images"></i>
          <p>Upload images to see preview</p>
        </div>
      `);
      return;
    }

    const cards = await Promise.all(this.files.slice(0, 8).map(async f => {
      const origUrl = f.origDataUrl || await this._toDataUrl(f.file);
      const prevUrl = await this._genPreview(f);
      return `
        <div class="preview-card">
          <div class="preview-card__name">${f.name}</div>
          <div class="preview-card__sides">
            <div class="preview-card__side">
              <div class="preview-card__lbl">Original</div>
              <img class="preview-card__img" src="${origUrl}" alt="original" />
              <div class="preview-card__sz">${this._fmtSize(f.size)}</div>
            </div>
            <div class="preview-card__side">
              <div class="preview-card__lbl">Preview</div>
              <img class="preview-card__img" src="${prevUrl}" alt="preview" />
              <div class="preview-card__sz">${f.convSize > 0 ? this._fmtSize(f.convSize) : 'Not converted yet'}</div>
            </div>
        </div>
      `;
    }));

    let html = cards.join('');
    if (this.files.length > 8) html += `<p style="color:var(--text-3);font-size:12px;grid-column:1/-1;text-align:center">Showing first 8 of ${this.files.length} images</p>`;
    $('#previewGrid').html(html);
  }

  async _genPreview(f) {
    const tr = this.fileTransforms.get(f.id);
    if (!tr || (tr.rotate === 0 && !tr.flipH && !tr.flipV && !tr.bg)) {
      return f.convDataUrl || f.origDataUrl || await this._toDataUrl(f.file);
    }
    return new Promise(async res => {
      const img = new Image();
      const url = f.origDataUrl || await this._toDataUrl(f.file);
      img.onload = () => {
        const c = document.createElement('canvas');
        if (tr.rotate === 90 || tr.rotate === 270) { c.width = img.height; c.height = img.width; }
        else { c.width = img.width; c.height = img.height; }
        const cx = c.getContext('2d');
        cx.save();
        cx.translate(c.width/2, c.height/2);
        cx.rotate(tr.rotate * Math.PI/180);
        if (tr.flipH) cx.scale(-1, 1);
        if (tr.flipV) cx.scale(1, -1);
        if (tr.bg === 'white') { cx.fillStyle='#fff'; cx.fillRect(-img.width/2,-img.height/2,img.width,img.height); }
        cx.drawImage(img, -img.width/2, -img.height/2);
        cx.restore();
        res(c.toDataURL());
      };
      img.src = url;
    });
  }

  _showCompare(id) {
    const f = this.files.find(x => x.id === id);
    if (!f || !f.convDataUrl) return;
    const html = `
      <div class="compare-side">
        <div class="compare-side__label">Original</div>
        <img src="${f.origDataUrl}" alt="original" />
        <div class="compare-side__info">
          <div>${this._fmtSize(f.size)}</div>
          <div>${f.dims || '—'}</div>
        </div>
      </div>
      <div class="compare-side">
        <div class="compare-side__label">Converted</div>
        <img src="${f.convDataUrl}" alt="converted" />
        <div class="compare-side__info">
          <div>${this._fmtSize(f.convSize)}</div>
          <div>${f.newDims || '—'}</div>
          <div class="savings">Saved ${f.savings}%</div>
        </div>
      </div>
    `;
    // compareGrid uses Bootstrap row, sides use col-md-6
    $('#compareGrid').html(html);
    new bootstrap.Modal($('#compareModal')[0]).show();
  }

  // ── Download ──────────────────────────────────────────────────────────
  _downloadFile(id) {
    const f = this.files.find(x => x.id === id);
    if (!f || !f.convBlob) return;
    const url = URL.createObjectURL(f.convBlob);
    const a = $('<a>').attr({ href: url, download: this._getFinalName(f, this.files.indexOf(f)) }).appendTo('body');
    a[0].click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async _downloadAll() {
    const done = this.files.filter(f => f.status === 'completed');
    if (!done.length) return;
    $('#downloadAllBtn').html('<i class="bi bi-arrow-repeat spin-anim me-1"></i> Creating ZIP...');
    try {
      const zip = new JSZip();
      done.forEach(f => zip.file(this._getFinalName(f, this.files.indexOf(f)), f.convBlob));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(blob);
      const a = $('<a>').attr({ href: url, download: 'converted-images.zip' }).appendTo('body');
      a[0].click();
      a.remove();
      URL.revokeObjectURL(url);
      $('#downloadAllBtn').html('<i class="bi bi-check me-1"></i> Downloaded!');
      setTimeout(() => $('#downloadAllBtn').html('<i class="bi bi-download me-1"></i> Download All ZIP'), 2500);
    } catch(err) {
      console.error(err);
      $('#downloadAllBtn').html('<i class="bi bi-exclamation me-1"></i> ZIP Error');
      setTimeout(() => $('#downloadAllBtn').html('<i class="bi bi-download me-1"></i> Download All ZIP'), 2500);
    }
  }

  // ── Clear all ─────────────────────────────────────────────────────────
  clearAll() {
    this.files = [];
    this.totalOrigSize = 0;
    this.totalConvSize = 0;
    this.renamePrefix  = '';
    this.urlList       = [];
    this.fileTransforms.clear();
    $('#renameInput').val('');
    $('#fileInput').val('');
    $('#fileList').empty();
    $('#downloadAllBtn').addClass('d-none');
    $('#previewPanel').addClass('d-none');
    $('#reopenPreviewBtn').removeClass('visible');
    this._updateUI();
    this._updateRenamePreview();
    this._checkWebpOnlyMode();
    this._toast('Cleared.');
  }

  // ── URL upload ────────────────────────────────────────────────────────
  _addUrl() {
    const url = $('#urlInput').val().trim();
    if (!url) return;
    try { new URL(url); } catch { this._toast('Invalid URL'); return; }
    this.urlList.push(url);
    this._renderUrlList();
    $('#urlInput').val('');
    this._downloadFromUrl(url);
  }

  async _downloadFromUrl(url) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Not an image');
      const name = url.split('/').pop() || 'downloaded.jpg';
      this._addFiles([new File([blob], name, { type: blob.type })]);
    } catch(err) {
      this._toast('Failed to download: ' + err.message);
      this.urlList = this.urlList.filter(u => u !== url);
      this._renderUrlList();
    }
  }

  _renderUrlList() {
    $('#urlList').html(this.urlList.map((url, i) => `
      <div class="url-list-item">
        <span class="url-text">${url}</span>
        <button data-idx="${i}"><i class="bi bi-x-lg"></i></button>
      </div>
    `).join(''));
    $('#urlList button').on('click', function() {
      const idx = parseInt($(this).data('idx'));
      window.converter.urlList.splice(idx, 1);
      window.converter._renderUrlList();
    });
  }

  // ── Presets ───────────────────────────────────────────────────────────
  _savePreset() {
    const name = $('#presetNameInput').val().trim();
    if (!name) { this._toast('Enter a preset name'); return; }

    const preset = {
      id              : Date.now(),
      name            : name,
      convMode        : this.convMode,
      quality         : this.quality,
      targetW         : this.targetW,
      targetH         : this.targetH,
      keepAspect      : this.keepAspect,
      renamePrefix    : this.renamePrefix,
      targetFormat    : this.targetFormat,
    };

    this.presets.push(preset);
    localStorage.setItem('converterPresets', JSON.stringify(this.presets));
    bootstrap.Modal.getInstance($('#savePresetModal')[0])?.hide();
    this._renderPresets();
    this._updatePresetSelector();
    this._toast('Preset saved!');
  }

  loadPresets() {
    const s = localStorage.getItem('converterPresets');
    return s ? JSON.parse(s) : [];
  }

  _renderPresets() {
    if (!this.presets.length) {
      $('#presetsGrid').html(`
        <div class="empty-state">
          <i class="bi bi-sliders"></i>
          <div class="empty-state__title">No saved presets</div>
          <div class="empty-state__sub">Save your current settings from the converter section</div>
        </div>
      `);
      return;
    }

    const fmtLabel = { 'image/webp':'WebP', 'image/jpeg':'JPEG', 'image/png':'PNG' };
    const html = this.presets.map(p => `
      <div class="col-12 col-sm-6 col-lg-4"><div class="preset-entry h-100">
        <div class="preset-entry__name">${p.name}</div>
        <div class="preset-entry__settings">
          <div class="preset-entry__row"><span class="lbl">Mode</span><span class="val">${p.convMode}</span></div>
          <div class="preset-entry__row"><span class="lbl">Format</span><span class="val">${fmtLabel[p.targetFormat]||'WebP'}</span></div>
          <div class="preset-entry__row"><span class="lbl">Quality</span><span class="val">${Math.round(p.quality*100)}%</span></div>
          <div class="preset-entry__row"><span class="lbl">Size</span><span class="val">${p.targetW}×${p.targetH}</span></div>
          <div class="preset-entry__row"><span class="lbl">Aspect</span><span class="val">${p.keepAspect?'Locked':'Free'}</span></div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-primary btn-sm flex-grow-1" onclick="converter._applyPreset(${p.id}, true)">
            <i class="bi bi-check me-1"></i> Load
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="converter._deletePreset(${p.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div></div>
    `).join('');
    $('#presetsGrid').html(html);
  }

  _updatePresetSelector() {
    const $sel = $('#presetSelectorSelect');
    $sel.empty().append('<option value="">— None —</option>');
    this.presets.forEach(p => {
      $sel.append(`<option value="${p.id}">${p.name}</option>`);
    });
    if (this.activePresetId) $sel.val(this.activePresetId);
  }

  _applyPreset(id, navigate = true) {
    const p = this.presets.find(x => x.id === id);
    if (!p) return;

    this.activePresetId = id;
    this.convMode       = p.convMode;
    this.quality        = p.quality;
    this.targetW        = p.targetW;
    this.targetH        = p.targetH;
    this.keepAspect     = p.keepAspect;
    this.renamePrefix   = p.renamePrefix;
    this.targetFormat   = p.targetFormat || 'image/webp';

    $('input[name="convMode"]').prop('checked', false);
    $(`#mode${p.convMode.charAt(0).toUpperCase()+p.convMode.slice(1)}`).prop('checked', true);
    $('#qualitySlider').val(Math.round(p.quality * 100));
    $('#qualityVal').text(Math.round(p.quality * 100) + '%');
    $('#widthInput').val(p.targetW);
    $('#heightInput').val(p.targetH);
    $('#renameInput').val(p.renamePrefix || '');
    $('#outputFormatSelect').val(p.targetFormat || 'image/webp');
    $('#presetSelectorSelect').val(id);

    if (p.keepAspect) {
      $('#aspectBtn').addClass('active').html('<i class="bi bi-lock me-1"></i>Lock Aspect');
      $('#heightInput').prop('disabled', true);
    } else {
      $('#aspectBtn').removeClass('active').html('<i class="bi bi-unlock me-1"></i>Free Dimensions');
      $('#heightInput').prop('disabled', false);
    }

    this._updateModeUI();
    this._updateRenamePreview();
    if (this.files.length) this._renderFileList();
    if (navigate) { this.switchSection('converter'); }
    this._toast(`Preset "${p.name}" loaded`);
  }

  _deletePreset(id) {
    if (!confirm('Delete this preset?')) return;
    this.presets = this.presets.filter(p => p.id !== id);
    if (this.activePresetId === id) this.activePresetId = null;
    localStorage.setItem('converterPresets', JSON.stringify(this.presets));
    this._renderPresets();
    this._updatePresetSelector();
  }

  // ── Duplicates ────────────────────────────────────────────────────────
  _scanDupes() {
    const seen = new Map(), dupes = [];
    this.files.forEach(f => {
      const k = `${f.name}-${f.size}`;
      if (seen.has(k)) dupes.push(f);
      else seen.set(k, f);
    });

    if (!dupes.length) {
      $('#dupesResult').attr('class','dupe-result clear').html(`
        <i class="bi bi-check-circle" style="color:var(--ok)"></i>
        <p>No duplicates found!</p>
      `);
      $('#removeDupesBtn').addClass('d-none');
    } else {
      $('#dupesResult').attr('class','dupe-result found').html(`
        <i class="bi bi-exclamation-triangle" style="color:var(--warn)"></i>
        <p>Found ${dupes.length} duplicate(s)</p>
      `);
      $('#removeDupesBtn').removeClass('d-none');
    }
  }

  _removeDupes() {
    const seen = new Set();
    this.files = this.files.filter(f => {
      const k = `${f.name}-${f.size}`;
      if (seen.has(k)) { this.fileTransforms.delete(f.id); return false; }
      seen.add(k);
      return true;
    });
    bootstrap.Modal.getInstance($('#dupesModal')[0])?.hide();
    this._updateUI();
    this._updateLivePreview();
    this._toast('Duplicates removed');
  }

  // ── History ───────────────────────────────────────────────────────────
  _saveToHistory() {
    const item = {
      date        : new Date().toISOString(),
      fileCount   : this.files.length,
      totalSavings: this._calcSavings(),
      originalSize: this.totalOrigSize,
      convertedSize: this.totalConvSize,
    };
    this.history.unshift(item);
    if (this.history.length > 10) this.history = this.history.slice(0, 10);
    localStorage.setItem('converterHistory', JSON.stringify(this.history));
    this._renderHistory();
    this._updateSidebarStats();
    this._renderStats();
  }

  loadHistory() {
    const s = localStorage.getItem('converterHistory');
    return s ? JSON.parse(s) : [];
  }

  _renderHistory() {
    if (!this.history.length) {
      $('#historyList').html(`
        <div class="empty-state">
          <i class="bi bi-clock-history"></i>
          <div class="empty-state__title">No history yet</div>
          <div class="empty-state__sub">Converted sessions will appear here</div>
        </div>
      `);
      return;
    }
    const html = this.history.map(item => {
      const date = new Date(item.date).toLocaleString();
      return `
        <div class="history-item">
          <div class="history-item__dot"></div>
          <div class="history-item__info">
            <div class="history-item__date">${date}</div>
            <div class="history-item__details">${item.fileCount} files · ${this._fmtSize(item.originalSize)} → ${this._fmtSize(item.convertedSize)}</div>
          </div>
          <span class="history-item__badge">${item.totalSavings}% saved</span>
        </div>
      `;
    }).join('');
    $('#historyList').html(html);
  }

  // ── PageSpeed stubs (extended in pagespeed.js) ────────────────────────
  loadPreviousPageSpeed() {
    const s = localStorage.getItem('previousPageSpeed');
    return s ? JSON.parse(s) : null;
  }
  savePreviousPageSpeed(data) { localStorage.setItem('previousPageSpeed', JSON.stringify(data)); this.previousPageSpeedResults = data; }

  // ── Changelog stubs (extended in changelog.js) ────────────────────────
  loadChangelogCache() {
    const s = localStorage.getItem('changelogCache');
    return s ? JSON.parse(s) : null;
  }
  saveChangelogCache(data) { localStorage.setItem('changelogCache', JSON.stringify(data)); this.changelogCache = data; }

  // ── Toast ─────────────────────────────────────────────────────────────
  _toast(msg) {
    const $t = $('#appToast');
    $t.text(msg).addClass('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => $t.removeClass('show'), 2600);
  }

  // ── Utilities ─────────────────────────────────────────────────────────
  _fmtSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  _toDataUrl(file) {
    return new Promise(res => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.readAsDataURL(file);
    });
  }
}