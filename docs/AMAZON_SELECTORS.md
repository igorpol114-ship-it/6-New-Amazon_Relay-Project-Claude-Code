# Amazon Relay Selectors

Pull stable selectors from AMAZON_DOM_REFERENCE.md.
Update here if Amazon changes layout. Record verification date.

## Refresh button ⚠️ TODO — USER MUST FILL
Selector: [INSPECT MANUALLY before Stage 6]
The refresh button is bottom-right with "Next Refresh Xs" text.
Right-click it → Inspect → find aria-label or data attribute.
Verified: ___

## Load card (Layout A) ✅
Container: div.load-card
Load ID: div[id] inside (UUID)
Payout: .wo-total_payout
Price increase: .wo-total_payout__modified-load-increase-attr
Equipment: .equipment-type-text
Loading type: .loading-type

## Tour container (Layout B) ✅
Container: [data-type$="-tour-container"]
Load leg: [data-type$="-load-expander"]
Payout: [data-type="tour-payout-info"]
Distance: [data-type="tour-distance-string"]

## Booking (FORBIDDEN — never click) ⚠️
Book button: #rlb-book-btn
Confirm: #rlb-book-trip-confirm-booking-btn
Cancel: #rlb-book-trip-no-btn

## PAT form (Stage 14)
Container: .css-kkw3y5 (fragile — find by structure)
Create Order: find button by text "Create Order"
Submit: find button by text "Submit" (DO NOT CLICK — user does)

## Neutral zone (Stage 13)
The load card itself (div.load-card) — clicking opens details panel.
NOT the payout, NOT the chevron, NOT any button.
