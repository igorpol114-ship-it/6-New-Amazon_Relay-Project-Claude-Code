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

### Price Surge Alert (UI-BUILT)
Toggle (`popup-surge`) + threshold (`popup-surge-threshold`, $ number, default $50). When enabled: after each refresh diff, compare each load's current payout to the last known payout for that loadId. If the difference >= threshold, play alert + visually highlight that card differently.
- Requires: a per-loadId price-history store in `chrome.storage.local` (e.g. `priceHistory: { [loadId]: lastPayout }`).
- **CRITICAL:** price-history store must delete entries for loadIds no longer visible — otherwise RAM and storage grow unboundedly (ties into memory-leak audit below).
- Storage keys to add: `STORAGE_KEYS.SURGE_ENABLED`, `STORAGE_KEYS.SURGE_THRESHOLD`, `STORAGE_KEYS.PRICE_HISTORY`.
- New highlight class for surge cards (distinct from the new-load blue).

### Hide tag filters ✅ DONE
Three compact toggles side-by-side in popup (`.popup-tag-block`): Promoted / Starting soon / Trailer ready. Each hides the matching tag **badge only** via `visibility:hidden` on the `[id="PROMOTED"]` / `[id="STARTING_SOON"]` / `[id="TRAILER_READY"]` element — the load card stays fully visible and participates in new-load detection normally. `content/filterTags.js` `recomputeTagHiding()` queries each id directly. Storage keys: `hidePromoted`, `hideStartingSoon`, `hideTrailerReady` (all boolean, default false). `MutationObserver` active only while ≥1 toggle is on.

### Hide Similar Matches (UI-BUILT)
Toggle (`popup-hide-similar`). On enable: find the second `div.load-list` (the "Similar matches" block) and hide its parent container via `display:none`. The parser already ignores it (first `div.load-list` only), so this is purely visual decluttering.
- Storage key to add: `STORAGE_KEYS.HIDE_SIMILAR = 'hideSimilar'` (boolean)

### Reset to Defaults (UI-BUILT)
Button (`popup-reset`). Clears all extension-managed keys from `chrome.storage.local` and resets UI to defaults. Should NOT clear any Amazon keys.

---

## Step 3 — Memory-leak / caching audit (PLANNED, do alongside popup wiring)

Tab RAM grows over long sessions. Audit targets:

1. **`_element` DOM references in `knownLoadIds`** — `loadDetector.js` stores load objects keyed by `loadId`. If those objects include `_element` (the live DOM node), every refresh that rotates the load list leaks detached nodes and blocks GC. Fix: store only scalar fields (`loadId`, `payout`) in the diff snapshot; never keep `_element` across ticks.
2. **Price-history store** — see Price Surge section above; must purge stale loadIds each tick.
3. **Style/favicon injection idempotency** — all injected `<style>` tags are already guarded by `id` check. Favicon swap must also be idempotent.
4. **Scanline** — CSS-only animation, no JS loop. Confirmed safe.
5. **`chrome.storage.onChanged` listeners** — each is registered once inside `buildSidebar()` / `initManualToggle()` which are each guarded against double-execution. Confirm no re-registration on SPA navigation.

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
