# JL Toolkit — Architecture and maintenance

JL Toolkit is a **static browser application**, deployed from GitHub Pages. It currently has **no server-side backend** or database. Uploaded files are processed in browser memory by JavaScript and third-party libraries; the shared shell stores visual preferences locally.

## Directory map

```text
/
├── index.html                    Landing page / Quick Launch
├── favicon.svg                   Shared brand icon
├── assets/
│   ├── jl-shell.css              Shared design tokens, navigation and responsive CSS
│   └── jl-shell.js               Search registry, menu and persisted color settings
├── templates/                    Downloadable CSV templates
└── tools/
    ├── qr-barcode/
    ├── pdf-toolkit/
    ├── image-toolkit/
    ├── label-designer/
    │   └── presets/              Versioned editable label configurations
    └── csv-vcard/
```

Each tool directory contains:
- `index.html`: semantic markup, tool-specific CSS and external library references.
- `app.js`: application state, event handlers, data transformation and downloads.

## How to maintain a tool

1. Make changes in `tools/<tool-name>/app.js` for behavior, and `index.html` for form controls and preview layout.
2. Modify `assets/jl-shell.css` for common spacing, color contrast, panels and breakpoints. Keep tool-specific styles near that tool.
3. The shared navigation registry is `tools` in `assets/jl-shell.js`. Add new tools there *and* to homepage Quick Launch.
4. Preserve deep links at `/tools/<tool-name>/`; GitHub Pages serves each folder's `index.html`.
5. Exported label configurations are JSON; increment `version` if introducing incompatible layout schemas.
6. Check desktop and iPhone layouts, dark and light modes, file conversions, and export functionality before releasing.

## UI behavior

At desktop widths, tools put form controls to the left of the preview/workspace. Where content is long, the left panel can scroll independently; on mobile the sections stack. The global theme persists separately for light and dark modes with `localStorage` key `jl-theme`.

## Privacy, compatibility and limits

- This is frontend-only hosting: there is **no backend API** or server-side persistence.
- Some third-party libraries are loaded from CDNs and require network access.
- Large PDFs, images, or contact lists may be constrained by device memory.
- Word/Excel/PowerPoint conversion is simplified, not Office-equivalent.
- PDF-to-Markdown does not include scanned-image OCR.
- Label thermal print preview is an approximation, not calibrated printer emulation.

## QA checklist

- [ ] Open homepage and every deep link from GitHub Pages.
- [ ] Verify navigation/search and light/dark contrast.
- [ ] Verify label preset loads and can export/import JSON.
- [ ] Verify CSV contacts edit, add, delete, CSV export, and vCard export.
- [ ] Verify PDF workspace merge/reorder/watermark and output preview.
- [ ] Verify image/QR output previews and downloads.
- [ ] Check widths around 375px, 768px and 1440px.
