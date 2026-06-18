# Feature Backlog

Status key: **UI-BUILT** = HTML/CSS exists in popup, logic not wired | **PLANNED** = not yet started | **PARTIAL** = some code exists

---

## Step 3 — Wire popup controls (next up)

Wire each popup control to `chrome.storage.local` one at a time. Order TBD by PM.

### Night Mode ✅ DONE
CSS-class-toggle approach: `html.ext-night` class toggled by `content/nightMode.js`. Popup checkbox wired in `popup/popup.js`. Storage key: `STORAGE_KEYS.NIGHT_MODE = 'nightMode'`.

### Tab Alert ✅ DONE
`content/tabAlert.js` calls `flashTabAlert()` (async, reads `STORAGE_KEYS.TAB_ALERT`). Blinking title ("🔔 " prefix, 750 ms interval) + orange favicon ("!") for 10 s. Clears on `visibilitychange` (user focuses tab). Called from content.js after `playAlert()`. Popup checkbox wired in `popup/popup.js`. Storage key: `STORAGE_KEYS.TAB_ALERT = 'tabAlert'`.

### Sound block ✅ DONE
Volume slider (`popup-volume`) wired, persists as `soundVolume` (0–100, default 70). Sound selector (`popup-sound-select`) wired, persists as `soundId` (default `'default'`). 25 distinct sounds in `content/soundAlert.js` SOUND_DEFS dispatch table. Preview plays on dropdown change and replay button click. `SOUND_MUTED` fully removed. Both volume and soundId survive popup close/reopen.

### Price Surge Alert ✅ DONE
`content/priceSurge.js` — `checkPriceSurge(loads)` called every tick. Builds `newHistory` from scratch per tick (auto-purges gone loads). Triggers on payout increase >= threshold; applies `.ext-surge-price` green tint + `↑ +$NN` badge; calls `playAlert()`. Popup controls: `popup-surge` → global `surgeEnabled`; `popup-surge-threshold` → global default for new tabs. **Per-tab isolation ✅ (2026-06-18):** threshold and priceHistory moved to `tabState` (sessionStorage-backed). Only `SURGE_ENABLED` remains in chrome.storage.local. Sidebar `sidebar-surge-threshold` field overrides per-tab.

### Hide tag filters ✅ DONE
Four compact toggles side-by-side in popup (`.popup-tag-block`): Promoted / Starting soon / Trailer ready / Booked before. Each hides the matching tag **badge only** via `display:none` on the respective `[id="..."]` element — space collapses (no leftover gap). If ALL known tag children of a `.wo-tag` wrapper are hidden, the wrapper itself is also set to `display:none`. Load card stays fully visible and participates in new-load detection. `MutationObserver` active only while ≥1 toggle is on. Storage keys: `hidePromoted`, `hideStartingSoon`, `hideTrailerReady`, `hidePastBook` (all boolean, default false).

### Hide Similar Matches (UI-BUILT)
Toggle (`popup-hide-similar`). On enable: find the second `div.load-list` (the "Similar matches" block) and hide its parent container via `display:none`. The parser already ignores it (first `div.load-list` only), so this is purely visual decluttering.
- Storage key to add: `STORAGE_KEYS.HIDE_SIMILAR = 'hideSimilar'` (boolean)

### Reset to Defaults (UI-BUILT)
Button (`popup-reset`). Clears all extension-managed keys from `chrome.storage.local` and resets UI to defaults. Should NOT clear any Amazon keys.

---

## Instant detection via MutationObserver ✅ DONE (2026-06-18)

`content/loadObserver.js` — `MutationObserver` on `div.load-list` with debounce (200ms).
Runs the full detection pipeline instantly when Amazon's DOM changes (new loads pushed,
filter params changed). Supplements timer tick; self-trigger prevention via
`isExtManagedNode()`. Wired through `tabState 'running'` subscriber.

---

## Step 3 — Memory-leak / caching audit (PLANNED, do alongside popup wiring)

Tab RAM grows over long sessions. Audit targets:

1. **`_element` DOM references in `knownLoadIds`** — `loadDetector.js` stores load objects keyed by `loadId`. If those objects include `_element` (the live DOM node), every refresh that rotates the load list leaks detached nodes and blocks GC. Fix: store only scalar fields (`loadId`, `payout`) in the diff snapshot; never keep `_element` across ticks.
2. **Price-history store** ✅ RESOLVED — `checkPriceSurge` rebuilds `newHistory` from scratch each tick; entries for gone loads are never written, so storage stays bounded.
3. **Style/favicon injection idempotency** — all injected `<style>` tags are already guarded by `id` check. Favicon swap must also be idempotent.
4. **Scanline** — CSS-only animation, no JS loop. Confirmed safe.
5. **`chrome.storage.onChanged` listeners** — ✅ RUNNING and SPEED removed from onChanged (now tabState pub/sub). Remaining listeners: nightMode, tabAlert, hideSimilar, tag filters, sound (all global). Confirm no re-registration on SPA navigation.

---

## Stage 14 — PAT Helper (PLANNED)
Fill the Post-a-Truck form programmatically based on the selected load. User submits manually. No auto-submit. See MVP_SPECIFICATION.md for original stage definition.

---

## Card Action Bar (PLANNED)

Three icon-only buttons at the bottom of the expanded inline panel. Minimal, unobtrusive.

| Button | Plan |
|--------|------|
| Route Map | Map widget showing load stops/route. Implementation TBD. |
| Copy Screenshot | `html2canvas` → write PNG to clipboard. Needs `clipboardWrite` permission added to manifest (only when this feature lands). User click provides the required gesture. |
| Create Post | Placeholder icon only. No functionality yet. |

---

## Future manifest additions (DO NOT add until the feature lands)

| Permission | Feature |
|-----------|---------|
| `clipboardWrite` | Copy Screenshot button |
| possibly `tabs` | Tab Alert (may not be needed depending on approach) |

---

## Stages 15–18 (original MVP plan)

- Stage 15: Performance hardening
- Stage 16: Error handling pass
- Stage 17: Safety audit (grep for .click(), FORBIDDEN checks, 30-min live test)
- Stage 18: Final build + packaging
