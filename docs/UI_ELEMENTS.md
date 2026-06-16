# UI Elements Registry

Every UI element MUST have a unique data-testid.
When reporting a bug, use the testid name.

## Sidebar (current state — 2026-06-11)

| testid | Type | Function |
|--------|------|----------|
| ext-sidebar | div | Bar container (fixed, top-center). Carries `data-running` attr ("true"/"false") which drives all CSS visual state — play/pause icon swap, scanline animation. |
| ext-sidebar-title | span | "Amazon Relay Helper" title text. |
| ext-playpause | span[role=button] | Play ↔ pause pill. SVG icons swap via `#ext-sidebar[data-running] .ext-pp__play/pause` CSS. Click / Enter / Space calls `toggleRunning()` → writes `STORAGE_KEYS.RUNNING`. **Replaces the old `ext-btn-toggle`** (removed). |
| ext-slider-speed | range | Refresh speed 0.5–8 s, step 0.5, default 2. Writes `STORAGE_KEYS.SPEED`. Also calls `applyScanSpeed()` on input. |
| ext-slider-value | span | Live display of slider value, e.g. "2.0s". |
| (ext-scanline) | div.ext-scanline | No testid — purely decorative. CSS-only animation along bottom edge when running. Speed tied to `--ext-scan-dur` CSS var. |

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
| popup-surge | checkbox | Price Surge Alert toggle. NOT wired. |
| popup-surge-threshold | number | $ threshold for surge alert. NOT wired. |
| popup-hide-promoted | checkbox | Hide the Promoted badge on load cards. **Wired** → writes `hidePromoted` to storage; `content/filterTags.js` sets `visibility:hidden` on each `[id="PROMOTED"]` element. Card stays fully visible. |
| popup-hide-starting-soon | checkbox | Hide the Starting soon badge. **Wired** → writes `hideStartingSoon`; `filterTags.js` sets `visibility:hidden` on `[id="STARTING_SOON"]`. |
| popup-hide-trailer-ready | checkbox | Hide the Trailer ready badge. **Wired** → writes `hideTrailerReady`; `filterTags.js` sets `visibility:hidden` on `[id="TRAILER_READY"]`. |
| popup-hide-similar | checkbox | Hide Similar Matches block. NOT wired. |
| popup-reset | button | Reset all settings to defaults. NOT wired. |

**Removed popup elements:** `popup-toggle` (run/stop — now sidebar-only), `popup-slider-speed`, `popup-slider-value`, `popup-load-count`, `popup-last-refresh`.

## Inline Panel (content/inlinePanel.js)

Injected below the clicked load card. No data-testid (dynamic, managed by `PANEL_ID = 'ext-inline-panel'`).

| Class | Type | Function |
|-------|------|----------|
| ext-inline-panel | div | Outer wrapper. `id="ext-inline-panel"`. |
| ext-seg-header | div | Collapsible segment header (multi-segment loads only). `display:grid` with 6 fixed columns: `40px minmax(0,3fr) 1.4fr 1fr 1fr 32px` — number / route / dist·time / action / status / arrow. Always 6 child spans. Toggles `ext-open` on self + paired body. |
| (ext-route-origin) | span | Origin code inside `.ext-seg-route` (left sub-column, 150px fixed). Monospace stack, 11px. |
| (ext-route-right) | span | Right sub-column wrapper inside `.ext-seg-route` (arrow + destination). `1fr` width. |
| (ext-route-arrow) | span | Route connector `→` inside `.ext-route-right`. Bold, 1.15em, `#1a5c38` accent. |
| (ext-route-dest) | span | Destination code inside `.ext-route-right`. Monospace stack, 11px. |
| (ext-seg-loaded) | class on `.ext-seg-status` | "Loaded" — plain text, `#1a5c38` green, font-weight 500. No pill. |
| (ext-seg-empty) | class on `.ext-seg-status` | "Empty" — plain text, muted `#878787`. No pill. |
| (ext-seg-action) | span | Action text (Drop/Live/Preloaded) — plain text, muted `#565959`. No pill. |
| ext-seg-body | div | Segment table container. `display:none` until `ext-open`. |
| ext-inline-panel__table | table | Stop rows. `table-layout:fixed`, columns 40/20/20/20%. |
| ext-stop-num | span | Blue circle with stop number (if available). |
| ext-stop-addr | div | Grey address line under stop name. |
| ext-dot-loaded | span | Solid black dot = loaded trailer. |
| ext-dot-empty | span | Outlined dot = empty trailer. |

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
