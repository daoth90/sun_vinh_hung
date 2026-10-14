// Shared defaults. A viewer may override these before pdf-html-viewer.js runs.
window.PDF_HTML_VIEWER_CONFIG = {
  zoomDebounceMs: 50,
  wheelZoomSensitivity: 0.002,
  allowZoomOutBeyondFit: false,
  ...window.PDF_HTML_VIEWER_CONFIG,
};

// Site-wide Google Maps settings. Per-document placement belongs in documents.json.
window.GOOGLE_MAPS_VIEWER_CONFIG = {
  apiKey: '',
  version: 'quarterly',
  language: 'vi',
  region: 'VN',
  minZoom: 10,
  maxZoom: 22,
  mapTypeId: 'roadmap',
  mapOpacity: 1,
  documentOpacity: 0.6,
  ...window.GOOGLE_MAPS_VIEWER_CONFIG,
};
