// Shared defaults. A viewer may override these before pdf-html-viewer.js runs.
window.PDF_HTML_VIEWER_CONFIG = {
  zoomDebounceMs: 50,
  wheelZoomSensitivity: 0.002,
  allowZoomOutBeyondFit: false,
  ...window.PDF_HTML_VIEWER_CONFIG,
};
