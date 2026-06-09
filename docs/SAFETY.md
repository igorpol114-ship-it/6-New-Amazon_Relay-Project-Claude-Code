# Specification — Load List Assistant

## Project Scope
This extension assists with monitoring and reviewing the Amazon load list.
It performs two types of clicks during operation:
1. Amazon's internal Refresh button (refreshes the visible list)
2. A load's neutral zone (opens the details panel)
PAT forms are filled programmatically; the user handles submission.

## Architecture
Two modules perform clicks: refreshManager (Refresh button) and
detailsOpener (neutral zone of a load card). The codebase uses a
selector guard in utils/constants.js to scope which elements automation
interacts with.

### Selector guard
File: utils/constants.js
const RESERVED_SELECTORS = [
'#rlb-book-btn',
'#rlb-book-trip-confirm-booking-btn'
];
function isReservedElement(el) {
if (!el) return false;
return RESERVED_SELECTORS.some(s => el.matches(s) || el.closest(s));
}
Every .click() in the codebase calls isReservedElement() first to
determine whether the element is within automation scope.

### Confirmation detection
If [data-id="confirmation-expander"] becomes visible during operation,
the extension logs it, notifies the user, and stops the refresh loop.

## Live Site Behavior
Active features: parsing, diff, highlighting, sounds, Refresh click,
neutral-zone click, PAT form filling, storage.

## .click() Call Sites (updated Stage 13)
There are exactly TWO .click() calls in the entire codebase:

### Click 1 — Refresh button (Stage 7)
  content/refreshManager.js → refreshNow() → button.click()
  Reached only if ALL pass:
    1. findRefreshButton() returns non-null
    2. isReservedElement(button) returns false
    3. button.tagName === 'BUTTON'
  Triggered manually via __EXT_DEBUG.refreshNow.

### Click 2 — Neutral zone / load card body (Stage 13)
  content/detailOpener.js → openTopNewLoad() → el.click()
  Reached only if ALL pass:
    1. newLoads array is non-empty
    2. load._element is non-null
    3. isReservedElement(_element) returns false
    4. document.contains(_element) is true
  Clicks div.load-card body only — opens the details panel.
  Triggered manually via __EXT_DEBUG.openTopNew.

## Audit Checklist (Stage 17)
- [ ] grep "\.click()" → only refreshNow() in refreshManager.js + neutral zone (Stage 13)
- [ ] grep "rlb-book" → only in RESERVED_SELECTORS
- [ ] isReservedElement() called before every .click()
- [ ] 30-min live test