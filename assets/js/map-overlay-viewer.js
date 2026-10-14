(() => {
  const byId = id => document.getElementById(id);
  const geometry = window.MAP_OVERLAY_GEOMETRY;
  const site = window.GOOGLE_MAPS_VIEWER_CONFIG;
  const documentId = document.body.dataset.documentId;
  const storageKey = `planning-map:${documentId}`;
  const status = byId('map-status');
  const sheet = byId('planning-sheet');
  let initial;
  let settings;
  let map;
  let overlay;
  let dimensions;
  let framePromise;
  let apiPromise;
  let authError;
  let busy = false;

  function report(message) { status.textContent = authError ? authError.message : message; }
  function placementNotice() {
    report(settings.calibrated ? '' : 'Chưa căn tọa độ: vị trí và kích thước quy hoạch đang là giá trị thử.');
  }

  function validate(config) {
    geometry.pageCorners(config, 1, 1);
    if (![config.mapOpacity, config.documentOpacity].every(value => Number.isFinite(value) && value >= 0 && value <= 1) ||
        !Number.isFinite(config.zoom) || config.zoom < site.minZoom || config.zoom > site.maxZoom ||
        !['roadmap', 'satellite', 'hybrid', 'terrain'].includes(config.mapTypeId)) {
      throw new Error('Cấu hình lớp bản đồ không hợp lệ.');
    }
    return config;
  }

  function opacity() {
    // Fade only the map content; the attribution strip remains readable.
    byId('map-fade').style.opacity = 1 - settings.mapOpacity;
    sheet.style.opacity = settings.documentOpacity;
    byId('map-opacity').value = settings.mapOpacity;
    byId('planning-opacity').value = settings.documentOpacity;
    byId('map-opacity-value').value = `${Math.round(settings.mapOpacity * 100)}%`;
    byId('planning-opacity-value').value = `${Math.round(settings.documentOpacity * 100)}%`;
  }

  function fillControls() {
    byId('alignment-lat').value = settings.center.lat;
    byId('alignment-lng').value = settings.center.lng;
    byId('alignment-width').value = settings.widthMeters;
    byId('alignment-rotation').value = settings.rotationDegrees;
    byId('map-type').value = settings.mapTypeId;
    opacity();
  }

  function readAlignment() {
    const form = byId('alignment-form');
    if (!form.reportValidity()) return false;
    settings = validate({ ...settings,
      center: { lat: byId('alignment-lat').valueAsNumber, lng: byId('alignment-lng').valueAsNumber },
      widthMeters: byId('alignment-width').valueAsNumber,
      rotationDegrees: byId('alignment-rotation').valueAsNumber,
      calibrated: false,
    });
    overlay?.draw();
    placementNotice();
    return true;
  }

  function corners() {
    return geometry.pageCorners(settings, dimensions.width, dimensions.height);
  }

  function fitMap() {
    if (!map || !dimensions) return;
    const bounds = new google.maps.LatLngBounds();
    corners().forEach(corner => bounds.extend(corner));
    map.fitBounds(bounds, 40);
  }

  function loadFrame() {
    if (framePromise) return framePromise;
    framePromise = new Promise((resolve, reject) => {
      const source = byId('document-frame');
      const frame = document.createElement('iframe');
      frame.id = 'planning-frame';
      frame.title = source.title;
      frame.setAttribute('sandbox', 'allow-same-origin');
      frame.style.width = `${source.dataset.width}px`;
      frame.style.height = '1px';
      const timeout = setTimeout(() => reject(new Error('HTML quy hoạch tải quá lâu. Tải lại trang để thử lại.')), 30000);
      frame.addEventListener('load', async () => {
        try {
          const doc = frame.contentDocument;
          if (!doc?.body) throw new Error('Không đọc được HTML quy hoạch cùng origin.');
          const style = doc.createElement('style');
          style.textContent = `
            html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: hidden !important; }
            #sidebar, .loading-indicator { display: none !important; }
            #page-container { position: static !important; overflow: visible !important; background: transparent !important; }
            .pf { margin: 0 !important; box-shadow: none !important; }
            .pc { display: block !important; }
          `;
          doc.head.append(style);
          await doc.fonts.ready;
          await Promise.all([...doc.images].map(image => image.decode().catch(() => {
            throw new Error('Không tải được ảnh trong HTML quy hoạch.');
          })));
          const pages = doc.querySelectorAll('.pf');
          if (pages.length !== 1) throw new Error('Chế độ bản đồ hiện hỗ trợ HTML quy hoạch một trang.');
          dimensions = { width: pages[0].offsetWidth, height: pages[0].offsetHeight };
          geometry.pageCorners(settings, dimensions.width, dimensions.height);
          frame.style.width = `${dimensions.width}px`;
          frame.style.height = `${dimensions.height}px`;
          sheet.style.width = frame.style.width;
          sheet.style.height = frame.style.height;
          resolve();
        } catch (error) { reject(error); }
        finally { clearTimeout(timeout); }
      }, { once: true });
      frame.src = source.getAttribute('src');
      sheet.append(frame);
    });
    return framePromise;
  }

  function loadApi(key) {
    if (window.google?.maps?.Map) return Promise.resolve();
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let timeout;
      function fail(message) {
        clearTimeout(timeout);
        script.remove();
        delete window.planningMapApiReady;
        apiPromise = undefined;
        reject(new Error(message));
      }
      window.planningMapApiReady = () => { clearTimeout(timeout); delete window.planningMapApiReady; resolve(); };
      window.gm_authFailure = () => {
        const message = 'Google từ chối API key. Kiểm tra billing, Maps JavaScript API và HTTP referrer, rồi tải lại trang.';
        authError = new Error(message);
        byId('map-viewport').dataset.ready = 'false';
        byId('map-navigation').hidden = true;
        byId('map-fit').disabled = true;
        byId('alignment-center').disabled = true;
        sheet.hidden = true;
        byId('map-key-form').hidden = false;
        report(message);
        fail(message);
      };
      const params = new URLSearchParams({ key, v: site.version, language: site.language,
        region: site.region, loading: 'async', callback: 'planningMapApiReady' });
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;
      script.onerror = () => fail('Không tải được Google Maps. Kiểm tra kết nối và thử lại.');
      timeout = setTimeout(() => fail('Google Maps tải quá lâu. Tải lại trang để thử lại.'), 20000);
      document.head.append(script);
    });
    return apiPromise;
  }

  async function startMap(key) {
    if (authError) { report(authError.message); return; }
    if (map || busy) return;
    busy = true;
    const submit = byId('map-key-form').querySelector('button');
    submit.disabled = true;
    report('Đang tải Google Maps và quy hoạch…');
    try {
      await Promise.all([loadFrame(), loadApi(key)]);
      // Authentication may fail after the loader callback, while the iframe loads.
      if (authError) throw authError;
      map = new google.maps.Map(byId('map-surface'), {
        center: settings.center, zoom: settings.zoom, mapTypeId: settings.mapTypeId,
        minZoom: site.minZoom, maxZoom: site.maxZoom,
        disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy',
        keyboardShortcuts: true, tilt: 0, heading: 0,
        renderingType: google.maps.RenderingType.RASTER,
      });
      class PlanningOverlay extends google.maps.OverlayView {
        onAdd() {}
        draw() {
          const projection = this.getProjection();
          if (!projection) return;
          const points = corners().map(corner => projection.fromLatLngToContainerPixel(new google.maps.LatLng(corner)));
          if (points.some(point => !point)) return;
          sheet.style.transform = `matrix(${geometry.pageMatrix(points, dimensions.width, dimensions.height).join(',')})`;
        }
        onRemove() { sheet.style.transform = ''; }
      }
      overlay = new PlanningOverlay();
      overlay.setMap(map);
      let cameraFrame;
      map.addListener('bounds_changed', () => {
        cancelAnimationFrame(cameraFrame);
        cameraFrame = requestAnimationFrame(() => overlay.draw());
      });
      new ResizeObserver(() => overlay.draw()).observe(byId('map-surface'));
      byId('map-key-form').hidden = true;
      byId('map-navigation').hidden = false;
      byId('map-fit').disabled = false;
      byId('alignment-center').disabled = false;
      byId('map-viewport').dataset.ready = 'true';
      placementNotice();
    } catch (error) {
      report(error.message);
      byId('map-key-form').hidden = false;
    } finally { busy = false; submit.disabled = false; }
  }

  function setMode(next) {
    byId('document-mode').setAttribute('aria-pressed', String(!next));
    byId('map-mode').setAttribute('aria-pressed', String(next));
    byId('document-controls').hidden = next;
    byId('document-viewport').hidden = next;
    byId('viewer-status').hidden = next;
    byId('map-controls').hidden = !next;
    byId('map-viewport').hidden = !next;
    status.hidden = !next;
    byId('map-settings').hidden = !next || byId('alignment-toggle').getAttribute('aria-expanded') !== 'true';
    window.dispatchEvent(new Event('resize'));
    if (!next) return;
    if (map) { requestAnimationFrame(() => overlay.draw()); return; }
    if (site.apiKey) startMap(site.apiKey);
    else report('Chưa có Google Maps API key.');
  }

  function exportSettings() {
    return { ...settings, center: { ...settings.center }, zoom: map ? map.getZoom() : settings.zoom };
  }

  async function init() {
    try {
      const response = await fetch('../metadata/documents.json');
      if (!response.ok) throw new Error('Không tải được cấu hình tài liệu.');
      const documents = await response.json();
      const config = documents.find(document => document.id === documentId)?.mapOverlay;
      if (!config?.enabled) return;
      initial = validate({ mapTypeId: site.mapTypeId, mapOpacity: site.mapOpacity,
        documentOpacity: site.documentOpacity, rotationDegrees: 0, calibrated: false, ...config });
      settings = structuredClone(initial);
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved) settings = validate({ ...initial, ...saved });
      } catch { /* Invalid or unavailable local storage falls back to document metadata. */ }
      fillControls();
      byId('map-mode').disabled = false;
      byId('document-mode').addEventListener('click', () => setMode(false));
      byId('map-mode').addEventListener('click', () => setMode(true));
      byId('map-key-form').addEventListener('submit', event => {
        event.preventDefault();
        const key = byId('map-api-key').value.trim();
        if (key) startMap(key);
      });
      byId('map-opacity').addEventListener('input', event => { settings.mapOpacity = Number(event.target.value); opacity(); });
      byId('planning-opacity').addEventListener('input', event => { settings.documentOpacity = Number(event.target.value); opacity(); });
      byId('map-type').addEventListener('change', event => { settings.mapTypeId = event.target.value; map?.setMapTypeId(settings.mapTypeId); });
      byId('map-fit').addEventListener('click', fitMap);
      byId('map-zoom-in').addEventListener('click', () => map.setZoom(Math.min(site.maxZoom, map.getZoom() + 1)));
      byId('map-zoom-out').addEventListener('click', () => map.setZoom(Math.max(site.minZoom, map.getZoom() - 1)));
      byId('alignment-toggle').addEventListener('click', () => {
        const open = byId('map-settings').hidden;
        byId('map-settings').hidden = !open;
        byId('alignment-toggle').setAttribute('aria-expanded', String(open));
      });
      byId('alignment-form').addEventListener('submit', event => { event.preventDefault(); readAlignment(); });
      byId('alignment-center').addEventListener('click', () => {
        const center = map.getCenter().toJSON();
        byId('alignment-lat').value = center.lat;
        byId('alignment-lng').value = center.lng;
        readAlignment();
      });
      byId('alignment-save').addEventListener('click', () => {
        if (!readAlignment()) return;
        try { localStorage.setItem(storageKey, JSON.stringify(exportSettings())); report('Đã lưu cấu hình trên trình duyệt này.'); }
        catch { report('Trình duyệt không cho phép lưu cấu hình. Bạn có thể tải JSON.'); }
      });
      byId('alignment-export').addEventListener('click', () => {
        if (!readAlignment()) return;
        const url = URL.createObjectURL(new Blob([JSON.stringify({ mapOverlay: exportSettings() }, null, 2) + '\n'], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${documentId}-map-overlay.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      byId('alignment-reset').addEventListener('click', () => {
        try { localStorage.removeItem(storageKey); } catch { /* Reset still applies for this session. */ }
        settings = structuredClone(initial);
        fillControls();
        if (map) { map.setMapTypeId(settings.mapTypeId); map.setCenter(settings.center); map.setZoom(settings.zoom); overlay.draw(); }
        placementNotice();
      });
      if (new URLSearchParams(location.search).get('view') === 'map') setMode(true);
    } catch (error) {
      byId('map-mode').title = error.message;
      if (new URLSearchParams(location.search).get('view') === 'map') {
        status.hidden = false;
        report(error.message);
      }
    }
  }
  init();
})();
