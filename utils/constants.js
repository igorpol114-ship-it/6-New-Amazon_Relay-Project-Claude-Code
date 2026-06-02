const FORBIDDEN_SELECTORS = [
  '#rlb-book-btn',                        // STARTS booking flow
  '#rlb-book-trip-confirm-booking-btn'    // FINALIZES booking
];

function isForbiddenElement(el) {
  if (!el) return false;
  return FORBIDDEN_SELECTORS.some(s => el.matches(s) || el.closest(s));
}
