(function attachReportsDom(globalObject) {
  function normalizeCssSize(value, fallbackPixels) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${value}px`;
    }

    const raw = String(value || '').trim();
    return raw || `${fallbackPixels}px`;
  }

  function normalizePixels(value, fallbackPixels) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value);
    }

    const raw = String(value || '').trim();
    if (!raw) return fallbackPixels;

    const pixelsMatch = raw.match(/^(\d+(?:\.\d+)?)px$/i);
    if (pixelsMatch) {
      return Math.round(Number(pixelsMatch[1]));
    }

    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallbackPixels;
  }

  function appTextColor() {
    const cssValue = (
      getComputedStyle(document.body).getPropertyValue('--chart-label-text') || ''
    ).trim();

    if (cssValue) return cssValue;
    return document.body.classList.contains('theme-light') ? '#0b1220' : '#e5e7eb';
  }

  function createOffscreenHost(options = {}) {
    const host = document.createElement('div');
    host.id = options.id || 'pdf-host';
    host.style.position = 'fixed';
    host.style.left = '-99999px';
    host.style.top = '0';
    host.style.width = normalizeCssSize(options.width || '1200px', 1200);
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);
    return host;
  }

  function addCanvas(host, height = '520px', width = '900px') {
    const cssWidth = normalizeCssSize(width, 900);
    const cssHeight = normalizeCssSize(height, 520);

    const wrap = document.createElement('div');
    wrap.style.width = cssWidth;
    wrap.style.height = cssHeight;

    const canvas = document.createElement('canvas');
    canvas.width = normalizePixels(width, 900);
    canvas.height = normalizePixels(height, 520);

    wrap.appendChild(canvas);
    host.appendChild(wrap);
    return canvas;
  }

  function addBlank(host, height = '200px', width = '900px') {
    const canvas = addCanvas(host, height, width);
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }

  function forceWhiteBackground(canvas) {
    const context = canvas?.getContext?.('2d');
    if (!context) return;

    context.save();
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function flushRender() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    });
  }

  function clearComparativoPreview(content) {
    content?.querySelectorAll?.('#cmp-chart, .cmp-note').forEach((node) => node.remove());
  }

  function createComparativoPreviewHost(content) {
    const host = document.createElement('div');
    host.id = 'cmp-chart';
    host.style.marginTop = '16px';
    host.style.maxHeight = '70vh';
    host.style.overflowY = 'auto';
    content.appendChild(host);

    function addNote(text) {
      const note = document.createElement('div');
      note.className = 'cmp-note text-sm opacity-70 mt-2';
      note.textContent = text;
      content.appendChild(note);
    }

    function addPreviewCanvas(height = '650px') {
      const canvas = addCanvas(host, height, '100%');
      canvas.parentElement.style.marginTop = '12px';
      canvas.width = normalizePixels('900px', 900);
      return canvas;
    }

    return {
      host,
      addNote,
      addCanvas: addPreviewCanvas,
    };
  }

  globalObject.ReportsDom = {
    appTextColor,
    createOffscreenHost,
    addCanvas,
    addBlank,
    forceWhiteBackground,
    flushRender,
    clearComparativoPreview,
    createComparativoPreviewHost,
  };
})(window);
