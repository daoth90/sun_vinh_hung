(() => {
  const frame = document.getElementById('document-frame');
  const stage = document.getElementById('document-stage');
  const viewport = document.getElementById('document-viewport');
  const slider = document.getElementById('zoom');
  const status = document.getElementById('viewer-status');
  const absoluteMinimum = Number(slider.min);
  let width = Number(frame.dataset.width) || 1100;
  let height = 1;
  let percent = 100;
  let fitMode = true;
  let zoomTimer;
  let interactionFrame;
  let pendingInteraction;
  let pendingWheelPercent;
  const pointers = new Map();
  let gesture;
  let resizeObserver;
  frame.style.width = `${width}px`;
  frame.style.height = '1px';

  function documentPoint(position) {
    const rect = frame.getBoundingClientRect();
    return { x: (position.x - rect.left) / (percent / 100), y: (position.y - rect.top) / (percent / 100) };
  }

  function fitPercent() {
    const style = getComputedStyle(viewport);
    const available = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const step = Number(slider.step) || 1;
    const fitted = Math.floor(available / width * 100 / step) * step;
    return Number(Math.max(absoluteMinimum, Math.min(Number(slider.max), fitted)).toFixed(2));
  }

  function updateZoomMinimum() {
    // Reset and every input share the same floor, recalculated for viewport size.
    slider.min = String(window.PDF_HTML_VIEWER_CONFIG?.allowZoomOutBeyondFit === true
      ? absoluteMinimum : fitPercent());
  }

  function apply(next, position, anchor) {
    updateZoomMinimum();
    const oldScale = percent / 100;
    const viewportRect = viewport.getBoundingClientRect();
    const oldRect = frame.getBoundingClientRect();
    const centerX = position?.x ?? viewportRect.left + viewport.clientWidth / 2;
    const centerY = position?.y ?? viewportRect.top + viewport.clientHeight / 2;
    // Account for both scroll offset and the stage's auto margins.
    const x = anchor?.x ?? (centerX - oldRect.left) / oldScale;
    const y = anchor?.y ?? (centerY - oldRect.top) / oldScale;
    const step = Number(slider.step) || 1;
    const rounded = Math.round(next / step) * step;
    percent = Number(Math.max(Number(slider.min), Math.min(Number(slider.max), rounded)).toFixed(2));
    const scale = percent / 100;
    frame.style.transform = `scale(${scale})`;
    stage.style.width = `${width * scale}px`;
    stage.style.height = `${height * scale}px`;
    slider.value = String(percent);
    const newRect = frame.getBoundingClientRect();
    viewport.scrollLeft += newRect.left + x * scale - centerX;
    viewport.scrollTop += newRect.top + y * scale - centerY;
  }

  function flushInteraction() {
    cancelAnimationFrame(interactionFrame);
    const update = pendingInteraction;
    pendingInteraction = undefined;
    update?.();
  }

  function scheduleInteraction(update) {
    pendingInteraction = update;
    cancelAnimationFrame(interactionFrame);
    interactionFrame = requestAnimationFrame(flushInteraction);
  }

  function beginInteraction() {
    clearTimeout(zoomTimer);
    updateZoomMinimum();
    slider.value = String(percent);
    fitMode = false;
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function rebaseGesture() {
    const [a, b] = pointers.values();
    if (!a) { gesture = undefined; return; }
    gesture = b
      ? { distance: Math.hypot(a.x - b.x, a.y - b.y), percent, anchor: documentPoint(midpoint(a, b)) }
      : { pointer: a, left: viewport.scrollLeft, top: viewport.scrollTop };
  }

  function updateGesture() {
    const [a, b] = pointers.values();
    if (!a || !gesture) return;
    if (b && gesture.distance > 0) {
      apply(gesture.percent * Math.hypot(a.x - b.x, a.y - b.y) / gesture.distance,
        midpoint(a, b), gesture.anchor);
    } else if (!b && gesture.pointer) {
      viewport.scrollLeft = gesture.left - (a.x - gesture.pointer.x);
      viewport.scrollTop = gesture.top - (a.y - gesture.pointer.y);
    }
  }

  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    if (pointers.size) return;
    beginInteraction();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const configured = Number(window.PDF_HTML_VIEWER_CONFIG?.wheelZoomSensitivity ?? 0.002);
    const sensitivity = Number.isFinite(configured) && configured > 0 ? configured : 0.002;
    const delta = Math.max(-500, Math.min(500, event.deltaY * unit));
    const next = (pendingWheelPercent ?? percent) * Math.exp(-delta * sensitivity);
    pendingWheelPercent = Math.max(Number(slider.min), Math.min(Number(slider.max), next));
    const position = { x: event.clientX, y: event.clientY };
    scheduleInteraction(() => {
      apply(pendingWheelPercent, position);
      pendingWheelPercent = undefined;
    });
  }, { passive: false });

  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    flushInteraction();
    beginInteraction();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('dragging');
    rebaseGesture();
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    scheduleInteraction(updateGesture);
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    flushInteraction();
    pointers.delete(event.pointerId);
    rebaseGesture();
    if (!pointers.size) viewport.classList.remove('dragging');
  }
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);
  viewport.addEventListener('lostpointercapture', endPointer);
  viewport.addEventListener('dragstart', event => event.preventDefault());

  function fit() {
    apply(fitPercent());
  }

  function measure() {
    try {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      // Reset height before measuring so zooming out does not retain an old viewport height.
      frame.style.height = '1px';
      width = Math.max(width, doc.documentElement.scrollWidth, doc.body.scrollWidth);
      frame.style.width = `${width}px`;
      height = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, 1);
      frame.style.height = `${height}px`;
      if (fitMode) fit(); else apply(percent);
    } catch (error) {
      status.textContent = 'Không đọc được kích thước HTML. Mở bằng HTTP server và dùng file cùng origin.';
      console.error(error);
    }
  }

  slider.addEventListener('input', () => {
    flushInteraction();
    clearTimeout(zoomTimer);
    const next = Number(slider.value);
    const configuredDelay = Number(window.PDF_HTML_VIEWER_CONFIG?.zoomDebounceMs ?? 100);
    const delay = Number.isFinite(configuredDelay) ? Math.max(0, configuredDelay) : 100;
    zoomTimer = setTimeout(() => { fitMode = false; apply(next); }, delay);
  });
  document.getElementById('zoom-reset').addEventListener('click', () => {
    flushInteraction();
    clearTimeout(zoomTimer);
    fitMode = true;
    fit();
  });
  window.addEventListener('resize', () => { if (fitMode) fit(); else apply(percent); });
  frame.addEventListener('load', () => {
    // pdf2htmlEX uses an absolute, internally scrolling container. Expose its
    // full page extent to the outer viewer without editing the source file.
    if (frame.dataset.layout === 'pdf2htmlEX') {
      const doc = frame.contentDocument;
      if (doc?.head) {
        const style = doc.createElement('style');
        style.textContent = `
          html, body { margin: 0 !important; padding: 0 !important; }
          #sidebar, .loading-indicator { display: none !important; }
          #page-container { position: static !important; overflow: visible !important; background: white !important; }
          .pf { margin: 0 !important; box-shadow: none !important; }
          .pc { display: block !important; }
        `;
        doc.head.append(style);
      }
    }
    measure();
    try {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => requestAnimationFrame(measure));
      resizeObserver.observe(doc.body);
      doc.fonts.ready.then(measure);
      doc.addEventListener('load', measure, true);
      status.textContent = '';
    } catch { /* measure() reports inaccessible documents. */ }
  });
  apply(percent);
})();
