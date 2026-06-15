// content/tabAlert.js
// "Tab Alert" — when a new load is found and this tab is NOT focused, grab the
// dispatcher's attention by blinking the tab: the title text alternates AND the
// favicon alternates between a solid RED and solid YELLOW block. Auto-stops
// (restoring original title + favicon) the instant the dispatcher returns here.
//
// NOTE: a page cannot recolor the real tab strip — that is Chrome UI. The
// closest "red tab" is the favicon block, which this turns solid red.
//
// JS only, no clicks, no Amazon DOM changes. Single interval, cleared on stop —
// nothing accumulates in memory. Reads STORAGE_KEYS.TAB_ALERT.

var TAB_ALERT_LINK_ID = 'ext-tab-alert-favicon';
var tabAlertTimer     = null;
var tabAlertPhase     = 0;
var tabAlertOrigTitle = null;
var EXT_ICON_RED      = null;
var EXT_ICON_YELLOW   = null;

function extMakeIcon(color) {
  var c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  var ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 32, 32);
  return c.toDataURL('image/png');
}

function extEnsureAlertFavicon(href) {
  var link = document.getElementById(TAB_ALERT_LINK_ID);
  if (!link) {
    link = document.createElement('link');
    link.id  = TAB_ALERT_LINK_ID;
    link.rel = 'icon';
  }
  link.href = href;
  document.head.appendChild(link); // keep ours last so the browser uses it
}

function extRemoveAlertFavicon() {
  var link = document.getElementById(TAB_ALERT_LINK_ID);
  if (link) link.remove();
}

function stopTabAlert() {
  if (tabAlertTimer !== null) {
    clearInterval(tabAlertTimer);
    tabAlertTimer = null;
  }
  if (tabAlertOrigTitle !== null) {
    document.title = tabAlertOrigTitle;
    tabAlertOrigTitle = null;
  }
  extRemoveAlertFavicon();
  tabAlertPhase = 0;
}

function startTabAlert(count) {
  if (tabAlertTimer !== null) return; // already blinking
  if (EXT_ICON_RED === null)    EXT_ICON_RED    = extMakeIcon('#d40000');
  if (EXT_ICON_YELLOW === null) EXT_ICON_YELLOW = extMakeIcon('#ffd400');

  tabAlertOrigTitle = document.title;
  var label = (count && count > 1)
    ? ('🔴 ' + count + ' NEW LOADS')
    : '🔴 NEW LOAD';

  tabAlertTimer = setInterval(function () {
    tabAlertPhase = tabAlertPhase ? 0 : 1;
    if (tabAlertPhase) {
      document.title = label;
      extEnsureAlertFavicon(EXT_ICON_RED);
    } else {
      document.title = tabAlertOrigTitle;
      extEnsureAlertFavicon(EXT_ICON_YELLOW);
    }
  }, 600);

  logger.log('tabAlert', 'started', { count: count || 0 });
}

// Public entry — called by the orchestrator when new loads are found.
// Self-gates on the setting and only blinks when this tab is NOT focused.
async function flashTabAlert(count) {
  try {
    var on = await storage.get(STORAGE_KEYS.TAB_ALERT, false);
    if (on !== true) return;
    var focused = document.hasFocus() && document.visibilityState === 'visible';
    if (focused) return;
    startTabAlert(count);
  } catch (e) {
    logger.warn('tabAlert', 'flashTabAlert failed', { error: e });
  }
}

// Auto-stop the moment the dispatcher returns to this tab.
window.addEventListener('focus', function () { stopTabAlert(); });
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') stopTabAlert();
});

// If the feature is switched OFF while blinking, stop immediately.
chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== 'local') return;
  if (!changes[STORAGE_KEYS.TAB_ALERT]) return;
  if (changes[STORAGE_KEYS.TAB_ALERT].newValue !== true) stopTabAlert();
});

window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.flashTabAlert = function (n) { startTabAlert(n || 1); };
window.__EXT_DEBUG.stopTabAlert  = stopTabAlert;
