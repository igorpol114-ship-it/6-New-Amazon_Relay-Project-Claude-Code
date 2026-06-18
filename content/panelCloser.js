// panelCloser.js — closes the load-detail sheet when the loop starts.
// Called once per loop start from content.js (tabState 'running' subscriber, val=true).
// Uses the sheet's own close control (not CSS hiding) to avoid FOUC.
//
// One allowed click site — authorized in docs/SAFETY.md:
//   CLOSE_DETAIL_PANEL: detail-sheet close control  (cannot trigger booking)
//
// Guarded by isForbiddenElement() before the click.
// If the sheet is not open (element not found), logs and skips — never throws.

// Returns the load-detail sheet's close button, or null if the sheet is not open.
// The detail sheet has the stable ID #selected-work-sheet.
// Strategy 1: button[aria-label*="close" i] inside the sheet.
// Strategy 2: first icon-only button (SVG child, no text) inside the sheet.
// See AMAZON_SELECTORS.md → Detail panel close for selector rationale.
function findDetailCloseButton() {
  logger.log('panelCloser', 'findDetailCloseButton called');
  try {
    var sheet = document.querySelector('#selected-work-sheet');
    if (!sheet) return null;

    var sheetBtns = sheet.querySelectorAll('button[aria-label]');
    for (var i = 0; i < sheetBtns.length; i++) {
      if (sheetBtns[i].getAttribute('aria-label').toLowerCase().includes('close')) {
        return sheetBtns[i];
      }
    }

    var allSheetBtns = sheet.querySelectorAll('button');
    for (var j = 0; j < allSheetBtns.length; j++) {
      var btn = allSheetBtns[j];
      if (!btn.textContent.trim() && btn.querySelector('svg')) return btn;
    }

    return null;
  } catch (e) {
    logger.error('panelCloser', 'findDetailCloseButton failed', { error: e });
    return null;
  }
}

// Closes the load-detail sheet if it is currently open.
// Called once per loop start. Left filter panel is intentionally left alone.
function closePanelsForStart() {
  logger.log('panelCloser', 'closePanelsForStart called');
  try {
    var detailBtn = findDetailCloseButton();
    if (!detailBtn) {
      logger.log('panelCloser', 'detail panel not open or close button not found — skipping');
    } else if (isForbiddenElement(detailBtn)) {
      logger.error('panelCloser', 'detail close button matched a forbidden selector — skipping', {});
    } else {
      logger.log('panelCloser', 'closing detail panel', { intent: ALLOWED_CLICK_INTENTS.CLOSE_DETAIL_PANEL });
      detailBtn.click();
    }
  } catch (e) {
    logger.error('panelCloser', 'detail panel close threw', { error: e });
  }
}
