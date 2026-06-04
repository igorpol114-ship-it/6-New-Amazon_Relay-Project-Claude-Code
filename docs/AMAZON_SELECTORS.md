# Amazon Relay Selectors

Pull stable selectors from AMAZON_DOM_REFERENCE.md.
Update here if Amazon changes layout. Record verification date.

## Refresh button ✅
Verified: 2026-06-02
Location: bottom-right of load board, adjacent to "Next Refresh Xs" countdown text.
No stable id, no data-testid, no aria-label on the button itself. css-XXXX classes
are auto-generated and must NOT be used. Use fallback chain below.

Strategy 1 (primary):
  Find every <p> element whose textContent includes "Next Refresh".
  Take its parentElement and call querySelector('button') on it.
  Anchor: the "Next Refresh" countdown text — stable Amazon-owned string.

Strategy 2 (SVG fallback):
  Find every <path> element. Match its d attribute against the refresh icon geometry:
    d = "M20.128 2l-.493 5.635L14 7.142M19.44 6.935a9 9 0 101.023 8.134"
  Call .closest('button') on the matching path.
  Anchor: SVG path geometry — does not change with CSS rebuilds.

If both strategies fail: log error, return null, do NOT attempt click.
Implementation: content/refreshManager.js → findRefreshButton()

## Load card (Layout A) ✅
Container: div.load-card
Load ID: div[id] inside (UUID)
Payout: .wo-total_payout
Price increase: .wo-total_payout__modified-load-increase-attr
Equipment: .equipment-type-text
Loading type: .loading-type

## Tour container / Contracts (Layout B) — INTENTIONALLY IGNORED ⛔
Container: [data-type$="-tour-container"]
Rows: data-tag="offer-row"

Layout B (Contracts / Block view) is OUT OF SCOPE for this MVP.
This extension does NOT parse, interact with, or display Layout B data.
Contracts/Block is a future separate project with its own spec.
Selectors listed above for reference only — do not use in extension code.

## Booking (FORBIDDEN — never click) ⚠️
Book button (Load Board):   #rlb-book-btn
Confirm booking:            #rlb-book-trip-confirm-booking-btn
Cancel booking:             #rlb-book-trip-no-btn
Book button (Contracts/Layout B): #book-btn-row — Layout B / Contracts view — OUT OF SCOPE for MVP, but guarded.

All four selectors are in FORBIDDEN_SELECTORS (utils/constants.js).
isForbiddenElement() blocks any .click() call that targets these elements.
#book-btn-row is guarded as a paranoid safety measure even though Layout B
is not targeted — the extension must never book regardless of which view is active.

## PAT form (Stage 14)
Container: .css-kkw3y5 (fragile — find by structure)
Create Order: find button by text "Create Order"
Submit: find button by text "Submit" (DO NOT CLICK — user does)

## Neutral zone (Stage 13)
The load card itself (div.load-card) — clicking opens details panel.
NOT the payout, NOT the chevron, NOT any button.
