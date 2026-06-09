async function buildSidebar() {
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
      'height:40px;padding:0 20px;display:flex;align-items:center;gap:10px;' +
      'border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,.35);' +
      'font-family:Arial,sans-serif;font-size:13px;font-weight:600;' +
      'letter-spacing:.3px;white-space:nowrap;user-select:none;' +
    '}' +
    '#ext-sidebar [data-testid="ext-btn-toggle"]{' +
      'background:rgba(255,255,255,.15);color:#fff;' +
      'border:1px solid rgba(255,255,255,.3);border-radius:4px;' +
      'padding:3px 10px;cursor:pointer;font-size:12px;' +
      'font-family:inherit;font-weight:600;' +
      'min-width:52px;text-align:center;' +
    '}' +
    '#ext-sidebar [data-testid="ext-btn-toggle"]:hover{' +
      'background:rgba(255,255,255,.25);' +
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

  // Title
  const title = document.createElement('span');
  title.setAttribute('data-testid', 'ext-sidebar-title');
  title.textContent = EXT_NAME;

  // Toggle button — default values, overwritten by storage restore below
  const toggle = document.createElement('button');
  toggle.setAttribute('data-testid', 'ext-btn-toggle');
  toggle.setAttribute('data-running', 'false');
  toggle.textContent = 'Start';

  // Speed slider — default values, overwritten by storage restore below
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

  // Build DOM — order matches visual left-to-right
  container.appendChild(title);
  container.appendChild(toggle);
  container.appendChild(slider);
  container.appendChild(sliderValue);

  document.body.appendChild(container);

  // Restore saved state before attaching listeners
  const savedSpeed   = await storage.get(STORAGE_KEYS.SPEED,   2);
  slider.value = String(savedSpeed);
  sliderValue.textContent = parseFloat(savedSpeed).toFixed(1) + 's';

  const savedRunning = await storage.get(STORAGE_KEYS.RUNNING, false);
  toggle.setAttribute('data-running', String(savedRunning));
  toggle.textContent = savedRunning ? 'Stop' : 'Start';

  // --- Event listeners ---
  // CLAUDE.md rule 2: addEventListener only, never inline handlers
  // CLAUDE.md rule 4: no .click() on Amazon elements — these only touch our own UI

  toggle.addEventListener('click', function () {
    logger.log('sidebar', 'toggle clicked');
    const nowRunning = toggle.getAttribute('data-running') !== 'true';
    toggle.setAttribute('data-running', String(nowRunning));
    toggle.textContent = nowRunning ? 'Stop' : 'Start';
    storage.set(STORAGE_KEYS.RUNNING, nowRunning);
  });

  slider.addEventListener('input', function () {
    logger.log('sidebar', 'slider changed', { value: slider.value });
    sliderValue.textContent = parseFloat(slider.value).toFixed(1) + 's';
    storage.set(STORAGE_KEYS.SPEED, parseFloat(slider.value));
  });

  // Keep toggle in sync when RUNNING changes from any source
  // (orchestrator auto-stop, popup, etc). Read-only — no storage.set here.
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local') return;
    if (!changes[STORAGE_KEYS.RUNNING]) return;
    var running = changes[STORAGE_KEYS.RUNNING].newValue;
    toggle.setAttribute('data-running', String(running));
    toggle.textContent = running ? 'Stop' : 'Start';
    logger.log('sidebar', 'toggle synced from storage change', { running: running });
  });

  logger.log('sidebar', 'sidebar injected');
}
