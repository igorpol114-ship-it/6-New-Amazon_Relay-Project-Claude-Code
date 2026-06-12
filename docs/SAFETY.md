# Safety — Amazon Relay Helper

## Binding safety boundary (permanent, applies to all future features)

This extension interacts with a live commercial booking system. The following rules are non-negotiable and apply to every feature in the backlog:

- **The extension NEVER books a load.** Booking is always finalized by a human dispatcher.
- **Only two `.click()` call sites exist in the entire codebase.**
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

## Allowed click sites — exactly two

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

---

## Scope
- **Load Board (Layout A) only.** `div.load-list:first-of-type` → `div.load-card` / `div.load-card__selected` / `div.wo-card-header--highlighted`.
- Layout B (Contracts / tour-container) is intentionally ignored.

---

## Audit checklist (Stage 17)
- [ ] `grep "\.click()"` → only `refreshNow()` in `refreshManager.js` + `openTopNewLoad()` in `detailOpener.js`
- [ ] `grep "rlb-book"` → only in `FORBIDDEN_SELECTORS` in `constants.js`
- [ ] `isForbiddenElement()` called before every `.click()`
- [ ] No new `.click()` sites introduced by popup wiring (Step 3) or any backlog feature
- [ ] 30-minute live test on Load Board
