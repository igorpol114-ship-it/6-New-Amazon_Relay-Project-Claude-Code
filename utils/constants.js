const FORBIDDEN_SELECTORS = [
  '#rlb-book-btn',                        // STARTS booking flow (Load Board)
  '#rlb-book-trip-confirm-booking-btn',   // FINALIZES booking (Load Board)
  '#book-btn-row'                         // Contracts/Layout-B Book button — out of scope for MVP, guarded anyway
];

function isForbiddenElement(el) {
  if (!el) return false;
  return FORBIDDEN_SELECTORS.some(s => el.matches(s) || el.closest(s));
}

// Named click intents — every .click() call must declare which intent it is.
// Only these two are permitted in the entire codebase.
const ALLOWED_CLICK_INTENTS = {
  REFRESH:      'REFRESH',       // Amazon's internal refresh button — refreshes list, books nothing
  NEUTRAL_ZONE: 'NEUTRAL_ZONE'   // Load card body — opens details panel, does NOT book
};

// Project-wide config
const EXT_NAME    = 'Amazon Relay Helper';
const EXT_VERSION = '0.1.0';

// 0 = off, 1 = errors/warnings only, 2 = full debug
const DEBUG_LEVEL = 2;
