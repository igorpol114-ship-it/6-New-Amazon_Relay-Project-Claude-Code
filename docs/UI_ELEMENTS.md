# UI Elements Registry

Every UI element MUST have a unique data-testid.
When reporting a bug, use the testid name.

## Sidebar (Stage 3-4)
| testid | Type | Function |
|--------|------|----------|
| ext-sidebar | div | Sidebar container (fixed, top-center) — Stage 3 |
| ext-sidebar-title | span | "Amazon Relay Helper" title text — Stage 3 |
| ext-btn-toggle | button | Start / Stop toggle; data-running attr tracks state — Stage 4 |
| ext-slider-speed | range | Refresh speed slider (0.5–8 s, step 0.5, default 2) — Stage 4 |
| ext-slider-value | span | Shows current slider value e.g. "2.0s" — Stage 4 |
| toggle-sound | checkbox | Enable/disable sound — Stage 12 |
| toggle-debug | checkbox | Show debug overlay — future |
| counter-refresh | span | Total refresh count — future |

## Popup (Stage 9)
| testid | Type | Function |
|--------|------|----------|
| popup-slider-speed | range | Speed (synced) |
| popup-sound-select | select | Choose 1 of 20 sounds |
| popup-btn-preview | button | Preview selected sound |
| popup-toggle-sound | checkbox | Sound on/off |
| popup-btn-start | button | Start (synced) |

## PAT Modal (Stage 14)
| testid | Type | Function |
|--------|------|----------|
| btn-create-pat | button | On each load — open PAT modal |
| pat-modal | div | The template modal |
| pat-confirm | button | Confirm → fill form |
| pat-cancel | button | Cancel |
