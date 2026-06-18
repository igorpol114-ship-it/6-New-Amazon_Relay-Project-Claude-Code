# UI Elements Registry

Every UI element MUST have a unique data-testid.
When reporting a bug, use the testid name.

## Panel closer (content/panelCloser.js — 2026-06-18)

No new extension UI elements. This feature clicks Amazon's own close control — it is Amazon's element, not ours, so it has no `data-testid` from the extension. Behavior: when the loop starts, the load-detail sheet is closed via its own close button if it is currently open. The left filter panel is intentionally left alone. Controlled by `closePanelsForStart()`, called once per loop start from the `tabState 'running'` subscriber in `content.js`.

---

## Sidebar (current state — 2026-06-18)

| testid | Type | Function |
|--------|------|----------|
| ext-sidebar | div | Bar container (fixed, top-center). Carries `data-running` attr ("true"/"false") which drives all CSS visual state — play/pause icon swap, scanline animation. |
| ext-sidebar-title | span | "Amazon Relay Helper" title text. |
| ext-playpause | span[role=button] | Play ↔ pause pill. SVG icons swap via `#ext-sidebar[data-running] .ext-pp__play/pause` CSS. Click / Enter / Space calls `toggleRunning()` → writes `tabState.running` (per-tab, not storage.local). |
| ext-slider-speed | range | Refresh speed 0.5–8 s, step 0.5, default 2. Writes `tabState.refreshIntervalMs` (per-tab). Also calls `applyScanSpeed()` on input. |
| ext-slider-value | span | Live display of slider value, e.g. "2.0s". |
| (ext-scanline) | div.ext-scanline | No testid — purely decorative. CSS-only animation along bottom edge when running. Speed tied to `--ext-scan-dur` CSS var. |

**Removed sidebar elements:** `sidebar-surge-label`, `sidebar-surge-threshold` (removed 2026-06-18 — per-tab threshold still live in tabState/priceSurge, just no longer surfaced in sidebar UI).

**Removed elements (no longer in DOM):** `ext-btn-toggle`, `ext-status`, `ext-count`.

## Popup (current state — UI built, logic NOT wired)

| testid | Type | Function |
|--------|------|----------|
| popup-version | span | Extension version display. |
| popup-night-mode | checkbox | Night Mode toggle — dark theme over Relay site. **Wired** → writes `nightMode` to `chrome.storage.local`; `content/nightMode.js` toggles `html.ext-night` class live. |
| popup-tab-alert | checkbox | Tab Alert toggle — flash tab title/favicon on new load. **Wired** → writes `tabAlert` to `chrome.storage.local`; `content/tabAlert.js` flashes title (🔔 prefix) and favicon (orange "!" icon) for 10 s, clears on tab focus. |
| popup-volume | range | Sound volume 0–100. **Wired** → writes `soundVolume` to `chrome.storage.local` on slider release (`change`). Read back on popup open (default 70). `content/soundAlert.js` scales oscillator gain as `volume / 100`; `volume === 0` → silent. |
| popup-sound-select | select | Sound selector dropdown (25 options). **Wired** → writes `soundId` to storage on `change`, then plays an immediate preview. Read back on popup open (default `'default'`). Sounds: default, soft, sharp, bell, deep, high, click, ding, sonar, low, blip, wood, double, notify, drop, triple, alarm, fanfare, sparkle, sweep_up, sweep_down, chord, dial, burst, error. |
| popup-sound-replay | button | Icon-only replay button (▶) next to the dropdown. **Wired** → plays a preview of the currently selected sound at the current volume on click. |
| popup-surge | checkbox | Price Surge Alert toggle. **Wired** → writes `surgeEnabled` to storage; `content/priceSurge.js` enables per-tick payout comparison. |
| popup-surge-threshold | number | $ threshold for surge alert. **Wired** → writes `surgeThreshold` (number, default 50); saved on `input`+`change`; invalid/NaN values ignored without overwriting. |
| popup-hide-promoted | checkbox | Hide the Promoted badge on load cards. **Wired** → writes `hidePromoted`; `filterTags.js` sets `display:none` on `[id="PROMOTED"]`; collapses `.wo-tag` wrapper if all children hidden. Card stays fully visible. |
| popup-hide-starting-soon | checkbox | Hide the Starting soon badge. **Wired** → writes `hideStartingSoon`; `filterTags.js` sets `display:none` on `[id="STARTING_SOON"]`; collapses wrapper if all children hidden. |
| popup-hide-trailer-ready | checkbox | Hide the Trailer ready badge. **Wired** → writes `hideTrailerReady`; `filterTags.js` sets `display:none` on `[id="TRAILER_READY"]`. |
| popup-hide-past-book | checkbox | Hide the "Booked before" badge. **Wired** → writes `hidePastBook`; `filterTags.js` sets `display:none` on `[id="PAST_BOOK"]`. |
| popup-hide-similar | checkbox | Hide Similar Matches block. NOT wired. |
| popup-reset | button | Reset all settings to defaults. NOT wired. |

**Removed popup elements:** `popup-toggle` (run/stop — now sidebar-only), `popup-slider-speed`, `popup-slider-value`, `popup-load-count`, `popup-last-refresh`.

## Inline Panel (content/inlinePanel.js)

Injected below the clicked load card. No data-testid (dynamic, managed by `PANEL_ID = 'ext-inline-panel'`).

| Class | Type | Function |
|-------|------|----------|
| ext-inline-panel | div | Outer wrapper. `id="ext-inline-panel"`. |
| ext-seg-header | div | Collapsible segment header (multi-segment loads only). `display:grid` with 6 fixed columns: `40px minmax(0,3fr) 1.4fr 1fr 1fr 32px` — number / route / dist·time / action / status / arrow. Always 6 child spans. Toggles `ext-open` on self + paired body. |
| (ext-route-origin) | span | Origin code, column 1 (`1fr`) of `.ext-seg-route` 3-column grid. Monospace, centered, wraps within its half. `min-width:0`. |
| (ext-route-arrow) | span | Route connector `→`, column 2 (`auto`) — glyph width only, always centered. Bold, 1.15em, `#1a5c38`. |
| (ext-route-dest) | span | Destination code, column 3 (`1fr`). Monospace, centered, wraps within its half. `min-width:0`. |
| (ext-seg-loaded) | class on `.ext-seg-status` | "Loaded" — plain text, `#1a5c38` green, font-weight 500. No pill. |
| (ext-seg-empty) | class on `.ext-seg-status` | "Empty" — plain text, muted `#878787`. No pill. |
| (ext-seg-action) | span | Action text (Drop/Live/Preloaded) — plain text, muted `#565959`. No pill. |
| ext-seg-body | div | Segment table container. `display:none` until `ext-open`. |
| ext-inline-panel__table | table | Stop rows. `table-layout:fixed`, columns 40/20/20/20%. |
| ext-stop-num | span | Blue circle with stop number (if available). |
| ext-stop-addr | div | Grey address line under stop name. |
| ext-dot-loaded | span | Solid black dot = loaded trailer. |
| ext-dot-empty | span | Outlined dot = empty trailer. |

## Price Surge highlight (content/priceSurge.js)

Injected on the payout element of a surge-triggered card. Never on the whole card.

| testid / class | Type | Function |
|----------------|------|----------|
| (ext-surge-price) | class on `.wo-total_payout` | Green text + subtle green tint on the payout amount when a surge triggers. Removed by `clearSurgeHighlights()` each tick before re-applying. |
| ext-surge-badge | span | Sibling of `.wo-total_payout`. Shows `↑ +$NN` (delta rounded) via `textContent`. `data-testid="ext-surge-badge"`. Removed by `clearSurgeHighlights()`. Never uses innerHTML. |

Single-segment loads: table rendered directly, no accordion wrapper.

## PAT Modal (Stage 14 — not yet built)

| testid | Type | Function |
|--------|------|----------|
| btn-create-pat | button | On each load — open PAT modal |
| pat-modal | div | The template modal |
| pat-confirm | button | Confirm → fill form |
| pat-cancel | button | Cancel |

## Card Action Bar (planned — not yet built)

Three icon-only buttons at the bottom of the expanded inline panel:

| Icon | Function | Notes |
|------|----------|-------|
| Route Map | Show map widget with load's stops | Not built |
| Copy Screenshot | html2canvas → clipboard image | Needs `clipboardWrite` permission; not built |
| Create Post | Placeholder | No functionality planned yet |
