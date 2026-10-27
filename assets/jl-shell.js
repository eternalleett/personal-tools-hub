/*
 * JL Toolkit shared shell
 * -----------------------
 * Responsibilities:
 *   - Persistent light/dark theme and color customization
 *   - Searchable tool registry
 *   - Responsive hamburger menu and homepage links
 *
 * Each toolkit's business logic is maintained in /tools/<name>/app.js.
 */
(() => {
  'use strict';

  const scriptUrl = new URL(document.currentScript.src);
  const base = scriptUrl.href.replace(/assets\/jl-shell\.js(?:\?.*)?$/, '');
  const root = document.documentElement;

  // Search keywords include alternate terminology used in everyday workflows.
  const tools = [
    { name: 'QR & Barcode Generator', path: 'tools/qr-barcode/', keywords: 'qr barcode link url code128 batch 條碼 二維碼' },
    { name: 'PDF Toolkit', path: 'tools/pdf-toolkit/', keywords: 'pdf merge split reorder watermark word excel ppt markdown 合併 浮水印' },
    { name: 'Image Toolkit', path: 'tools/image-toolkit/', keywords: 'image photo jpg png webp avif bmp ico conversion resize compression 圖片' },
    { name: 'Label Designer', path: 'tools/label-designer/', keywords: 'label print barcode qr printer dpi page size stickers 標籤' },
    { name: 'CSV to vCard', path: 'tools/csv-vcard/', keywords: 'csv contact phone vcf iphone address book import export 聯絡人 通訊錄' }
  ];

  const palettes = {
    light: { top: '#14213b', menu: '#1d2d48', main: '#f4f6fb', accent: '#4a5ed5' },
    dark: { top: '#080e1d', menu: '#111c32', main: '#101827', accent: '#8198ff' }
  };

  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('jl-theme') || '{}'); } catch (_) {}
  let dark = !!settings.dark;
  let fontChoice = settings.font || 'system';
  let colors = settings.colors || { light: { ...palettes.light }, dark: { ...palettes.dark } };

  // Migrate preferences saved by the first version of JL Toolkit.
  if (!settings.colors) {
    const saved = ['top', 'menu', 'main', 'accent'].filter(k => settings[k]);
    if (saved.length) for (const key of saved) colors.light[key] = settings[key];
  }
  for (const mode of ['light', 'dark']) {
    colors[mode] = { ...palettes[mode], ...(colors[mode] || {}) };
  }

  function saveSettings() {
    try { localStorage.setItem('jl-theme', JSON.stringify({ dark, colors, font: fontChoice })); } catch (_) {}
  }

  function applyTheme() {
    document.body.classList.toggle('jl-dark', dark);
    document.documentElement.classList.toggle('jl-dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    const active = colors[dark ? 'dark' : 'light'];
    for (const [key, color] of Object.entries(active)) {
      root.style.setProperty('--jl-' + key, color);
    }
    const fonts = {
      system: 'system-ui,-apple-system,"Segoe UI",sans-serif',
      nunito: '"Nunito",system-ui,sans-serif',
      quicksand: '"Quicksand",system-ui,sans-serif',
      rubik: '"Rubik",system-ui,sans-serif',
      atkinson: '"Atkinson Hyperlegible",system-ui,sans-serif'
    };
    root.style.setProperty('--jl-font',fonts[fontChoice]||fonts.system);
    saveSettings();
  }

  function node(tag, attrs = {}, text = '') {
    const element = document.createElement(tag);
    Object.assign(element, attrs);
    if (text) element.textContent = text;
    return element;
  }

  // Replace the legacy per-page header with a single navigation component.
  const legacyHeader = document.querySelector('header');
  if (legacyHeader) legacyHeader.style.display = 'none';


  // Sticky, responsive header. Search results never open the navigation drawer.
  const bar = node('div', { className: 'jl-bar' });
  const menuButton = node('button', { type: 'button', ariaLabel: 'Open navigation' }, '☰');
  const brand = node('a', { href: base, className: 'jl-brand' }, 'JL Toolkit');
  const center = node('div', { className: 'jl-bar-center' });
  const search = node('input', {
    className: 'jl-toolbar-search', placeholder: 'Search tools…',
    ariaLabel: 'Search JL Toolkit', autocomplete: 'off'
  });
  const suggestions = node('div', { className: 'jl-suggestions', role: 'listbox' });
  center.append(search, suggestions);
  const actions = node('div', { className: 'jl-bar-actions' });
  const themeButton = node('button', { type: 'button', ariaLabel: 'Toggle dark mode' }, '◐');
  const customizeButton = node('button', { type: 'button', ariaLabel: 'Customize theme colors' }, '⚙');
  actions.append(themeButton, customizeButton);
  bar.append(menuButton, brand, center, actions);
  document.body.prepend(bar);

  const backdrop = node('div', { className: 'jl-shade' });
  const drawer = node('aside', { className: 'jl-menu' });
  drawer.setAttribute('aria-label', 'Tool navigation');
  const closeButton = node('button', { type: 'button' }, '✕ Close');
  const navLinks = node('nav', { className: 'jl-search-results' });
  drawer.append(closeButton, node('h2', {}, 'Tools'), navLinks);
  const appearance = node('div', { className: 'jl-settings jl-theme-popover' });
  appearance.hidden = true;
  document.body.append(backdrop, drawer, appearance);

  function matchedTools(query = '') {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return tools.filter(tool => words.every(word =>
      (tool.name + ' ' + tool.keywords).toLocaleLowerCase().includes(word)));
  }
  function renderSearch(query = '') {
    navLinks.replaceChildren();
    for (const tool of matchedTools(query)) {
      navLinks.append(node('a', { href: base + tool.path }, tool.name));
    }
  }
  function renderSuggestions() {
    suggestions.replaceChildren();
    const query = search.value.trim();
    if (!query) { suggestions.classList.remove('open'); return; }
    const matched = matchedTools(query);
    for (const tool of matched) suggestions.append(node('a', {
      href: base + tool.path, role: 'option'
    }, tool.name));
    if (!matched.length) suggestions.append(node('p', {}, 'No matching tools'));
    suggestions.classList.add('open');
  }
  function openMenu() {
    drawer.classList.add('open'); backdrop.classList.add('open');
    menuButton.setAttribute('aria-expanded', 'true');
    suggestions.classList.remove('open');
    appearance.hidden = true;
  }
  function closeMenu() {
    drawer.classList.remove('open'); backdrop.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.onclick = openMenu;
  closeButton.onclick = closeMenu;
  backdrop.onclick = closeMenu;
  search.oninput = renderSuggestions;
  search.onfocus = renderSuggestions;
  search.onkeydown = e => {
    if (e.key === 'Enter') {
      const link = suggestions.querySelector('a');
      if (link) location.href = link.href;
    }
    if (e.key === 'Escape') suggestions.classList.remove('open');
  };
  customizeButton.onclick = () => {
    appearance.hidden = !appearance.hidden;
    suggestions.classList.remove('open');
    closeMenu();
  };
  document.addEventListener('pointerdown', e => {
    if (!center.contains(e.target)) suggestions.classList.remove('open');
    if (!appearance.contains(e.target) && !customizeButton.contains(e.target)) appearance.hidden = true;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeMenu(); appearance.hidden = true; suggestions.classList.remove('open'); }
  });
  // Full palettes include readable typography, surfaces, borders, and controls.
  const themePresets = {
    original: { top:'#14213b',menu:'#1d2d48',main:'#f4f6fb',surface:'#ffffff',ink:'#1b2d46',muted:'#64748b',border:'#dce4ef',accent:'#4a5ed5',link:'#2752c4' },
    reference: { top:'#182b36',menu:'#223c46',main:'#eff3ed',surface:'#ffffff',ink:'#223c41',muted:'#526c70',border:'#cbd8cf',accent:'#538b81',link:'#276a68' },
    midnight: { top:'#0d1424',menu:'#17233b',main:'#101827',surface:'#202d43',ink:'#edf4ff',muted:'#b0c4db',border:'#394c69',accent:'#8ca8ff',link:'#b9dcff' },
    lavender: { top:'#2c2345',menu:'#3b3157',main:'#f6f2fc',surface:'#ffffff',ink:'#332c45',muted:'#6e6382',border:'#e0d8ed',accent:'#8067ba',link:'#6a50ab' }
  };
  function applyPreset(name) {
    const palette=themePresets[name];
    if (!palette) return;
    colors[dark?'dark':'light']={...colors[dark?'dark':'light'],...palette};
    applyTheme();renderAppearance();
  }
  function renderAppearance() {
    appearance.replaceChildren();
    const presetsRow=node('label');
    const presetSelect=node('select');
    presetSelect.setAttribute('aria-label','Complete website color palette');
    for(const [value,title] of [['','Choose palette…'],['original','Original blue'],['reference','Reference palette · natural teal'],['midnight','Midnight'],['lavender','Soft lavender']])presetSelect.add(new Option(title,value));
    presetSelect.onchange=()=>{if(presetSelect.value)applyPreset(presetSelect.value)};
    presetsRow.append(node('span',{},'Color palette'),presetSelect);
    appearance.append(presetsRow);
    const toggleLabel = node('label');
    const darkInput = node('input');
    darkInput.type = 'checkbox';
    darkInput.checked = dark;
    darkInput.onchange = () => { dark = darkInput.checked; applyTheme(); renderAppearance(); };
    toggleLabel.append(node('span', {}, 'Dark mode'), darkInput);
    appearance.append(toggleLabel);

    for (const [key, label] of [
      ['top', 'Top bar'], ['menu', 'Menu'], ['main', 'Main page'], ['surface', 'Cards'], ['ink', 'Main text'], ['muted', 'Secondary text'], ['border', 'Borders'], ['accent', 'Buttons'], ['link', 'Links']
    ]) {
      const row = node('label'), picker = node('input');
      picker.type = 'color';
      picker.value = colors[dark ? 'dark' : 'light'][key];
      picker.oninput = () => {
        colors[dark ? 'dark' : 'light'][key] = picker.value;
        applyTheme();
      };
      row.append(node('span', {}, label), picker);
      appearance.append(row);
    }
    const row = node('label');
    const selector = node('select');
    selector.setAttribute('aria-label','Website font');
    for (const [value, label] of [
      ['system','System (default)'],['nunito','Nunito — rounded'],
      ['quicksand','Quicksand — soft rounded'],['rubik','Rubik — modern rounded'],
      ['atkinson','Atkinson — readable']
    ]) selector.add(new Option(label,value));
    selector.value = fontChoice;
    selector.onchange = () => { fontChoice=selector.value; applyTheme(); };
    row.append(node('span',{},'Website font'),selector);
    appearance.append(row);
  }

  themeButton.onclick = () => { dark = !dark; applyTheme(); renderAppearance(); };
  renderSearch();
  renderAppearance();
  applyTheme();
})();