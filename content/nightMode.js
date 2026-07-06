// content/nightMode.js
// Night Mode — dark theme injected over Amazon Relay (CSS-only, idempotent).
// Reads/writes STORAGE_KEYS.NIGHT_MODE. NO Amazon click sites touched — Book is
// only RESTYLED. A clicked load + its expanded detail read as ONE framed group
// with grey depth levels. Column-label row (Stop/Equipment/Arrival/Departure) is
// rendered tiny + very dim + single-line — it is redundant for dispatchers.

var NIGHT_STYLE_ID = 'ext-night-mode-style';

var NIGHT_BG       = '#0e1311';
var NIGHT_CARD     = '#1b201d';
var NIGHT_SELECTED = '#2c332e';
var NIGHT_DETAILS  = '#161b18';
var NIGHT_SEGMENT  = '#232a26';
var NIGHT_STOPROW  = '#121714';
var NIGHT_SIDEPANE = '#161b18';
var NIGHT_POPOVER  = '#242a26';
var NIGHT_FOOTER   = '#151a17';
var NIGHT_TEXT     = '#e7efe9';
var NIGHT_FAINT    = 'rgba(231,239,233,0.32)'; // the near-invisible column labels
var NIGHT_MUTED    = 'rgba(231,239,233,0.55)';
var NIGHT_HEADER   = '#1a5c38';
var NIGHT_BORDER   = 'rgba(255,255,255,0.08)';
var NIGHT_GROUP    = 'rgba(255,255,255,0.32)';
var NIGHT_DIVIDER  = 'rgba(255,255,255,0.13)';
var BOOK_BG        = '#146eb4';
var BOOK_TEXT      = '#ffffff';
var BOOK_BORDER    = '#1a82d6';

function buildNightCss() {
  return [
    'html.ext-night{color-scheme:dark;}',
    'html.ext-night,html.ext-night body{background-color:' + NIGHT_BG + ' !important;}',
    'html.ext-night body *:not(svg):not(path):not(g):not(use):not(img):not(video):not(canvas){background-color:transparent !important;border-color:' + NIGHT_BORDER + ' !important;}',
    'html.ext-night body *:not(svg):not(path):not(g):not(use){color:' + NIGHT_TEXT + ' !important;}',

    'html.ext-night .load-card,html.ext-night .wo-card-header,html.ext-night .wo-card-header--highlighted{background-color:' + NIGHT_CARD + ' !important;border-bottom:1px solid ' + NIGHT_DIVIDER + ' !important;}',

    // selected card — top of frame
    'html.ext-night .load-card__selected{background-color:' + NIGHT_SELECTED + ' !important;border:1px solid ' + NIGHT_GROUP + ' !important;border-bottom:none !important;border-radius:7px 7px 0 0 !important;}',

    // details pane — sides/bottom of frame
    'html.ext-night #selected-work-sheet{background-color:' + NIGHT_DETAILS + ' !important;border:1px solid ' + NIGHT_GROUP + ' !important;border-top:none !important;border-radius:0 0 7px 7px !important;padding-bottom:2px !important;}',

    // segment header band ("1 / 2", miles, Drop, Loaded/Empty)
    'html.ext-night #selected-work-sheet .css-1c02o5u{background-color:' + NIGHT_SEGMENT + ' !important;border-top:1px solid ' + NIGHT_DIVIDER + ' !important;font-weight:600 !important;}',

    // === COLUMN-LABEL ROW (Stop / Equipment-Id / Arrival / Departure) ===
    // Make it tiny, very dim, single-line, no background plate, minimal height.
    'html.ext-night #selected-work-sheet thead,html.ext-night #selected-work-sheet thead tr,html.ext-night #selected-work-sheet th{background-color:transparent !important;color:' + NIGHT_FAINT + ' !important;-webkit-text-fill-color:' + NIGHT_FAINT + ' !important;font-size:9px !important;font-weight:400 !important;text-transform:none !important;letter-spacing:0 !important;line-height:1 !important;white-space:nowrap !important;padding-top:2px !important;padding-bottom:2px !important;border:none !important;}',

    // stop data rows — darkest level, clear separators
    'html.ext-night #selected-work-sheet tbody,html.ext-night #selected-work-sheet tbody tr,html.ext-night #selected-work-sheet td{background-color:' + NIGHT_STOPROW + ' !important;}',
    'html.ext-night #selected-work-sheet tbody tr{border-bottom:1px solid ' + NIGHT_BORDER + ' !important;}',
    'html.ext-night #selected-work-sheet td{padding-top:9px !important;padding-bottom:9px !important;}',

    // OUR inline accordion — same treatment incl. faint single-line labels
    'html.ext-night #ext-inline-panel{background-color:' + NIGHT_SIDEPANE + ' !important;border:1px solid ' + NIGHT_GROUP + ' !important;border-top:none !important;border-radius:0 0 7px 7px !important;}',
    'html.ext-night #ext-inline-panel thead th{background-color:transparent !important;color:' + NIGHT_FAINT + ' !important;-webkit-text-fill-color:' + NIGHT_FAINT + ' !important;font-size:9px !important;font-weight:400 !important;text-transform:none !important;letter-spacing:0 !important;line-height:1 !important;white-space:nowrap !important;padding-top:2px !important;padding-bottom:2px !important;border:none !important;}',
    'html.ext-night #ext-inline-panel tbody td{background-color:' + NIGHT_STOPROW + ' !important;}',
    'html.ext-night #ext-inline-panel tbody tr{border-bottom:1px solid ' + NIGHT_BORDER + ' !important;}',
    'html.ext-night #ext-inline-panel i.fa-circle,html.ext-night #ext-inline-panel i.fa-circle-o{color:' + NIGHT_TEXT + ' !important;}',

    'html.ext-night #utility-bar,html.ext-night .utility-bar__default,html.ext-night [class*="utility-bar" i]{background-color:' + NIGHT_FOOTER + ' !important;border-top:1px solid ' + NIGHT_BORDER + ' !important;}',
    'html.ext-night #utility-bar *{background-color:transparent !important;}',

    'html.ext-night input,html.ext-night textarea,html.ext-night select{background-color:' + NIGHT_BG + ' !important;background-image:none !important;color:' + NIGHT_TEXT + ' !important;-webkit-text-fill-color:' + NIGHT_TEXT + ' !important;border:none !important;outline:none !important;box-shadow:none !important;}',
    'html.ext-night input::placeholder,html.ext-night textarea::placeholder{color:' + NIGHT_MUTED + ' !important;-webkit-text-fill-color:' + NIGHT_MUTED + ' !important;}',
    'html.ext-night [class*="dropdown" i],html.ext-night [class*="select" i],html.ext-night [class*="field" i],html.ext-night [class*="input" i]{background-color:' + NIGHT_BG + ' !important;}',
    'html.ext-night button{background-color:' + NIGHT_BG + ' !important;color:' + NIGHT_TEXT + ' !important;-webkit-text-fill-color:' + NIGHT_TEXT + ' !important;border:1px solid ' + NIGHT_BORDER + ' !important;}',

    'html.ext-night svg[aria-hidden="true"] g[stroke],html.ext-night svg[aria-hidden="true"] path[stroke]{stroke:' + NIGHT_TEXT + ' !important;}',

    'html.ext-night [aria-label*="close" i],html.ext-night [class*="close" i],html.ext-night [title*="close" i]{background-color:' + NIGHT_BG + ' !important;color:' + NIGHT_TEXT + ' !important;opacity:1 !important;}',
    'html.ext-night [aria-label*="close" i] svg,html.ext-night [class*="close" i] svg{stroke:' + NIGHT_TEXT + ' !important;}',

    'html.ext-night [role="dialog"],html.ext-night [role="menu"],html.ext-night [role="listbox"],html.ext-night [role="tooltip"],html.ext-night [role="grid"],html.ext-night [aria-modal="true"]{background-color:' + NIGHT_POPOVER + ' !important;border:1px solid ' + NIGHT_BORDER + ' !important;box-shadow:0 6px 22px rgba(0,0,0,0.55) !important;}',
    'html.ext-night [class*="popover" i],html.ext-night [class*="popup" i],html.ext-night [class*="tooltip" i],html.ext-night [class*="menu" i],html.ext-night [class*="overlay" i],html.ext-night [class*="modal" i],html.ext-night [class*="calendar" i],html.ext-night [class*="datepicker" i],html.ext-night [class*="timepicker" i],html.ext-night [class*="picker" i],html.ext-night [class*="flyout" i]{background-color:' + NIGHT_POPOVER + ' !important;}',
    'html.ext-night body > div[style*="position: absolute"],html.ext-night body > div[style*="position:absolute"],html.ext-night body > div[style*="position: fixed"],html.ext-night body > div[style*="position:fixed"]{background-color:' + NIGHT_POPOVER + ' !important;border:1px solid ' + NIGHT_BORDER + ' !important;}',
    'html.ext-night [role="dialog"] *,html.ext-night [role="grid"] *,html.ext-night [class*="picker" i] *{color:' + NIGHT_TEXT + ' !important;-webkit-text-fill-color:' + NIGHT_TEXT + ' !important;}',

    'html.ext-night header,html.ext-night [role="banner"],html.ext-night nav[role="navigation"]{background-color:' + NIGHT_HEADER + ' !important;}',
    'html.ext-night header *,html.ext-night [role="banner"] *,html.ext-night nav[role="navigation"] *{color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;background-color:transparent !important;}',

    'html.ext-night #rlb-book-btn,html.ext-night #rlb-book-trip-confirm-booking-btn,html.ext-night [id*="book" i][id*="btn" i]{background-color:' + BOOK_BG + ' !important;color:' + BOOK_TEXT + ' !important;-webkit-text-fill-color:' + BOOK_TEXT + ' !important;border:1px solid ' + BOOK_BORDER + ' !important;font-weight:700 !important;opacity:1 !important;}',
    'html.ext-night #rlb-book-btn *,html.ext-night #rlb-book-trip-confirm-booking-btn *{color:' + BOOK_TEXT + ' !important;-webkit-text-fill-color:' + BOOK_TEXT + ' !important;}',

    'html.ext-night .ext-new-load{background-color:rgba(76,141,255,.15) !important;box-shadow:inset 4px 0 0 0 rgba(76,141,255,.8) !important;}',

    // ext-sidebar dark surface — replaces the old green header colour
    'html.ext-night #ext-sidebar{background-color:#1c1f24 !important;color:#e5edf5 !important;}',
    'html.ext-night #ext-sidebar input{background-color:transparent !important;border:none !important;}',
    'html.ext-night #ext-sidebar [data-testid="ext-playpause"]{background:#23272d !important;border-color:#2c313a !important;color:#b0bcca !important;}',
    'html.ext-night #ext-sidebar .ext-scanline__seg{background:linear-gradient(90deg,rgba(76,141,255,0),rgba(76,141,255,.9),rgba(76,141,255,0)) !important;}'
  ].join('');
}

function ensureNightStyle() {
  if (document.getElementById(NIGHT_STYLE_ID)) return;
  var style = document.createElement('style');
  style.id = NIGHT_STYLE_ID;
  style.setAttribute('data-testid', NIGHT_STYLE_ID);
  style.textContent = buildNightCss();
  (document.head || document.documentElement).appendChild(style);
}

function applyNightMode(on) {
  ensureNightStyle();
  document.documentElement.classList.toggle('ext-night', on === true);
  logger.log('nightMode', 'applied', { on: on === true });
}

(async function initNightMode() {
  try {
    var on = await storage.get(STORAGE_KEYS.NIGHT_MODE, false);
    applyNightMode(on);
  } catch (e) {
    logger.warn('nightMode', 'init failed', { error: e });
  }
})();

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== 'local') return;
  if (!changes[STORAGE_KEYS.NIGHT_MODE]) return;
  applyNightMode(changes[STORAGE_KEYS.NIGHT_MODE].newValue === true);
});

window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.toggleNight = function () {
  var cur = document.documentElement.classList.contains('ext-night');
  applyNightMode(!cur);
  storage.set(STORAGE_KEYS.NIGHT_MODE, !cur);
  return !cur;
};
