// content/tabAlert.js
// Tab Alert — flashes the document title and favicon when a new load is found.
// Called via flashTabAlert() from content.js orchestratorTick(). Checks
// STORAGE_KEYS.TAB_ALERT before doing anything. Restores originals on
// visibilitychange (user focuses tab) or after TAB_ALERT_DURATION_MS.
// No .click() calls. No Amazon DOM mutations.

var _blinkTimer      = null; // recursive blink tick handle
var _stopTimer       = null; // auto-stop after duration
var _origTitle       = null;
var _origFaviconEl   = null;
var _origFaviconHref = null;

var TAB_ALERT_DURATION_MS = 10000; // total flash time (ms)
var TAB_ALERT_BLINK_MS    = 750;   // title blink interval (ms)

function _getOrCreateFaviconEl() {
  var link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

function _buildAlertFaviconUrl() {
  try {
    var c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 16, 17);
    return c.toDataURL('image/png');
  } catch (e) {
    logger.warn('tabAlert', 'favicon canvas failed', { error: e });
    return null;
  }
}

function stopTabAlert() {
  clearTimeout(_blinkTimer);
  clearTimeout(_stopTimer);
  _blinkTimer = null;
  _stopTimer  = null;
  if (_origTitle !== null) {
    document.title = _origTitle;
    _origTitle = null;
  }
  if (_origFaviconEl !== null) {
    _origFaviconEl.href = _origFaviconHref || '';
    _origFaviconEl   = null;
    _origFaviconHref = null;
  }
  logger.log('tabAlert', 'stopped');
}

function _startBlink(alertTitle) {
  var blink = true;
  function tick() {
    document.title = blink ? alertTitle : _origTitle;
    blink = !blink;
    _blinkTimer = setTimeout(tick, TAB_ALERT_BLINK_MS);
  }
  tick();
  _stopTimer = setTimeout(stopTabAlert, TAB_ALERT_DURATION_MS);
}

async function flashTabAlert() {
  logger.log('tabAlert', 'flashTabAlert called');
  try {
    var enabled = await storage.get(STORAGE_KEYS.TAB_ALERT, false);
    if (!enabled) return;

    stopTabAlert(); // cancel any previous flash first

    _origTitle = document.title;

    var faviconEl = _getOrCreateFaviconEl();
    _origFaviconEl   = faviconEl;
    _origFaviconHref = faviconEl.href;
    var alertUrl = _buildAlertFaviconUrl();
    if (alertUrl) faviconEl.href = alertUrl;

    _startBlink('🔔 ' + _origTitle);
    logger.log('tabAlert', 'flash started', { origTitle: _origTitle });
  } catch (e) {
    logger.error('tabAlert', 'flashTabAlert failed', { error: e });
  }
}

// Stop flashing the moment the user brings this tab into focus
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) stopTabAlert();
});

window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.flashTabAlert = flashTabAlert;
window.__EXT_DEBUG.stopTabAlert  = stopTabAlert;
