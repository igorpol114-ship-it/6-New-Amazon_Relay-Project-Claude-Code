# Safety — Amazon Relay Helper

## Binding safety boundary (permanent, applies to all future features)

This extension interacts with a live commercial booking system. The following rules are non-negotiable and apply to every feature in the backlog:

- **The extension NEVER books a load.** Booking is always finalized by a human dispatcher.
- **Only three `.click()` call sites exist in the entire codebase.**
- **`isForbiddenElement()` is called before every `.click()`.**
- None of the planned features (Night Mode, Tab Alert, Sound, Price Surge, Hide filters, Card Action Bar) add any new click site or touch booking.

---

## FORBIDDEN_SELECTORS (utils/constants.js)

```
#rlb-book-btn
#rlb-book-trip-confirm-booking-btn
#book-btn-row
```

`isForbiddenElement(el)` returns true if `el` or any ancestor matches any of these selectors. Called before **every** `.click()`.

**NEVER modify or remove these selectors.**

---

## Allowed click sites — exactly three

### Click 1 — Refresh button (refreshManager.js → refreshNow())
Three gates must ALL pass:
1. `findRefreshButton()` returns non-null
2. `isForbiddenElement(button)` === false
3. `button.tagName === 'BUTTON'`

Intent logged as `ALLOWED_CLICK_INTENTS.REFRESH`.

### Click 2 — Load card neutral zone (detailOpener.js → openTopNewLoad())
Implementation uses `scrollIntoView` + 250ms `setTimeout` + `document.elementFromPoint`:

Gates on the card container (`el`):
1. `el` exists
2. `isForbiddenElement(el)` === false  **(MANDATORY)**
3. `document.contains(el)` === true

Gates on the resolved `target` (elementFromPoint result, run inside setTimeout):
4. `target` non-null
5. `isForbiddenElement(target)` === false  **(MANDATORY)**
6. If `target` is outside `el`, fall back to `el` itself

Intent logged as `ALLOWED_CLICK_INTENTS.NEUTRAL_ZONE`.

### Click 3 — Load detail panel close (panelCloser.js → closePanelsForStart())
**Rationale:** Same as Click 3. Closing the load-detail sheet cannot trigger booking.
The detail sheet is `#selected-work-sheet`; its close button contains no booking controls.

**Safety:** `isForbiddenElement()` verifies the close button is not a booking element
before every click.

Gates:
1. `document.querySelector('#selected-work-sheet')` is non-null (panel is open)
2. `findDetailCloseButton()` returns non-null (close button found within sheet)
3. `isForbiddenElement(btn)` === false  **(MANDATORY)**

Intent logged as `ALLOWED_CLICK_INTENTS.CLOSE_DETAIL_PANEL`.
Selector strategy: see AMAZON_SELECTORS.md → Detail panel close.

---

## Scope
- **Load Board (Layout A) only.** `div.load-list:first-of-type` → `div.load-card` / `div.load-card__selected` / `div.wo-card-header--highlighted`.
- Layout B (Contracts / tour-container) is intentionally ignored.

---

## Audit checklist (Stage 17)
- [ ] `grep "\.click()"` → exactly three sites: `refreshNow()` (refreshManager.js), `openTopNewLoad()` (detailOpener.js), detail close (panelCloser.js)
- [ ] `grep "rlb-book"` → only in `FORBIDDEN_SELECTORS` in `constants.js`
- [ ] `isForbiddenElement()` called before every `.click()`
- [ ] No new `.click()` sites introduced by popup wiring (Step 3) or any backlog feature
- [ ] 30-minute live test on Load Board
