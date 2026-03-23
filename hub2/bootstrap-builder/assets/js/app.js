// ═══════════════════════════════════════════════════════════════════════════════
// Bootstrap Component Builder – app.js
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Component definitions ────────────────────────────────────────────────────
const COMPONENTS = [

  // ── LAYOUT ─────────────────────────────────────────────────────────────────
  {
    id: 'accordion', name: 'Accordion', category: 'Layout',
    icon: 'bi-layout-text-sidebar', desc: 'Collapsible content panels with headers.',
    staticFields: [
      { id: 'flush', type: 'checkbox', label: 'Flush (borderless)' },
      { id: 'alwaysOpen', type: 'checkbox', label: 'Allow multiple open' },
    ],
    itemConfig: { label: 'Item', addLabel: '+ Add Accordion Item', min: 1, max: 12, default: 3,
      fields: [
        { id: 'title', type: 'text', label: 'Heading', placeholder: 'Accordion Item #1' },
        { id: 'body', type: 'textarea', label: 'Body text', placeholder: 'Content goes here...' },
        { id: 'open', type: 'checkbox', label: 'Open by default' },
      ]
    },
    generate(values, items) {
      const id = 'acc' + Date.now();
      const parts = items.map((it, i) => {
        const show = it.open ? ' show' : '';
        const coll = it.open ? '' : ' collapsed';
        const exp  = it.open ? 'true' : 'false';
        const parent = values.alwaysOpen ? '' : `data-bs-parent="#${id}"`;
        return `  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button${coll}" type="button" data-bs-toggle="collapse"
              data-bs-target="#${id}c${i}" aria-expanded="${exp}" aria-controls="${id}c${i}">
        ${it.title || `Accordion Item #${i+1}`}
      </button>
    </h2>
    <div id="${id}c${i}" class="accordion-collapse collapse${show}" ${parent}>
      <div class="accordion-body">
        ${it.body || 'Accordion body text.'}
      </div>
    </div>
  </div>`;
      }).join('\n');
      const flush = values.flush ? ' accordion-flush' : '';
      return `<div class="accordion${flush}" id="${id}">\n${parts}\n</div>`;
    }
  },

  {
    id: 'card', name: 'Card', category: 'Layout',
    icon: 'bi-card-text', desc: 'Flexible content container with header, body and footer.',
    staticFields: [
      { id: 'header', type: 'text', label: 'Card header (optional)', placeholder: 'Featured' },
      { id: 'title', type: 'text', label: 'Card title', placeholder: 'Card Title' },
      { id: 'subtitle', type: 'text', label: 'Subtitle (optional)', placeholder: 'Card subtitle' },
      { id: 'text', type: 'textarea', label: 'Body text', placeholder: 'Some quick example text...' },
      { id: 'imgUrl', type: 'text', label: 'Image URL (optional)', placeholder: 'https://picsum.photos/400/200' },
      { id: 'imgAlt', type: 'text', label: 'Image alt text', placeholder: 'Image description' },
      { id: 'btnText', type: 'text', label: 'Button text (optional)', placeholder: 'Go somewhere' },
      { id: 'btnVariant', type: 'select', label: 'Button variant', options: ['primary','secondary','success','danger','warning','info','dark','link'] },
      { id: 'footer', type: 'text', label: 'Footer text (optional)', placeholder: '2 days ago' },
      { id: 'bgVariant', type: 'select', label: 'Card background', options: ['none','primary','secondary','success','danger','warning','info','light','dark'] },
      { id: 'textColor', type: 'select', label: 'Text color override', options: ['none','white','dark'] },
      { id: 'border', type: 'select', label: 'Border color', options: ['none','primary','secondary','success','danger','warning','info','light','dark'] },
    ],
    generate(values) {
      const bg     = values.bgVariant !== 'none' ? ` bg-${values.bgVariant}` : '';
      const tc     = values.textColor !== 'none' ? ` text-${values.textColor}` : '';
      const bc     = values.border !== 'none' ? ` border-${values.border}` : '';
      const img    = values.imgUrl ? `  <img src="${values.imgUrl}" class="card-img-top" alt="${values.imgAlt || ''}">\n` : '';
      const hdr    = values.header ? `  <div class="card-header">${values.header}</div>\n` : '';
      const subttl = values.subtitle ? `\n  <h6 class="card-subtitle mb-2 text-body-secondary">${values.subtitle}</h6>` : '';
      const btn    = values.btnText ? `\n  <a href="#" class="btn btn-${values.btnVariant || 'primary'}">${values.btnText}</a>` : '';
      const ftr    = values.footer ? `  <div class="card-footer text-body-secondary">${values.footer}</div>\n` : '';
      return `<div class="card${bg}${tc}${bc}" style="width: 20rem;">
${img}${hdr}  <div class="card-body">
    <h5 class="card-title">${values.title || 'Card Title'}</h5>${subttl}
    <p class="card-text">${values.text || 'Some quick example text.'}</p>${btn}
  </div>
${ftr}</div>`;
    }
  },

  {
    id: 'tabs', name: 'Nav Tabs', category: 'Layout',
    icon: 'bi-folder2-open', desc: 'Tabbed interface with switchable content panes.',
    staticFields: [],
    itemConfig: { label: 'Tab', addLabel: '+ Add Tab', min: 2, max: 8, default: 3,
      fields: [
        { id: 'label', type: 'text', label: 'Tab label', placeholder: 'Tab 1' },
        { id: 'content', type: 'textarea', label: 'Tab content', placeholder: 'Tab content here...' },
        { id: 'active', type: 'checkbox', label: 'Active / selected' },
        { id: 'disabled', type: 'checkbox', label: 'Disabled' },
      ]
    },
    generate(values, items) {
      const id = 'tabs' + Date.now();
      const navItems = items.map((it, i) => {
        const active   = it.active ? ' active' : '';
        const disabled = it.disabled ? ' disabled' : '';
        const aria     = it.active ? ' aria-selected="true"' : '';
        return `    <li class="nav-item" role="presentation">
      <button class="nav-link${active}${disabled}" id="${id}-tab${i}" data-bs-toggle="tab"
              data-bs-target="#${id}-pane${i}" type="button" role="tab"
              aria-controls="${id}-pane${i}"${aria}>
        ${it.label || `Tab ${i+1}`}
      </button>
    </li>`;
      }).join('\n');
      const panes = items.map((it, i) => {
        const active = it.active ? ' show active' : '';
        return `    <div class="tab-pane fade${active}" id="${id}-pane${i}" role="tabpanel" aria-labelledby="${id}-tab${i}" tabindex="0">
      ${it.content || `Content for tab ${i+1}.`}
    </div>`;
      }).join('\n');
      return `<ul class="nav nav-tabs" id="${id}" role="tablist">
${navItems}
</ul>
<div class="tab-content" id="${id}Content">
${panes}
</div>`;
    }
  },

  {
    id: 'pills', name: 'Nav Pills', category: 'Layout',
    icon: 'bi-ui-radios', desc: 'Pill-style navigation with content panes.',
    staticFields: [
      { id: 'vertical', type: 'checkbox', label: 'Vertical layout' },
    ],
    itemConfig: { label: 'Pill', addLabel: '+ Add Pill', min: 2, max: 8, default: 3,
      fields: [
        { id: 'label', type: 'text', label: 'Label', placeholder: 'Pill 1' },
        { id: 'content', type: 'textarea', label: 'Content', placeholder: 'Content...' },
        { id: 'active', type: 'checkbox', label: 'Active' },
      ]
    },
    generate(values, items) {
      const id = 'pills' + Date.now();
      const vertical = values.vertical ? ' flex-column' : '';
      const navItems = items.map((it, i) => {
        const active = it.active ? ' active' : '';
        return `  <li class="nav-item" role="presentation">
    <button class="nav-link${active}" id="${id}-tab${i}" data-bs-toggle="pill"
            data-bs-target="#${id}-pane${i}" type="button" role="tab">
      ${it.label || `Pill ${i+1}`}
    </button>
  </li>`;
      }).join('\n');
      const panes = items.map((it, i) => {
        const active = it.active ? ' show active' : '';
        return `    <div class="tab-pane fade${active}" id="${id}-pane${i}" role="tabpanel" tabindex="0">
      ${it.content || `Content for pill ${i+1}.`}
    </div>`;
      }).join('\n');
      if (values.vertical) {
        return `<div class="d-flex align-items-start">
  <div class="nav flex-column nav-pills me-3" id="${id}" role="tablist" aria-orientation="vertical">
${navItems}
  </div>
  <div class="tab-content" id="${id}Content">
${panes}
  </div>
</div>`;
      }
      return `<ul class="nav nav-pills${vertical}" id="${id}" role="tablist">
${navItems}
</ul>
<div class="tab-content mt-3" id="${id}Content">
${panes}
</div>`;
    }
  },

  // ── NAVIGATION ─────────────────────────────────────────────────────────────
  {
    id: 'navbar', name: 'Navbar', category: 'Navigation',
    icon: 'bi-menu-button-wide', desc: 'Responsive navigation header.',
    staticFields: [
      { id: 'brand', type: 'text', label: 'Brand / Logo text', placeholder: 'Navbar' },
      { id: 'colorScheme', type: 'select', label: 'Color scheme (data-bs-theme)', options: ['dark','light'] },
      { id: 'bgClass', type: 'select', label: 'Background color', options: ['bg-dark','bg-primary','bg-secondary','bg-success','bg-info','bg-warning','bg-danger','bg-light','bg-body-tertiary'] },
      { id: 'expand', type: 'select', label: 'Collapse breakpoint', options: ['lg','md','sm','xl','xxl'] },
      { id: 'fixed', type: 'select', label: 'Position', options: ['none','fixed-top','fixed-bottom','sticky-top'] },
      { id: 'showSearch', type: 'checkbox', label: 'Include search form' },
    ],
    itemConfig: { label: 'Nav Link', addLabel: '+ Add Nav Link', min: 0, max: 10, default: 3,
      fields: [
        { id: 'label', type: 'text', label: 'Link text', placeholder: 'Home' },
        { id: 'href', type: 'text', label: 'href', placeholder: '#' },
        { id: 'active', type: 'checkbox', label: 'Active' },
        { id: 'disabled', type: 'checkbox', label: 'Disabled' },
      ]
    },
    generate(values, items) {
      const id = 'navbar' + Date.now();
      const fixed = values.fixed !== 'none' ? ` ${values.fixed}` : '';
      const links = items.map(it => {
        const active   = it.active ? ' active" aria-current="page' : '';
        const disabled = it.disabled ? ' disabled' : '';
        return `        <li class="nav-item"><a class="nav-link${active}${disabled}" href="${it.href||'#'}">${it.label||'Link'}</a></li>`;
      }).join('\n');
      const search = values.showSearch ? `
    <form class="d-flex" role="search">
      <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
      <button class="btn btn-outline-light" type="submit">Search</button>
    </form>` : '';
      return `<nav class="navbar navbar-expand-${values.expand||'lg'} ${values.bgClass||'bg-dark'}${fixed}" data-bs-theme="${values.colorScheme||'dark'}">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">${values.brand||'Navbar'}</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
            data-bs-target="#${id}" aria-controls="${id}"
            aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="${id}">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
${links}
      </ul>${search}
    </div>
  </div>
</nav>`;
    }
  },

  {
    id: 'breadcrumb', name: 'Breadcrumb', category: 'Navigation',
    icon: 'bi-chevron-right', desc: 'Navigation trail showing current page location.',
    staticFields: [
      { id: 'divider', type: 'select', label: 'Divider character', options: ['/','›','»','>','|','→','-'] },
    ],
    itemConfig: { label: 'Item', addLabel: '+ Add Crumb', min: 1, max: 8, default: 3,
      fields: [
        { id: 'label', type: 'text', label: 'Label', placeholder: 'Home' },
        { id: 'href', type: 'text', label: 'href (empty = current page)', placeholder: '#' },
      ]
    },
    generate(values, items) {
      const div = values.divider || '/';
      const crumbs = items.map((it, i) => {
        const isLast = i === items.length - 1;
        return isLast
          ? `      <li class="breadcrumb-item active" aria-current="page">${it.label || `Page ${i+1}`}</li>`
          : `      <li class="breadcrumb-item"><a href="${it.href||'#'}">${it.label || `Page ${i+1}`}</a></li>`;
      }).join('\n');
      return `<nav aria-label="breadcrumb" style="--bs-breadcrumb-divider: '${div}';">
  <ol class="breadcrumb">
${crumbs}
  </ol>
</nav>`;
    }
  },

  {
    id: 'pagination', name: 'Pagination', category: 'Navigation',
    icon: 'bi-123', desc: 'Page navigation controls.',
    staticFields: [
      { id: 'pageCount', type: 'range', label: 'Number of pages', min: 3, max: 20, default: 5 },
      { id: 'activePage', type: 'range', label: 'Active page', min: 1, max: 20, default: 3 },
      { id: 'size', type: 'select', label: 'Size', options: ['default','lg','sm'] },
      { id: 'prevNext', type: 'checkbox', label: 'Show Previous / Next' },
      { id: 'firstLast', type: 'checkbox', label: 'Show First / Last' },
      { id: 'align', type: 'select', label: 'Alignment', options: ['start','center','end'] },
    ],
    generate(values) {
      const sizeClass = values.size !== 'default' ? ` pagination-${values.size}` : '';
      const align = values.align !== 'start' ? ` justify-content-${values.align}` : '';
      let items = [];
      if (values.firstLast) items.push(`  <li class="page-item"><a class="page-link" href="#">«</a></li>`);
      if (values.prevNext) items.push(`  <li class="page-item"><a class="page-link" href="#">Previous</a></li>`);
      const total = parseInt(values.pageCount) || 5;
      const active = parseInt(values.activePage) || 3;
      for (let i = 1; i <= total; i++) {
        const isActive = i === active ? ' active' : '';
        const aria = i === active ? ' aria-current="page"' : '';
        items.push(`  <li class="page-item${isActive}"><a class="page-link" href="#">${i}</a></li>`);
      }
      if (values.prevNext) items.push(`  <li class="page-item"><a class="page-link" href="#">Next</a></li>`);
      if (values.firstLast) items.push(`  <li class="page-item"><a class="page-link" href="#">»</a></li>`);
      return `<nav aria-label="Page navigation">
  <ul class="pagination${sizeClass}${align}">
${items.join('\n')}
  </ul>
</nav>`;
    }
  },

  {
    id: 'offcanvas', name: 'Offcanvas', category: 'Navigation',
    icon: 'bi-layout-sidebar', desc: 'Hidden sidebar panel that slides in from the edge.',
    staticFields: [
      { id: 'btnText', type: 'text', label: 'Trigger button label', placeholder: 'Open Offcanvas' },
      { id: 'btnVariant', type: 'select', label: 'Button variant', options: ['primary','secondary','success','danger','warning','info','dark','light'] },
      { id: 'title', type: 'text', label: 'Offcanvas title', placeholder: 'Offcanvas' },
      { id: 'body', type: 'textarea', label: 'Body content', placeholder: 'Offcanvas body content...' },
      { id: 'placement', type: 'select', label: 'Placement', options: ['start','end','top','bottom'] },
      { id: 'backdrop', type: 'checkbox', label: 'Show backdrop' },
      { id: 'scroll', type: 'checkbox', label: 'Allow body scroll' },
    ],
    generate(values) {
      const id = 'oc' + Date.now();
      const scroll = values.scroll ? ' data-bs-scroll="true"' : '';
      const noBackdrop = !values.backdrop ? ' data-bs-backdrop="false"' : '';
      return `<button class="btn btn-${values.btnVariant||'primary'}" type="button"
        data-bs-toggle="offcanvas" data-bs-target="#${id}" aria-controls="${id}">
  ${values.btnText||'Open Offcanvas'}
</button>

<div class="offcanvas offcanvas-${values.placement||'start'}" tabindex="-1"
     id="${id}" aria-labelledby="${id}Label"${scroll}${noBackdrop}>
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="${id}Label">${values.title||'Offcanvas'}</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    ${values.body||'Offcanvas body content.'}
  </div>
</div>`;
    }
  },

  // ── CONTENT ────────────────────────────────────────────────────────────────
  {
    id: 'alert', name: 'Alert', category: 'Content',
    icon: 'bi-exclamation-triangle', desc: 'Contextual feedback messages.',
    staticFields: [
      { id: 'text', type: 'textarea', label: 'Alert message', placeholder: 'Alert – check it out!' },
      { id: 'variant', type: 'select', label: 'Variant', options: ['primary','secondary','success','danger','warning','info','light','dark'] },
      { id: 'heading', type: 'text', label: 'Alert heading (optional)', placeholder: 'Well done!' },
      { id: 'icon', type: 'text', label: 'Bootstrap icon class (optional)', placeholder: 'bi-check-circle-fill' },
      { id: 'dismissible', type: 'checkbox', label: 'Dismissible' },
      { id: 'link', type: 'text', label: 'Link text (optional)', placeholder: 'an example link' },
      { id: 'linkHref', type: 'text', label: 'Link href', placeholder: '#' },
    ],
    generate(values) {
      const dismissClass = values.dismissible ? ' alert-dismissible fade show' : '';
      const dismissBtn   = values.dismissible ? '\n  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : '';
      const heading = values.heading ? `  <h4 class="alert-heading">${values.heading}</h4>\n` : '';
      const icon    = values.icon ? `<i class="${values.icon} me-2"></i>` : '';
      const link    = values.link ? ` <a href="${values.linkHref||'#'}" class="alert-link">${values.link}</a>` : '';
      const msg     = values.text || 'Alert message here.';
      return `<div class="alert alert-${values.variant||'primary'}${dismissClass}" role="alert">
${heading}  ${icon}${msg}${link}${dismissBtn}
</div>`;
    }
  },

  {
    id: 'badge', name: 'Badge', category: 'Content',
    icon: 'bi-bookmark-fill', desc: 'Small count and labeling component.',
    staticFields: [
      { id: 'text', type: 'text', label: 'Badge text', placeholder: 'New' },
      { id: 'variant', type: 'select', label: 'Variant', options: ['primary','secondary','success','danger','warning','info','light','dark'] },
      { id: 'pill', type: 'checkbox', label: 'Rounded pill style' },
      { id: 'wrapTag', type: 'select', label: 'Wrap inside element', options: ['none','h1','h2','h3','h4','h5','h6','button'] },
      { id: 'wrapText', type: 'text', label: 'Wrapper element text', placeholder: 'Heading text' },
    ],
    generate(values) {
      const pill  = values.pill ? ' rounded-pill' : '';
      const badge = `<span class="badge text-bg-${values.variant||'primary'}${pill}">${values.text||'Badge'}</span>`;
      const wrap  = values.wrapTag;
      if (!wrap || wrap === 'none') return badge;
      if (wrap === 'button') return `<button type="button" class="btn btn-primary position-relative">\n  ${values.wrapText||'Button'}\n  <span class="position-absolute top-0 start-100 translate-middle ${badge.match(/class="([^"]+)"/)[1]}">\n    ${values.text||'Badge'}\n    <span class="visually-hidden">unread messages</span>\n  </span>\n</button>`;
      return `<${wrap}>${values.wrapText||'Heading'} ${badge}</${wrap}>`;
    }
  },

  {
    id: 'listgroup', name: 'List Group', category: 'Content',
    icon: 'bi-list-ul', desc: 'Flexible and powerful component for displaying lists.',
    staticFields: [
      { id: 'numbered', type: 'checkbox', label: 'Numbered list' },
      { id: 'flush', type: 'checkbox', label: 'Flush (no border/rounded)' },
      { id: 'horizontal', type: 'select', label: 'Horizontal layout', options: ['none','horizontal','horizontal-sm','horizontal-md','horizontal-lg','horizontal-xl'] },
    ],
    itemConfig: { label: 'Item', addLabel: '+ Add List Item', min: 1, max: 12, default: 4,
      fields: [
        { id: 'text', type: 'text', label: 'Item text', placeholder: 'An item' },
        { id: 'variant', type: 'select', label: 'Color variant', options: ['none','primary','secondary','success','danger','warning','info','light','dark'] },
        { id: 'active', type: 'checkbox', label: 'Active' },
        { id: 'disabled', type: 'checkbox', label: 'Disabled' },
        { id: 'badge', type: 'text', label: 'Badge text (optional)', placeholder: '14' },
      ]
    },
    generate(values, items) {
      const tag        = values.numbered ? 'ol' : 'ul';
      const numbered   = values.numbered ? ' list-group-numbered' : '';
      const flush      = values.flush    ? ' list-group-flush'    : '';
      const horiz      = values.horizontal !== 'none' ? ` list-group-${values.horizontal}` : '';
      const itemsHTML  = items.map(it => {
        const vc   = it.variant !== 'none' && it.variant ? ` list-group-item-${it.variant}` : '';
        const act  = it.active   ? ' active'   : '';
        const dis  = it.disabled ? ' disabled' : '';
        const dFlex = it.badge ? ' d-flex justify-content-between align-items-center' : '';
        const badgeHTML = it.badge ? `\n    <span class="badge bg-primary rounded-pill">${it.badge}</span>` : '';
        return `  <li class="list-group-item${vc}${act}${dis}${dFlex}">${it.text||'List item'}${badgeHTML}\n  </li>`;
      }).join('\n');
      return `<${tag} class="list-group${numbered}${flush}${horiz}">
${itemsHTML}
</${tag}>`;
    }
  },

  {
    id: 'progress', name: 'Progress', category: 'Content',
    icon: 'bi-bar-chart-steps', desc: 'Progress bars with optional labels and stacking.',
    staticFields: [
      { id: 'value', type: 'range', label: 'Value (%)', min: 0, max: 100, default: 50 },
      { id: 'label', type: 'text', label: 'Label inside bar (optional)', placeholder: '50%' },
      { id: 'variant', type: 'select', label: 'Color variant', options: ['primary','secondary','success','danger','warning','info','dark'] },
      { id: 'height', type: 'range', label: 'Height (px)', min: 4, max: 32, default: 16 },
      { id: 'striped', type: 'checkbox', label: 'Striped' },
      { id: 'animated', type: 'checkbox', label: 'Animated stripes' },
      { id: 'stacked', type: 'checkbox', label: 'Stacked (show 2nd bar)' },
      { id: 'value2', type: 'range', label: '2nd Bar value (%)', min: 0, max: 100, default: 25 },
      { id: 'variant2', type: 'select', label: '2nd Bar variant', options: ['success','primary','secondary','danger','warning','info','dark'] },
    ],
    generate(values) {
      const pct = parseInt(values.value) || 50;
      const striped = values.striped ? ' progress-bar-striped' : '';
      const anim    = values.animated ? ' progress-bar-animated' : '';
      const h = values.height || 16;
      const bar1 = `  <div class="progress-bar${striped}${anim} bg-${values.variant||'primary'}"
       role="progressbar" style="width: ${pct}%"
       aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">${values.label||''}</div>`;
      if (values.stacked) {
        const pct2 = parseInt(values.value2) || 25;
        const bar2 = `  <div class="progress-bar bg-${values.variant2||'success'}"
       role="progressbar" style="width: ${pct2}%"
       aria-valuenow="${pct2}" aria-valuemin="0" aria-valuemax="100"></div>`;
        return `<div class="progress" role="progressbar" style="height: ${h}px;">
${bar1}
${bar2}
</div>`;
      }
      return `<div class="progress" role="progressbar" style="height: ${h}px;">
${bar1}
</div>`;
    }
  },

  {
    id: 'spinner', name: 'Spinner', category: 'Content',
    icon: 'bi-arrow-repeat', desc: 'Animated loading spinner.',
    staticFields: [
      { id: 'type', type: 'select', label: 'Type', options: ['border','grow'] },
      { id: 'variant', type: 'select', label: 'Color', options: ['primary','secondary','success','danger','warning','info','dark','light'] },
      { id: 'size', type: 'select', label: 'Size', options: ['default','sm'] },
      { id: 'label', type: 'text', label: 'Accessible label', placeholder: 'Loading...' },
      { id: 'withButton', type: 'checkbox', label: 'Inside a button' },
      { id: 'btnText', type: 'text', label: 'Button text', placeholder: 'Loading...' },
      { id: 'btnVariant', type: 'select', label: 'Button variant', options: ['primary','secondary','success','danger','warning','info','dark'] },
    ],
    generate(values) {
      const sm      = values.size === 'sm' ? ' spinner-${values.type}-sm' : '';
      const sizeClass = values.size === 'sm' ? ` spinner-${values.type}-sm` : '';
      const label = values.label || 'Loading...';
      const spinner = `<div class="spinner-${values.type||'border'}${sizeClass} text-${values.variant||'primary'}" role="status">
  <span class="visually-hidden">${label}</span>
</div>`;
      if (values.withButton) {
        return `<button class="btn btn-${values.btnVariant||'primary'}" type="button" disabled>
  <span class="spinner-${values.type||'border'}${sizeClass}" aria-hidden="true"></span>
  <span role="status">${values.btnText||'Loading...'}</span>
</button>`;
      }
      return spinner;
    }
  },

  {
    id: 'table', name: 'Table', category: 'Content',
    icon: 'bi-table', desc: 'Responsive data table with various styles.',
    staticFields: [
      { id: 'variant', type: 'select', label: 'Table variant', options: ['none','primary','secondary','success','danger','warning','info','dark','light'] },
      { id: 'striped', type: 'checkbox', label: 'Striped rows' },
      { id: 'stripedCols', type: 'checkbox', label: 'Striped columns' },
      { id: 'hover', type: 'checkbox', label: 'Hover rows' },
      { id: 'bordered', type: 'checkbox', label: 'Bordered' },
      { id: 'borderless', type: 'checkbox', label: 'Borderless' },
      { id: 'sm', type: 'checkbox', label: 'Small / compact' },
      { id: 'responsive', type: 'checkbox', label: 'Responsive wrapper' },
      { id: 'caption', type: 'text', label: 'Caption text (optional)', placeholder: 'List of users' },
      { id: 'headers', type: 'text', label: 'Column headers (comma separated)', placeholder: '#,First,Last,Handle' },
      { id: 'rowCount', type: 'range', label: 'Number of rows', min: 1, max: 10, default: 3 },
    ],
    generate(values) {
      const headers = (values.headers || '#,First,Last,Handle').split(',').map(h => h.trim());
      const rowCount = parseInt(values.rowCount) || 3;
      const classes  = [
        'table',
        values.variant !== 'none' && values.variant ? `table-${values.variant}` : '',
        values.striped    ? 'table-striped'     : '',
        values.stripedCols? 'table-striped-columns':'',
        values.hover      ? 'table-hover'       : '',
        values.bordered   ? 'table-bordered'    : '',
        values.borderless ? 'table-borderless'  : '',
        values.sm         ? 'table-sm'          : '',
      ].filter(Boolean).join(' ');
      const caption = values.caption ? `  <caption>${values.caption}</caption>\n` : '';
      const thead   = `  <thead>\n    <tr>\n${headers.map(h => `      <th scope="col">${h}</th>`).join('\n')}\n    </tr>\n  </thead>`;
      const rows    = Array.from({length: rowCount}, (_, r) =>
        `    <tr>\n      <th scope="row">${r+1}</th>\n${headers.slice(1).map((_, c) => `      <td>Cell ${r+1}-${c+1}</td>`).join('\n')}\n    </tr>`
      ).join('\n');
      const tbody   = `  <tbody class="table-group-divider">\n${rows}\n  </tbody>`;
      const table   = `<table class="${classes}">\n${caption}${thead}\n${tbody}\n</table>`;
      return values.responsive ? `<div class="table-responsive">\n${table}\n</div>` : table;
    }
  },

  {
    id: 'carousel', name: 'Carousel', category: 'Content',
    icon: 'bi-images', desc: 'Slideshow component for cycling through images or content.',
    staticFields: [
      { id: 'controls', type: 'checkbox', label: 'Show prev/next controls' },
      { id: 'indicators', type: 'checkbox', label: 'Show slide indicators' },
      { id: 'fade', type: 'checkbox', label: 'Fade transition (instead of slide)' },
      { id: 'autoplay', type: 'checkbox', label: 'Auto-play / ride' },
      { id: 'dark', type: 'checkbox', label: 'Dark variant (dark controls)' },
    ],
    itemConfig: { label: 'Slide', addLabel: '+ Add Slide', min: 2, max: 8, default: 3,
      fields: [
        { id: 'img', type: 'text', label: 'Image URL', placeholder: 'https://picsum.photos/800/400?random=1' },
        { id: 'alt', type: 'text', label: 'Alt text', placeholder: 'Slide image' },
        { id: 'captionTitle', type: 'text', label: 'Caption title (optional)', placeholder: 'First slide label' },
        { id: 'captionText', type: 'text', label: 'Caption text (optional)', placeholder: 'Some description.' },
        { id: 'active', type: 'checkbox', label: 'Start here (active)' },
      ]
    },
    generate(values, items) {
      const id = 'car' + Date.now();
      const fade  = values.fade ? ' carousel-fade' : '';
      const dark  = values.dark ? ' carousel-dark' : '';
      const ride  = values.autoplay ? ' data-bs-ride="carousel"' : '';
      const inds  = values.indicators ? `  <div class="carousel-indicators">\n${items.map((_,i) => `    <button type="button" data-bs-target="#${id}" data-bs-slide-to="${i}"${i===0?' class="active" aria-current="true"':''}></button>`).join('\n')}\n  </div>\n` : '';
      const slides = items.map((it, i) => {
        const active = it.active || i === 0 ? ' active' : '';
        const caption = (it.captionTitle || it.captionText) ? `\n      <div class="carousel-caption d-none d-md-block">\n        ${it.captionTitle ? `<h5>${it.captionTitle}</h5>\n        ` : ''}${it.captionText ? `<p>${it.captionText}</p>` : ''}\n      </div>` : '';
        return `    <div class="carousel-item${active}">
      <img src="${it.img || `https://picsum.photos/800/400?random=${i+1}`}" class="d-block w-100" alt="${it.alt||'Slide'}">
${caption}
    </div>`;
      }).join('\n');
      const controls = values.controls ? `  <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>` : '';
      return `<div id="${id}" class="carousel slide${fade}${dark}"${ride}>
${inds}  <div class="carousel-inner">
${slides}
  </div>
${controls}</div>`;
    }
  },

  // ── INTERACTIVE ────────────────────────────────────────────────────────────
  {
    id: 'button', name: 'Button', category: 'Interactive',
    icon: 'bi-toggles', desc: 'Clickable button element with many style options.',
    staticFields: [
      { id: 'text', type: 'text', label: 'Button text', placeholder: 'Click me' },
      { id: 'variant', type: 'select', label: 'Variant', options: ['primary','secondary','success','danger','warning','info','light','dark','link'] },
      { id: 'outline', type: 'checkbox', label: 'Outline style' },
      { id: 'size', type: 'select', label: 'Size', options: ['default','lg','sm'] },
      { id: 'tag', type: 'select', label: 'Element', options: ['button','a','input'] },
      { id: 'disabled', type: 'checkbox', label: 'Disabled' },
      { id: 'icon', type: 'text', label: 'Bootstrap icon (optional)', placeholder: 'bi-download' },
      { id: 'iconPos', type: 'select', label: 'Icon position', options: ['left','right'] },
      { id: 'loading', type: 'checkbox', label: 'Loading / spinner state' },
    ],
    generate(values) {
      const outline  = values.outline ? 'outline-' : '';
      const variant  = `btn-${outline}${values.variant||'primary'}`;
      const sizeClass = values.size !== 'default' ? ` btn-${values.size}` : '';
      const disabled  = values.disabled ? ' disabled' : '';
      const text = values.text || 'Button';
      const iconHTML  = values.icon ? `<i class="${values.icon}${values.iconPos === 'right' ? ' ms-2' : ' me-2'}"></i>` : '';
      const spinner = values.loading ? `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span><span role="status">` : '';
      const spinnerEnd = values.loading ? `</span>` : '';
      const inner = values.loading
        ? `${spinner}${text}${spinnerEnd}`
        : (values.iconPos === 'right' ? `${text}${iconHTML}` : `${iconHTML}${text}`);
      if (values.tag === 'a') return `<a href="#" class="btn ${variant}${sizeClass}${disabled}" role="button">${inner}</a>`;
      if (values.tag === 'input') return `<input type="button" class="btn ${variant}${sizeClass}" value="${text}"${disabled ? ' disabled' : ''}>`;
      return `<button type="button" class="btn ${variant}${sizeClass}"${disabled ? ' disabled' : ''}>${inner}</button>`;
    }
  },

  {
    id: 'btngroup', name: 'Button Group', category: 'Interactive',
    icon: 'bi-distribute-horizontal', desc: 'Group multiple buttons together as a set.',
    staticFields: [
      { id: 'size', type: 'select', label: 'Size', options: ['default','lg','sm'] },
      { id: 'vertical', type: 'checkbox', label: 'Vertical layout' },
      { id: 'ariaLabel', type: 'text', label: 'Aria label', placeholder: 'Basic example' },
    ],
    itemConfig: { label: 'Button', addLabel: '+ Add Button', min: 2, max: 8, default: 3,
      fields: [
        { id: 'text', type: 'text', label: 'Button text', placeholder: 'Button' },
        { id: 'variant', type: 'select', label: 'Variant', options: ['primary','secondary','success','danger','warning','info','light','dark'] },
        { id: 'outline', type: 'checkbox', label: 'Outline' },
        { id: 'active', type: 'checkbox', label: 'Active' },
      ]
    },
    generate(values, items) {
      const sizeClass = values.size !== 'default' ? ` btn-group-${values.size}` : '';
      const vertical  = values.vertical ? 'btn-group-vertical' : 'btn-group';
      const buttons   = items.map(it => {
        const outline = it.outline ? 'outline-' : '';
        const active  = it.active ? ' active' : '';
        return `  <button type="button" class="btn btn-${outline}${it.variant||'primary'}${active}">${it.text||'Button'}</button>`;
      }).join('\n');
      return `<div class="${vertical}${sizeClass}" role="group" aria-label="${values.ariaLabel||'Button group'}">
${buttons}
</div>`;
    }
  },

  {
    id: 'dropdown', name: 'Dropdown', category: 'Interactive',
    icon: 'bi-chevron-down', desc: 'Toggleable context menu with a list of links.',
    staticFields: [
      { id: 'btnText', type: 'text', label: 'Button label', placeholder: 'Dropdown' },
      { id: 'variant', type: 'select', label: 'Variant', options: ['primary','secondary','success','danger','warning','info','light','dark'] },
      { id: 'size', type: 'select', label: 'Size', options: ['default','lg','sm'] },
      { id: 'direction', type: 'select', label: 'Direction', options: ['down','up','start','end'] },
      { id: 'split', type: 'checkbox', label: 'Split button' },
      { id: 'dark', type: 'checkbox', label: 'Dark dropdown menu' },
    ],
    itemConfig: { label: 'Menu Item', addLabel: '+ Add Menu Item', min: 1, max: 12, default: 4,
      fields: [
        { id: 'type', type: 'select', label: 'Type', options: ['link','header','divider','text','disabled-link'] },
        { id: 'text', type: 'text', label: 'Text', placeholder: 'Action' },
        { id: 'href', type: 'text', label: 'href (for links)', placeholder: '#' },
      ]
    },
    generate(values, items) {
      const id = 'dd' + Date.now();
      const sizeClass = values.size !== 'default' ? ` btn-${values.size}` : '';
      const dark      = values.dark ? ' dropdown-menu-dark' : '';
      const dir       = values.direction !== 'down' ? ` drop${values.direction}` : '';
      const menuItems = items.map(it => {
        if (it.type === 'divider') return `  <li><hr class="dropdown-divider"></li>`;
        if (it.type === 'header') return `  <li><h6 class="dropdown-header">${it.text||'Header'}</h6></li>`;
        if (it.type === 'text')   return `  <li><span class="dropdown-item-text">${it.text||'Text'}</span></li>`;
        const dis = it.type === 'disabled-link' ? ' disabled' : '';
        return `  <li><a class="dropdown-item${dis}" href="${it.href||'#'}">${it.text||'Action'}</a></li>`;
      }).join('\n');
      if (values.split) {
        return `<div class="btn-group${dir}">
  <button type="button" class="btn btn-${values.variant||'primary'}${sizeClass}">${values.btnText||'Dropdown'}</button>
  <button type="button" class="btn btn-${values.variant||'primary'}${sizeClass} dropdown-toggle dropdown-toggle-split"
          data-bs-toggle="dropdown" aria-expanded="false">
    <span class="visually-hidden">Toggle Dropdown</span>
  </button>
  <ul class="dropdown-menu${dark}">
${menuItems}
  </ul>
</div>`;
      }
      return `<div class="dropdown${dir}">
  <button class="btn btn-${values.variant||'primary'}${sizeClass} dropdown-toggle" type="button"
          data-bs-toggle="dropdown" aria-expanded="false">
    ${values.btnText||'Dropdown'}
  </button>
  <ul class="dropdown-menu${dark}">
${menuItems}
  </ul>
</div>`;
    }
  },

  {
    id: 'modal', name: 'Modal', category: 'Interactive',
    icon: 'bi-window-stack', desc: 'Dialog popup with customizable header, body and footer.',
    staticFields: [
      { id: 'btnText', type: 'text', label: 'Trigger button text', placeholder: 'Launch demo modal' },
      { id: 'btnVariant', type: 'select', label: 'Button variant', options: ['primary','secondary','success','danger','warning','info','dark'] },
      { id: 'title', type: 'text', label: 'Modal title', placeholder: 'Modal title' },
      { id: 'body', type: 'textarea', label: 'Modal body content', placeholder: 'Modal body text...' },
      { id: 'size', type: 'select', label: 'Modal size', options: ['default','sm','lg','xl'] },
      { id: 'centered', type: 'checkbox', label: 'Vertically centered' },
      { id: 'scrollable', type: 'checkbox', label: 'Scrollable body' },
      { id: 'staticBackdrop', type: 'checkbox', label: 'Static backdrop (no close on click)' },
      { id: 'closeBtn', type: 'text', label: 'Close button text', placeholder: 'Close' },
      { id: 'actionBtn', type: 'text', label: 'Action button text (optional)', placeholder: 'Save changes' },
      { id: 'actionVariant', type: 'select', label: 'Action button variant', options: ['primary','success','danger','warning','info','dark'] },
    ],
    generate(values) {
      const id = 'modal' + Date.now();
      const sizeClass    = values.size !== 'default' ? ` modal-${values.size}` : '';
      const centered     = values.centered   ? ' modal-dialog-centered'   : '';
      const scrollable   = values.scrollable ? ' modal-dialog-scrollable' : '';
      const staticBg     = values.staticBackdrop ? ` data-bs-backdrop="static" data-bs-keyboard="false"` : '';
      const actionBtnHTML = values.actionBtn ? `\n      <button type="button" class="btn btn-${values.actionVariant||'primary'}">${values.actionBtn}</button>` : '';
      return `<!-- Trigger Button -->
<button type="button" class="btn btn-${values.btnVariant||'primary'}" data-bs-toggle="modal" data-bs-target="#${id}">
  ${values.btnText||'Launch modal'}
</button>

<!-- Modal -->
<div class="modal fade" id="${id}" tabindex="-1"${staticBg}
     aria-labelledby="${id}Label" aria-hidden="true">
  <div class="modal-dialog${sizeClass}${centered}${scrollable}">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="${id}Label">${values.title||'Modal title'}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        ${values.body||'Modal body content here.'}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${values.closeBtn||'Close'}</button>${actionBtnHTML}
      </div>
    </div>
  </div>
</div>`;
    }
  },

  {
    id: 'collapse', name: 'Collapse', category: 'Interactive',
    icon: 'bi-arrows-collapse', desc: 'Toggle visibility of content.',
    staticFields: [
      { id: 'btnText', type: 'text', label: 'Trigger button text', placeholder: 'Toggle content' },
      { id: 'btnVariant', type: 'select', label: 'Button variant', options: ['primary','secondary','success','danger','warning','info','dark'] },
      { id: 'content', type: 'textarea', label: 'Collapsed content', placeholder: 'This content is toggled...' },
      { id: 'show', type: 'checkbox', label: 'Visible by default' },
      { id: 'useCard', type: 'checkbox', label: 'Wrap in card' },
    ],
    generate(values) {
      const id   = 'col' + Date.now();
      const show = values.show ? ' show' : '';
      const body = values.content || 'Collapsed content here.';
      const inner = values.useCard
        ? `<div class="card card-body">${body}</div>`
        : body;
      return `<button class="btn btn-${values.btnVariant||'primary'}" type="button"
        data-bs-toggle="collapse" data-bs-target="#${id}"
        aria-expanded="${values.show ? 'true' : 'false'}" aria-controls="${id}">
  ${values.btnText||'Toggle'}
</button>

<div class="collapse${show}" id="${id}">
  ${inner}
</div>`;
    }
  },

  {
    id: 'toast', name: 'Toast', category: 'Interactive',
    icon: 'bi-bell', desc: 'Lightweight notification popup.',
    staticFields: [
      { id: 'btnText', type: 'text', label: 'Trigger button text', placeholder: 'Show Toast' },
      { id: 'btnVariant', type: 'select', label: 'Button variant', options: ['primary','secondary','success','danger','warning','info','dark'] },
      { id: 'title', type: 'text', label: 'Toast title', placeholder: 'Bootstrap' },
      { id: 'subtitle', type: 'text', label: 'Subtitle / time', placeholder: 'just now' },
      { id: 'body', type: 'text', label: 'Toast body', placeholder: 'Hello, world! This is a toast message.' },
      { id: 'headerVariant', type: 'select', label: 'Header color', options: ['none','primary','secondary','success','danger','warning','info','dark'] },
      { id: 'autohide', type: 'checkbox', label: 'Auto-hide' },
      { id: 'delay', type: 'range', label: 'Auto-hide delay (ms)', min: 500, max: 10000, default: 5000 },
      { id: 'placement', type: 'select', label: 'Placement', options: ['top-0 start-0','top-0 start-50 translate-middle-x','top-0 end-0','top-50 start-50 translate-middle','bottom-0 start-0','bottom-0 start-50 translate-middle-x','bottom-0 end-0'] },
    ],
    generate(values) {
      const id = 'toast' + Date.now();
      const delay     = values.autohide ? ` data-bs-delay="${values.delay||5000}"` : ' data-bs-autohide="false"';
      const hdrBg     = values.headerVariant !== 'none' && values.headerVariant ? ` text-bg-${values.headerVariant}` : '';
      const placement = values.placement || 'bottom-0 end-0';
      return `<!-- Trigger Button -->
<button type="button" class="btn btn-${values.btnVariant||'primary'}" id="${id}Btn">
  ${values.btnText||'Show Toast'}
</button>

<!-- Toast Container -->
<div class="toast-container position-fixed ${placement} p-3">
  <div id="${id}" class="toast" role="alert" aria-live="assertive" aria-atomic="true"${delay}>
    <div class="toast-header${hdrBg}">
      <strong class="me-auto">${values.title||'Toast'}</strong>
      <small>${values.subtitle||'just now'}</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${values.body||'Toast message here.'}
    </div>
  </div>
</div>

<!-- JS to trigger toast -->
<script>
  document.getElementById('${id}Btn').addEventListener('click', function () {
    var toast = new bootstrap.Toast(document.getElementById('${id}'));
    toast.show();
  });
<\/script>`;
    }
  },

  // ── FORMS ──────────────────────────────────────────────────────────────────
  {
    id: 'form-input', name: 'Input', category: 'Forms',
    icon: 'bi-input-cursor-text', desc: 'Text input field with label and optional feedback.',
    staticFields: [
      { id: 'label', type: 'text', label: 'Label text', placeholder: 'Email address' },
      { id: 'type', type: 'select', label: 'Input type', options: ['text','email','password','number','url','tel','date','time','color','file','range'] },
      { id: 'placeholder', type: 'text', label: 'Placeholder text', placeholder: 'example@email.com' },
      { id: 'helpText', type: 'text', label: 'Help text (optional)', placeholder: "We'll never share your email." },
      { id: 'size', type: 'select', label: 'Size', options: ['default','sm','lg'] },
      { id: 'disabled', type: 'checkbox', label: 'Disabled' },
      { id: 'readonly', type: 'checkbox', label: 'Readonly' },
      { id: 'required', type: 'checkbox', label: 'Required' },
      { id: 'validFeedback', type: 'text', label: 'Valid feedback (optional)', placeholder: 'Looks good!' },
      { id: 'invalidFeedback', type: 'text', label: 'Invalid feedback (optional)', placeholder: 'Please provide a valid value.' },
      { id: 'floating', type: 'checkbox', label: 'Floating label' },
    ],
    generate(values) {
      const id = 'inp' + Date.now();
      const sizeClass = values.size !== 'default' ? ` form-control-${values.size}` : '';
      const disabled  = values.disabled  ? ' disabled' : '';
      const readonly  = values.readonly  ? ' readonly' : '';
      const required  = values.required  ? ' required' : '';
      const help      = values.helpText ? `\n<div id="${id}Help" class="form-text">${values.helpText}</div>` : '';
      const describedBy = values.helpText ? ` aria-describedby="${id}Help"` : '';
      const valid   = values.validFeedback   ? `\n<div class="valid-feedback">${values.validFeedback}</div>`   : '';
      const invalid = values.invalidFeedback ? `\n<div class="invalid-feedback">${values.invalidFeedback}</div>` : '';
      const input = `<input type="${values.type||'text'}" class="form-control${sizeClass}" id="${id}" placeholder="${values.placeholder||''}"${describedBy}${disabled}${readonly}${required}>`;
      if (values.floating) {
        return `<div class="form-floating">
  ${input}
  <label for="${id}">${values.label||'Label'}</label>
</div>`;
      }
      return `<div class="mb-3">
  <label for="${id}" class="form-label">${values.label||'Label'}</label>
  ${input}${help}${valid}${invalid}
</div>`;
    }
  },

  {
    id: 'form-select', name: 'Select', category: 'Forms',
    icon: 'bi-menu-down', desc: 'Dropdown select input.',
    staticFields: [
      { id: 'label', type: 'text', label: 'Label text', placeholder: 'Choose option' },
      { id: 'placeholder', type: 'text', label: 'Placeholder option', placeholder: 'Open this menu' },
      { id: 'options', type: 'textarea', label: 'Options (one per line)', placeholder: 'Option 1\nOption 2\nOption 3' },
      { id: 'size', type: 'select', label: 'Size', options: ['default','sm','lg'] },
      { id: 'multiple', type: 'checkbox', label: 'Multiple select' },
      { id: 'disabled', type: 'checkbox', label: 'Disabled' },
    ],
    generate(values) {
      const id = 'sel' + Date.now();
      const sizeClass = values.size !== 'default' ? ` form-select-${values.size}` : '';
      const multi     = values.multiple ? ' multiple' : '';
      const disabled  = values.disabled ? ' disabled' : '';
      const opts = (values.options || 'Option 1\nOption 2\nOption 3').split('\n')
        .map(o => `  <option>${o.trim()}</option>`).join('\n');
      const placeholder = values.placeholder ? `  <option value="" selected>${values.placeholder}</option>\n` : '';
      return `<div class="mb-3">
  <label for="${id}" class="form-label">${values.label||'Label'}</label>
  <select class="form-select${sizeClass}" id="${id}" aria-label="${values.label||'Select'}"${multi}${disabled}>
${placeholder}${opts}
  </select>
</div>`;
    }
  },

  {
    id: 'form-check', name: 'Checkbox / Radio', category: 'Forms',
    icon: 'bi-check2-square', desc: 'Checkbox and radio inputs.',
    staticFields: [
      { id: 'type', type: 'select', label: 'Input type', options: ['checkbox','radio','switch'] },
      { id: 'inline', type: 'checkbox', label: 'Inline layout' },
    ],
    itemConfig: { label: 'Option', addLabel: '+ Add Option', min: 1, max: 8, default: 3,
      fields: [
        { id: 'label', type: 'text', label: 'Label text', placeholder: 'Option 1' },
        { id: 'checked', type: 'checkbox', label: 'Checked by default' },
        { id: 'disabled', type: 'checkbox', label: 'Disabled' },
      ]
    },
    generate(values, items) {
      const groupName = 'grp' + Date.now();
      const inlineClass = values.inline ? ' form-check-inline' : '';
      const type = values.type === 'switch' ? 'checkbox' : values.type || 'checkbox';
      const switchClass = values.type === 'switch' ? ' form-switch' : '';
      return items.map((it, i) => {
        const id      = `${groupName}_${i}`;
        const checked = it.checked  ? ' checked'  : '';
        const dis     = it.disabled ? ' disabled' : '';
        const name    = type === 'radio' ? ` name="${groupName}"` : '';
        return `<div class="form-check${switchClass}${inlineClass}">
  <input class="form-check-input" type="${type}" id="${id}"${name}${checked}${dis}>
  <label class="form-check-label" for="${id}">${it.label||`Option ${i+1}`}</label>
</div>`;
      }).join('\n');
    }
  },

  {
    id: 'input-group', name: 'Input Group', category: 'Forms',
    icon: 'bi-layout-three-columns', desc: 'Extend form controls with text, buttons, or dropdowns.',
    staticFields: [
      { id: 'preText', type: 'text', label: 'Left addon text (optional)', placeholder: '@' },
      { id: 'inputPlaceholder', type: 'text', label: 'Input placeholder', placeholder: 'Username' },
      { id: 'inputType', type: 'select', label: 'Input type', options: ['text','email','password','number','url','search'] },
      { id: 'postText', type: 'text', label: 'Right addon text (optional)', placeholder: '.00' },
      { id: 'preBtnText', type: 'text', label: 'Left button text (optional)', placeholder: '' },
      { id: 'preBtnVariant', type: 'select', label: 'Left button variant', options: ['outline-secondary','outline-primary','primary','secondary','success','danger'] },
      { id: 'postBtnText', type: 'text', label: 'Right button text (optional)', placeholder: 'Go!' },
      { id: 'postBtnVariant', type: 'select', label: 'Right button variant', options: ['outline-secondary','outline-primary','primary','secondary','success','danger'] },
      { id: 'size', type: 'select', label: 'Size', options: ['default','sm','lg'] },
    ],
    generate(values) {
      const id = 'ig' + Date.now();
      const sizeClass = values.size !== 'default' ? ` input-group-${values.size}` : '';
      let parts = [];
      if (values.preText) parts.push(`  <span class="input-group-text" id="${id}Pre">${values.preText}</span>`);
      if (values.preBtnText) parts.push(`  <button class="btn btn-${values.preBtnVariant||'outline-secondary'}" type="button">${values.preBtnText}</button>`);
      parts.push(`  <input type="${values.inputType||'text'}" class="form-control" placeholder="${values.inputPlaceholder||''}" aria-label="${values.inputPlaceholder||'Input'}">`);
      if (values.postText) parts.push(`  <span class="input-group-text">${values.postText}</span>`);
      if (values.postBtnText) parts.push(`  <button class="btn btn-${values.postBtnVariant||'outline-secondary'}" type="button">${values.postBtnText}</button>`);
      return `<div class="input-group${sizeClass}">
${parts.join('\n')}
</div>`;
    }
  },
];

// ─── Icons state ──────────────────────────────────────────────────────────────
let ALL_ICONS   = [];
let ICONS_LOADED = false;
let iconCopyMode = 'font'; // 'font' or 'svg'
let iconSize     = 24;
let iconFilter   = '';

// ─── App State ────────────────────────────────────────────────────────────────
let selectedComp = null;
let itemValues   = []; // array of {fieldId: val} objects for itemConfig items
let outputMode   = 'preview'; // 'preview' | 'code'

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function syntaxHighlight(code) {
  return escapeHtml(code)
    .replace(/(&lt;\/?)([\w-]+)/g, (_, a, b) => `${a}<span class="ht">${b}</span>`)
    .replace(/\s([\w-:@]+)=/g, (_, a) => ` <span class="ha">${a}</span>=`)
    .replace(/="([^"]*)"/g, (_,v) => `="<span class="hv">${v}</span>"`);
}

function showToast(msg, isError = false) {
  const t = $('copy-toast');
  t.innerHTML = `<i class="bi bi-${isError ? 'x-circle' : 'check2'}"></i> ${msg}`;
  t.className = isError ? 'show error' : 'show';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Copied!');
  });
}

// ─── Component Sidebar ────────────────────────────────────────────────────────
function buildComponentList(filter = '') {
  const list = $('comp-list');
  const fl   = filter.toLowerCase();
  const groups = {};
  COMPONENTS.forEach(c => {
    if (fl && !c.name.toLowerCase().includes(fl) && !c.category.toLowerCase().includes(fl)) return;
    (groups[c.category] = groups[c.category] || []).push(c);
  });
  list.innerHTML = Object.entries(groups).map(([cat, comps]) => `
    <div class="group-label">${cat}</div>
    ${comps.map(c => `
      <div class="comp-item${selectedComp?.id === c.id ? ' active' : ''}" data-id="${c.id}">
        <i class="bi ${c.icon}"></i> ${c.name}
      </div>`).join('')}
  `).join('');
  list.querySelectorAll('.comp-item').forEach(el => {
    el.addEventListener('click', () => selectComponent(el.dataset.id));
  });
}

// ─── Component Selection ──────────────────────────────────────────────────────
function selectComponent(id) {
  selectedComp = COMPONENTS.find(c => c.id === id);
  if (!selectedComp) return;
  itemValues = selectedComp.itemConfig
    ? Array.from({ length: selectedComp.itemConfig.default }, () => ({}))
    : [];
  // Show output UI
  $('comp-empty-state').classList.add('hidden');
  document.querySelectorAll('.out-pane').forEach(p => p.classList.remove('active'));
  $(`${outputMode}-pane`).classList.add('active');
  buildComponentList();
  renderConfigPanel();
  regenerate();
}

// ─── Config Panel ─────────────────────────────────────────────────────────────
function renderConfigPanel() {
  const header = $('config-header');
  const scroll = $('config-scroll');
  const emptyState = $('comp-empty-state');

  if (!selectedComp) {
    header.innerHTML = '';
    scroll.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  header.innerHTML = `<h2><i class="bi ${selectedComp.icon} me-2"></i>${selectedComp.name}</h2><p>${selectedComp.desc}</p>`;
  scroll.innerHTML = '';

  // Static fields
  selectedComp.staticFields.forEach(f => {
    scroll.appendChild(buildField(f, 'static'));
  });

  // Dynamic item fields
  if (selectedComp.itemConfig) {
    const cfg = selectedComp.itemConfig;
    const container = document.createElement('div');
    container.id = 'item-fields-container';
    renderItemFields(container, cfg);
    scroll.appendChild(container);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-item';
    addBtn.innerHTML = `<i class="bi bi-plus-circle"></i> ${cfg.addLabel}`;
    addBtn.addEventListener('click', () => {
      if (itemValues.length < (cfg.max || 12)) {
        itemValues.push({});
        renderItemFields(container, cfg);
        regenerate();
      }
    });
    scroll.appendChild(addBtn);
  }
}

function renderItemFields(container, cfg) {
  container.innerHTML = '';
  itemValues.forEach((vals, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `<div class="item-card-title">${cfg.label} ${idx + 1}</div>`;
    cfg.fields.forEach(f => {
      card.appendChild(buildField(f, `item_${idx}`));
    });
    if (itemValues.length > (cfg.min || 1)) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'btn-remove-item';
      rmBtn.textContent = `Remove ${cfg.label} ${idx + 1}`;
      rmBtn.addEventListener('click', () => {
        itemValues.splice(idx, 1);
        renderItemFields(container, cfg);
        regenerate();
      });
      card.appendChild(rmBtn);
    }
    container.appendChild(card);
  });
}

function buildField(f, scope) {
  const wrap = document.createElement('div');
  const key  = `${scope}_${f.id}`;
  // Read current value
  const currentVal = scope.startsWith('item_')
    ? (itemValues[parseInt(scope.split('_')[1])][f.id] ?? (f.default !== undefined ? f.default : (f.type==='checkbox'?false:'')))
    : (getStaticValue(f.id) ?? (f.default !== undefined ? f.default : (f.type==='checkbox'?false:'')));

  if (f.type === 'checkbox') {
    wrap.className = 'check-field';
    const checked = currentVal ? ' checked' : '';
    wrap.innerHTML = `<input type="checkbox" id="${key}"${checked}><span>${f.label}</span>`;
    wrap.querySelector('input').addEventListener('change', e => {
      saveFieldValue(scope, f.id, e.target.checked);
      regenerate();
    });
  } else if (f.type === 'range') {
    wrap.className = 'field';
    const val = currentVal !== '' ? currentVal : (f.default || f.min || 0);
    wrap.innerHTML = `<label>${f.label}</label>
      <div class="range-row">
        <input type="range" id="${key}" min="${f.min||0}" max="${f.max||100}" value="${val}">
        <span class="val" id="${key}_val">${val}</span>
      </div>`;
    const input = wrap.querySelector('input');
    const valEl = wrap.querySelector('.val');
    input.addEventListener('input', e => {
      valEl.textContent = e.target.value;
      saveFieldValue(scope, f.id, e.target.value);
      regenerate();
    });
  } else if (f.type === 'select') {
    wrap.className = 'field';
    const opts = (f.options || []).map(o => `<option value="${o}"${currentVal===o?' selected':''}>${o}</option>`).join('');
    wrap.innerHTML = `<label>${f.label}</label><select id="${key}">${opts}</select>`;
    wrap.querySelector('select').addEventListener('change', e => {
      saveFieldValue(scope, f.id, e.target.value);
      regenerate();
    });
  } else if (f.type === 'textarea') {
    wrap.className = 'field';
    wrap.innerHTML = `<label>${f.label}</label><textarea id="${key}" placeholder="${f.placeholder||''}">${currentVal||''}</textarea>`;
    wrap.querySelector('textarea').addEventListener('input', e => {
      saveFieldValue(scope, f.id, e.target.value);
      regenerate();
    });
  } else {
    wrap.className = 'field';
    wrap.innerHTML = `<label>${f.label}</label><input type="${f.type||'text'}" id="${key}" placeholder="${f.placeholder||''}" value="${currentVal||''}">`;
    wrap.querySelector('input').addEventListener('input', e => {
      saveFieldValue(scope, f.id, e.target.value);
      regenerate();
    });
  }
  return wrap;
}

// Static field value store (simple map)
const staticValues = {};
function getStaticValue(id) { return staticValues[id]; }
function saveFieldValue(scope, fieldId, val) {
  if (scope === 'static') {
    staticValues[fieldId] = val;
  } else {
    const idx = parseInt(scope.split('_')[1]);
    itemValues[idx][fieldId] = val;
  }
}

// ─── Code Generation ──────────────────────────────────────────────────────────
function collectStaticValues() {
  const vals = {};
  if (!selectedComp) return vals;
  selectedComp.staticFields.forEach(f => {
    const el = document.getElementById(`static_${f.id}`);
    if (!el) return;
    vals[f.id] = f.type === 'checkbox' ? el.checked : el.value;
  });
  return vals;
}

function collectItemValues() {
  if (!selectedComp?.itemConfig) return [];
  return itemValues.map((_, idx) => {
    const obj = {};
    selectedComp.itemConfig.fields.forEach(f => {
      const el = document.getElementById(`item_${idx}_${f.id}`);
      if (!el) return;
      obj[f.id] = f.type === 'checkbox' ? el.checked : el.value;
    });
    return obj;
  });
}

function generateCode() {
  if (!selectedComp) return '';
  const sv = collectStaticValues();
  const iv = collectItemValues();
  return selectedComp.generate(sv, iv);
}

function regenerate() {
  const code = generateCode();
  // Update code pane
  const codePre = $('code-output');
  codePre.innerHTML = syntaxHighlight(code);
  // Update preview if active
  if (outputMode === 'preview') updatePreview(code);
}

function updatePreview(code) {
  const iframe = $('preview-iframe');
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
  <style>
    body { padding: 24px; background: #fff; font-family: system-ui, sans-serif; }
    img { max-width: 100%; }
    .navbar { margin: -24px -24px 24px; }
  </style>
</head>
<body>
${code}
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"><\/script>
</body>
</html>`);
  doc.close();
  // Auto-resize iframe
  iframe.onload = () => {
    try {
      const h = iframe.contentDocument.body.scrollHeight;
      iframe.style.height = Math.max(200, h + 40) + 'px';
    } catch(e){}
  };
}

// ─── Icons Loading ────────────────────────────────────────────────────────────
async function loadBootstrapIcons() {
  $('icons-loader').classList.remove('hidden');
  $('icons-grid').innerHTML = '';
  try {
    const resp = await fetch('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css');
    const css  = await resp.text();
    const matches = [...css.matchAll(/\.bi-([\w-]+)::before/g)];
    ALL_ICONS = [...new Set(matches.map(m => m[1]))].sort();
    ICONS_LOADED = true;
    $('icons-loader').classList.add('hidden');
    renderIconsGrid();
  } catch(e) {
    $('icons-loader').innerHTML = '<p>Failed to load icons. Check your connection.</p>';
  }
}

function renderIconsGrid() {
  const grid = $('icons-grid');
  const fl   = iconFilter.toLowerCase();
  const filtered = fl ? ALL_ICONS.filter(n => n.includes(fl)) : ALL_ICONS;
  $('icons-count').innerHTML = `<span>${filtered.length}</span> of ${ALL_ICONS.length} icons`;

  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  filtered.forEach(name => {
    const cell = document.createElement('div');
    cell.className = 'icon-cell';
    cell.innerHTML = `<i class="bi bi-${name}" style="font-size:${iconSize}px"></i><span class="icon-lbl">${name}</span>`;
    cell.addEventListener('click', () => copyIcon(name, cell));
    frag.appendChild(cell);
  });
  grid.appendChild(frag);
}

function copyIcon(name, cell) {
  const code = iconCopyMode === 'font'
    ? `<i class="bi bi-${name}"></i>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" class="bi bi-${name}" viewBox="0 0 16 16">\n  <!-- SVG path here: https://icons.getbootstrap.com/icons/${name}/ -->\n</svg>`;
  copyText(code);
  cell.classList.add('copied');
  setTimeout(() => cell.classList.remove('copied'), 700);
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchMainTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#sidebar-nav .nav-btn').forEach(b => b.classList.remove('active'));
  $(tab + '-panel').classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'icons' && !ICONS_LOADED) loadBootstrapIcons();
}

function switchOutputTab(tab) {
  outputMode = tab;
  document.querySelectorAll('.out-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.out-pane').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-out="${tab}"]`).classList.add('active');
  $(tab + '-pane').classList.add('active');
  if (tab === 'preview') {
    const code = $('code-output').textContent; // raw, not highlighted
    updatePreview(generateCode());
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.out-pane').forEach(p => p.classList.remove('active'));
  $('comp-empty-state').classList.remove('hidden');
  buildComponentList();

  // Sidebar tab buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMainTab(btn.dataset.tab));
  });

  // Component search
  $('comp-search').addEventListener('input', e => buildComponentList(e.target.value));

  // Output tabs
  document.querySelectorAll('.out-tab').forEach(btn => {
    btn.addEventListener('click', () => switchOutputTab(btn.dataset.out));
  });

  // Copy code button
  $('copy-code-btn').addEventListener('click', () => {
    const code = generateCode();
    if (!code) return;
    copyText(code);
    const btn = $('copy-code-btn');
    btn.classList.add('ok');
    btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
    setTimeout(() => {
      btn.classList.remove('ok');
      btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy HTML';
    }, 2000);
  });

  // Icons – search
  $('icon-search').addEventListener('input', e => {
    iconFilter = e.target.value;
    if (ICONS_LOADED) renderIconsGrid();
  });

  // Icons – copy mode
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      iconCopyMode = btn.dataset.mode;
    });
  });

  // Icons – size
  $('icon-size-sel').addEventListener('change', e => {
    iconSize = parseInt(e.target.value);
    if (ICONS_LOADED) {
      document.querySelectorAll('.icon-cell i').forEach(i => i.style.fontSize = iconSize + 'px');
    }
  });
});
