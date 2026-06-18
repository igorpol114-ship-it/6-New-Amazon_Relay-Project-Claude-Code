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
Verified: 2026-06-02
Container:        div.load-card, div.load-card__selected  (both states)
Load ID:          card.querySelector('div[id]')?.id  (UUID string)
Payout:           .wo-total_payout  → "$427.61"
Price per mile:   .wo-card-header__components where textContent includes "/mi"  → "$1.84/mi"
Distance:         .wo-card-header__components where textContent includes "mi" but NOT "/mi"  → "104.0 mi"
Duration:         .wo-card-header__components matching /\d+[dh]/ and not containing "mi"  → "2h 52m"
Stops (locations): .wo-card-header__components where textContent includes ", " but NOT "/mi"  → ["CMH3 MONROE, OH...", ...]
Equipment:        .equipment-type-text  → "53' Trailer"
Trailer circle:   .trailer-type-circle  → "P"  (may be absent)
Loading type:     .loading-type  → "Drop" or "Live"
Deadhead:         previousElementSibling of span[title="Deadhead"]  → "32.31 mi"
Tag:              #STARTING_SOON or .wo-tag  → "Starting soon"  (may be absent)
Price increase:   .wo-total_payout__modified-load-increase-attr  (Amazon's own highlight)
Implementation:   content/loadParser.js → parseLoads()

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

## MutationObserver anchor ✅
Used by: content/loadObserver.js → startLoadObserver()

Anchor: `document.body`
Reason: `div.load-list` is VOLATILE — when the user changes a filter, Amazon (React SPA)
unmounts the entire div.load-list and mounts a fresh one. An observer bound to the old node
goes permanently deaf once that node is detached. document.body is the only unconditionally
stable anchor that survives any React re-render.

Observed config: `{ childList: true, subtree: true }`
- subtree:true required to catch replacements deep in the component tree.
- No attributes:true — highlighter class additions (.ext-new-load) are attribute mutations
  and do NOT fire this observer.

Mutation filter (hasLoadCardChange()):
  Only debounces when at least one of these is true in a batch:
  1. mutation.target.classList.contains('load-list') — cards changed inside existing list
  2. An added node.classList.contains('load-card' | 'load-card__selected')
  3. An added/removed node.classList.contains('load-list') — container replaced
  4. An added node.querySelector('div.load-card, div.load-list') — parent wrapper replaced

Self-trigger guard (isExtManagedNode()):
  Returns true for: non-element nodes, id='ext-inline-panel', id/data-testid starting with 'ext-'.
  These are skipped before the filter above runs.

DIAG logs: every callback invocation logs "DIAG callback: fired" with batch size, target,
and first added/removed class. hasLoadCardChange logs why it returned true. These help confirm
which case Amazon actually hits. Will be removed in a follow-up once confirmed working.

⚠️ Re-verify if Amazon changes the overall page structure (not just the load list).

## Detail panel (load-detail sheet) close ✅
Authorized: 2026-06-18 — see docs/SAFETY.md Click 3.
Panel open-check: `document.querySelector('#selected-work-sheet')` is non-null.
`#selected-work-sheet` is a stable element ID (not a CSS hash class).

Strategy 1 (primary — aria-label):
  `sheet.querySelectorAll('button[aria-label]')` → first whose aria-label (lowercase)
  contains "close".

Strategy 2 (icon-only fallback):
  `sheet.querySelectorAll('button')` → first with no text content and an `svg` child.

If no strategy resolves: log and skip — no click.
`isForbiddenElement()` is called on the resolved button before every click.
Implementation: content/panelCloser.js → findDetailCloseButton()
⚠️ Re-verify selector if Amazon changes the detail sheet markup.
