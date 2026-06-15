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
| popup-hide-promoted | checkbox | Hide Promoted & Starting Soon cards. NOT wired. |
| popup-hide-similar | checkbox | Hide Similar Matches block. NOT wired. |
| popup-reset | button | Reset all settings to defaults. NOT wired. |

**Removed popup elements:** `popup-toggle` (run/stop — now sidebar-only), `popup-slider-speed`, `popup-slider-value`, `popup-load-count`, `popup-last-refresh`.

## Inline Panel (content/inlinePanel.js)

Injected below the clicked load card. No data-testid (dynamic, managed by `PANEL_ID = 'ext-inline-panel'`).

| Class | Type | Function |
|-------|------|----------|
| ext-inline-panel | div | Outer wrapper. `id="ext-inline-panel"`. |
| ext-seg-header | div | Collapsible segment header (multi-segment loads only). Toggles `ext-open` on self + paired body. |
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
