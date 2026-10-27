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
    try { localStorage.setItem('jl-theme', JSON.stringify({ dark, colors })); } catch (_) {}
  }

  function applyTheme() {
    document.body.classList.toggle('jl-dark', dark);
    const active = colors[dark ? 'dark' : 'light'];
    for (const [key, color] of Object.entries(active)) {
      root.style.setProperty('--jl-' + key, color);
    }
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

  const bar = node('div', { className: 'jl-bar' });
  const menuButton = node('button', { type: 'button', ariaLabel: 'Open tool navigation' }, '☰');
  const brand = node('a', { href: base }, 'JL Toolkit');
  const search = node('input', {
    className: 'jl-toolbar-search',
    placeholder: 'Search tools…',
    ariaLabel: 'Search JL Toolkit'
  });
  const themeButton = node('button', { type: 'button', ariaLabel: 'Toggle dark mode' }, '◐');
  bar.append(menuButton, brand, search, themeButton);
  document.body.prepend(bar);

  const backdrop = node('div', { className: 'jl-shade' });
  const drawer = node('aside', { className: 'jl-menu' });
  drawer.setAttribute('aria-label', 'Tool navigation and appearance');
  const closeButton = node('button', { type: 'button' }, '✕ Close');
  const navLinks = node('nav', { className: 'jl-search-results' });
  const appearance = node('div', { className: 'jl-settings' });
  drawer.append(closeButton, node('h2', {}, 'Tools'), navLinks, node('h3', {}, 'Appearance'), appearance);
  document.body.append(backdrop, drawer);

  function renderSearch(query = '') {
    navLinks.replaceChildren();
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = tools.filter(tool =>
      words.every(word => (tool.name + ' ' + tool.keywords).toLocaleLowerCase().includes(word))
    );
    for (const tool of matches) navLinks.append(node('a', { href: base + tool.path }, tool.name));
    if (!matches.length) navLinks.append(node('p', {}, 'No tools match that search.'));
  }

  function openMenu() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    menuButton.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.onclick = openMenu;
  closeButton.onclick = closeMenu;
  backdrop.onclick = closeMenu;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  search.oninput = () => { renderSearch(search.value); openMenu(); };
  search.onkeydown = e => {
    if (e.key === 'Enter') {
      const link = navLinks.querySelector('a');
      if (link) location.href = link.href;
    }
  };

  function renderAppearance() {
    appearance.replaceChildren();
    const toggleLabel = node('label');
    const darkInput = node('input');
    darkInput.type = 'checkbox';
    darkInput.checked = dark;
    darkInput.onchange = () => { dark = darkInput.checked; applyTheme(); renderAppearance(); };
    toggleLabel.append(node('span', {}, 'Dark mode'), darkInput);
    appearance.append(toggleLabel);

    for (const [key, label] of [
      ['top', 'Top bar'], ['menu', 'Menu'], ['main', 'Main page'], ['accent', 'Accent']
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
  }

  themeButton.onclick = () => { dark = !dark; applyTheme(); renderAppearance(); };
  renderSearch();
  renderAppearance();
  applyTheme();
})();