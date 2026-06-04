// NO clicks, NO booking, NO Layout B, NO scrolling, NO sound.
// Only adds/removes a CSS class on load-card elements. Not wired to refresh loop yet.

function injectHighlightStyle() {
  if (document.getElementById('ext-highlight-style')) return;
  var style = document.createElement('style');
  style.id = 'ext-highlight-style';
  style.textContent =
    '.ext-new-load {' +
      'outline: 3px solid #1a5c38 !important;' +
      'outline-offset: -3px !important;' +
      'box-shadow: 0 0 0 2px rgba(26,92,56,0.25) !important;' +
      'transition: outline 0.2s;' +
    '}';
  document.head.appendChild(style);
}

injectHighlightStyle();

function highlightNewLoads(newLoads) {
  logger.log('highlighter', 'highlightNewLoads called', { count: newLoads.length });

  var applied = 0;
  newLoads.forEach(function (load) {
    if (!load._element) return;
    load._element.classList.add('ext-new-load');
    applied++;
  });

  logger.log('highlighter', 'highlights applied', { applied: applied });
}

function clearHighlights() {
  logger.log('highlighter', 'clearHighlights called');
  var highlighted = document.querySelectorAll('.ext-new-load');
  highlighted.forEach(function (el) {
    el.classList.remove('ext-new-load');
  });
  logger.log('highlighter', 'highlights cleared', { cleared: highlighted.length });
}

// Expose for manual console testing only — NOT called automatically.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.highlightNew = function () {
  var r = detectNewLoads(parseLoads());
  highlightNewLoads(r.newLoads);
  return r.newCount;
};
window.__EXT_DEBUG.clearHighlights = clearHighlights;
