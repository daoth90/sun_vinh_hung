---
name: pdf-html-viewer
description: Create or update a zoom viewer for PDF-parsed HTML identified by filename, explicit path or file mention, preserving its source and registering it in this repository's catalog.
---

# PDF HTML Viewer

Accept a filename, an explicit path or an `@` file mention, for example:

- `skills/pdf-html-viewer/ tạo viewer cho file qhsdd-vinhhung-03.html`
- `skills/pdf-html-viewer/ tạo viewer cho file /absolute/path/qhsdd-vinhhung-03.html`
- `skills/pdf-html-viewer/ tạo viewer cho @qhsdd-vinhhung-03.html` (using the actual file reference supplied by the interface).

- Resolve the source according to the supplied input: a bare filename is looked up in `html/original/` relative to the repository root; a full path is used exactly as supplied; an explicit relative path is resolved from the repository root; an `@` mention uses the referenced file's resolved path or provided attachment, not its display label. Do not replace an explicit path or mention with a same-named file from `html/original/`. If the source is missing or the mention cannot be resolved, report that exact path or ask for the missing reference; never treat an existing viewer as the source.
- Derive the output filename from the resolved source's basename, preserving its extension without appending another `.html`. Inspect its linked images, fonts, styles and page dimensions. If the source is outside `html/original/`, copy it and its required resources into the canonical source location before creating the viewer, preserving bytes and relative asset resolution. Keep the supplied source in place; do not reference a local absolute filesystem path from a hosted iframe. If a different file or resource already occupies a destination, resolve the conflict with the user before overwriting it.
- Use `pdf/<filename>.pdf` for the PDF, `html/original/<filename>.html` for the parsed source and `html/<filename>.html` for the viewer. Keep the same filename; do not add original/viewer suffixes or per-document folders.
- Preserve source bytes and relative asset paths. Copy companion resources into the same relative layout; check references before moving a source HTML. Do not fabricate a PDF when none was supplied.
- Create or update `html/<filename>.html` using `html/demo.html` as the wrapper template (when updating the demo itself, use its existing wrapper). If the demo is absent, use an existing viewer in `html/`. Set iframe `src` to `original/<filename>.html`, title and `data-width` to the source dimensions. Find the optional PDF at `pdf/<filename>.pdf` and add its link only when present. Reference shared CSS, `viewer-config.js` and viewer JS in `assets/`. Do not show a source-HTML link on the viewer or catalog.
- Keep the iframe sandbox (`allow-same-origin`, without scripts). If the parser requires scripts, inspect them and prefer static rendering; explain rendering limitations before changing the sandbox.
- Label the optional PDF link `Xem PDF`. The catalog shows `Xem HTML` only for entries with a viewer and `Xem PDF` only for entries with a PDF.
- For pdf2htmlEX, set `data-layout="pdf2htmlEX"` on the iframe so the shared script exposes static pages and disables the internal scrolling container.
- Reuse the shared map-style interactions: wheel zoom anchors at the mouse, pinch zoom anchors at the two-finger midpoint, and left-mouse/one-finger drag pans. Only the slider anchors zoom at the viewport center. The iframe has pointer events disabled so the outer viewport handles gestures; document text selection and embedded links are not interactive in this mode.
- Keep the slider (absolute minimum 1%, step 0.1%) and live percentage. Shared config `allowZoomOutBeyondFit` defaults to false: slider, wheel and pinch cannot zoom below the reset fit-width percentage. When true, allow zoom down to the absolute minimum. Recompute the floor on viewport resize. Slider delay and wheel sensitivity are configured in `assets/js/viewer-config.js`; preserve its current settings. Reset cancels pending updates and fits width; there is no separate fit button. Every page load or refresh starts at fit-width; do not persist or restore zoom/fit state.
- Upsert by the supplied `id`, or the filename stem when no ID is supplied, in `metadata/documents.json`, preserving existing title/group/description/scale unless the request provides new information. Use `title`, `group`, repository-relative `html`, optional `pdf`, `description`, and numeric `scale` (default 0 for new entries). Scale is the conversion scale label only: the catalog shows `Scale: <value>x` for positive values and hides it for 0. It does not change the viewer's fit-width zoom. Do not add `notes` or `originalHtml`, and do not duplicate entries when regenerating a viewer. Mark illustrative content with `demo: true`. Record source/date/status in description when provided; do not infer approval status.
- Serve over HTTP. Verify source bytes, assets, and full-document scrolling at 1%, 100%, 200% and fit-width on desktop/mobile. Check slider center, wheel mouse anchor, pinch midpoint, mouse/touch drag, debounce, reset cancellation and fit-width after reload. Report document-specific limitations and distinguish emulated touch checks from physical-device verification.

Scope changes to the requested document, its catalog entry and demonstrated shared-viewer fixes.
