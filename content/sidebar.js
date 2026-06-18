function buildSidebar() {
  logger.log('sidebar', 'buildSidebar called');

  if (document.querySelector('[data-testid="ext-sidebar"]')) {
    logger.warn('sidebar', 'sidebar already present, skipping');
    return;
  }

  // Static CSS only — no page data, safe per CLAUDE.md rule 10
  const style = document.createElement('style');
  style.setAttribute('data-testid', 'ext-sidebar-styles');
  style.textContent =
    '#ext-sidebar{' +
      'position:fixed;top:0;left:50%;transform:translateX(-50%);' +
      'z-index:2147483647;background:#1a5c38;color:#fff;' +
      'height:40px;padding:0 20px;display:flex;align-items:center;gap:12px;' +
      'border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,.35);' +
      'font-family:Arial,sans-serif;font-size:13px;font-weight:600;' +
      'letter-spacing:.3px;white-space:nowrap;user-select:none;overflow:hidden;' +
      '--ext-scan-dur:2.8s;' +
    '}' +
    '#ext-sidebar [data-testid="ext-sidebar-title"]{' +
      'font-size:13px;font-weight:600;' +
    '}' +
    '#ext-sidebar [data-testid="ext-playpause"]{' +
      'width:48px;height:26px;border-radius:13px;' +
      'background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);' +
      'display:inline-flex;align-items:center;justify-content:center;' +
      'cursor:pointer;color:#fff;outline:none;transition:background .15s;' +
    '}' +
    '#ext-sidebar [data-testid="ext-playpause"]:hover{' +
      'background:rgba(255,255,255,.28);' +
    '}' +
    '#ext-sidebar [data-testid="ext-playpause"]:focus-visible{' +
      'box-shadow:0 0 0 2px rgba(255,255,255,.6);' +
    '}' +
    '#ext-sidebar .ext-pp__icon{width:14px;height:14px;display:block;}' +
    '#ext-sidebar .ext-pp__pause{display:none;}' +
    '#ext-sidebar[data-running="true"] .ext-pp__play{display:none;}' +
    '#ext-sidebar[data-running="true"] .ext-pp__pause{display:block;}' +
    '#ext-sidebar .ext-scanline{' +
      'position:absolute;left:8px;right:8px;bottom:0;height:2px;' +
      'border-radius:2px;overflow:hidden;opacity:0;transition:opacity .2s;' +
      'pointer-events:none;' +
    '}' +
    '#ext-sidebar[data-running="true"] .ext-scanline{opacity:1;}' +
    '#ext-sidebar .ext-scanline__seg{' +
      'position:absolute;top:0;left:0;height:100%;width:38%;border-radius:2px;' +
      'background:linear-gradient(90deg,rgba(125,207,142,0),rgba(125,207,142,1),rgba(125,207,142,0));' +
    '}' +
    '#ext-sidebar[data-running="true"] .ext-scanline__seg{' +
      'animation:extScan var(--ext-scan-dur) linear infinite;' +
    '}' +
    '@keyframes extScan{' +
      '0%{transform:translateX(-110%)}' +
      '100%{transform:translateX(370%)}' +
    '}' +
    '@media (prefers-reduced-motion: reduce){' +
      '#ext-sidebar .ext-scanline__seg{animation:none!important;width:100%;' +
        'background:rgba(125,207,142,.9);}' +
    '}' +
    '#ext-sidebar [data-testid="ext-slider-speed"]{' +
      'width:80px;cursor:pointer;accent-color:#7dcf8e;vertical-align:middle;' +
    '}' +
    '#ext-sidebar [data-testid="ext-slider-value"]{' +
      'font-size:11px;min-width:28px;opacity:.9;' +
    '}' +
    'body{padding-top:44px!important;}';

  document.head.appendChild(style);

  // Container
  const container = document.createElement('div');
  container.id = 'ext-sidebar';
  container.setAttribute('data-testid', 'ext-sidebar');
  container.setAttribute('data-running', 'false');

  // Title
  const title = document.createElement('span');
  title.setAttribute('data-testid', 'ext-sidebar-title');
  title.textContent = EXT_NAME;

  // Play/pause control — Click writes tabState; tabState subscriber drives the visual.
  const playpause = document.createElement('span');
  playpause.setAttribute('data-testid', 'ext-playpause');
  playpause.setAttribute('role', 'button');
  playpause.setAttribute('tabindex', '0');
  playpause.innerHTML =
    '<svg class="ext-pp__icon ext-pp__play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M8 5v14l11-7z"></path>' +
    '</svg>' +
    '<svg class="ext-pp__icon ext-pp__pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<rect x="6" y="5" width="4" height="14" rx="1"></rect>' +
      '<rect x="14" y="5" width="4" height="14" rx="1"></rect>' +
    '</svg>';

  // Speed slider
  const slider = document.createElement('input');
  slider.setAttribute('type', 'range');
  slider.setAttribute('data-testid', 'ext-slider-speed');
  slider.min   = '0.5';
  slider.max   = '8';
  slider.step  = '0.5';
  slider.value = '2';

  // Slider value display
  const sliderValue = document.createElement('span');
  sliderValue.setAttribute('data-testid', 'ext-slider-value');
  sliderValue.textContent = '2.0s';

  // Running scanline along the bottom edge
  const scanline = document.createElement('div');
  scanline.className = 'ext-scanline';
  scanline.innerHTML = '<div class="ext-scanline__seg"></div>';

  // Build DOM
  container.appendChild(title);
  container.appendChild(playpause);
  container.appendChild(slider);
  container.appendChild(sliderValue);
  container.appendChild(scanline);

  document.body.appendChild(container);

  // --- Helpers ---

  function applyScanSpeed(speedSec) {
    var s   = parseFloat(speedSec);
    if (isNaN(s)) s = 2;
    var dur = s * 0.7;
    if (dur < 0.5) dur = 0.5;
    if (dur > 4)   dur = 4;
    container.style.setProperty('--ext-scan-dur', dur.toFixed(2) + 's');
  }

  // Visual + tooltip only. Does NOT write tabState. Called by tabState subscriber.
  function reflectRunning(running) {
    container.setAttribute('data-running', String(running));
    playpause.setAttribute('title',      running ? 'Searching — click to pause' : 'Paused — click to start');
    playpause.setAttribute('aria-label', running ? 'Monitoring is running. Click to pause.' : 'Monitoring is paused. Click to start.');
  }

  // User intent — writes tabState (single source of truth for this tab).
  // The 'running' subscriber fires reflectRunning synchronously; no direct call needed.
  function toggleRunning() {
    var nowRunning = container.getAttribute('data-running') !== 'true';
    tabState.set('running', nowRunning);
    logger.log('sidebar', 'playpause toggled', { running: nowRunning });
  }

  // Seed visual state from tabState (synchronous — tabState.init() completed before buildSidebar)
  var initSpeedSec = tabState.get('refreshIntervalMs') / 1000;
  slider.value = String(initSpeedSec);
  sliderValue.textContent = initSpeedSec.toFixed(1) + 's';
  applyScanSpeed(initSpeedSec);

  reflectRunning(tabState.get('running'));

  // Subscribe: orchestrator auto-stop flips the pill without a storage round-trip
  tabState.subscribe('running', function (val) {
    reflectRunning(val);
    logger.log('sidebar', 'running synced from tabState', { running: val });
  });

  // --- Event listeners ---
  // CLAUDE.md rule 2: addEventListener only, never inline handlers
  // CLAUDE.md rule 4: no .click() on Amazon elements — these only touch our own UI

  playpause.addEventListener('click', function () {
    toggleRunning();
  });

  playpause.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
      ev.preventDefault();
      toggleRunning();
    }
  });

  slider.addEventListener('input', function () {
    logger.log('sidebar', 'slider changed', { value: slider.value });
    var sec = parseFloat(slider.value);
    sliderValue.textContent = sec.toFixed(1) + 's';
    applyScanSpeed(sec);
    tabState.set('refreshIntervalMs', sec * 1000);
  });

  logger.log('sidebar', 'sidebar injected');
}
