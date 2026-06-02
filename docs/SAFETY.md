# SAFETY RULES — Booking Protection

## Project Scope
This extension does NOT book loads. Ever. The only clicks it performs:
1. Amazon's internal Refresh button (refreshes list, books nothing)
2. A load's neutral zone (opens details, books nothing)

PAT forms are FILLED but the user presses Submit manually.

Auto-booking and "one-click booking" are OUT OF SCOPE — future separate
projects with their own specs and safety reviews.

## Defense in Depth

### Layer 1: Architectural
No module exists that clicks Book buttons. No clickAutomation.js,
no autoBooking.js. Only refreshManager (Refresh) and detailsOpener
(neutral zone) perform clicks.

### Layer 2: FORBIDDEN_SELECTORS guard
File: utils/constants.js
```
const FORBIDDEN_SELECTORS = [
  '#rlb-book-btn',
  '#rlb-book-trip-confirm-booking-btn'
];

function isForbiddenElement(el) {
  if (!el) return false;
  return FORBIDDEN_SELECTORS.some(s => el.matches(s) || el.closest(s));
}
```

Every .click() in the codebase calls isForbiddenElement() first.

### Layer 3: Booking confirmation detection
If [data-id="confirmation-expander"] ever becomes visible during
operation — anomaly. Log it, alert user, stop refresh loop.

## Allowed on Live Site
SAFE: parsing, diff, highlighting, sounds, Refresh click,
neutral-zone click, filling PAT form, storage.

NOT IN SCOPE: clicking Book, clicking Submit, any auto-acceptance.

## Audit Checklist (Stage 17)
- [ ] grep "\.click()" → only Refresh + neutral zone
- [ ] grep "rlb-book" → only in FORBIDDEN_SELECTORS
- [ ] no clickAutomation.js / autoBooking.js
- [ ] isForbiddenElement() called before every .click()
- [ ] 30-min live test, zero bookings
