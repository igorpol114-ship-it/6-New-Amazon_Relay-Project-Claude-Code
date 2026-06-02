# UI Elements Registry

Every UI element MUST have a unique data-testid.
When reporting a bug, use the testid name.

## Sidebar (Stage 3-4)
| testid | Type | Function |
|--------|------|----------|
| ext-sidebar | div | Sidebar container (fixed, top-center) — Stage 3 |
| ext-sidebar-title | span | "Amazon Relay Helper" title text — Stage 3 |
| btn-start | button | Start refresh loop |
| btn-stop | button | Stop refresh loop |
| slider-refresh-speed | range | Set refresh speed |
| label-speed-value | span | Show current speed |
| toggle-sound | checkbox | Enable/disable sound |
| toggle-debug | checkbox | Show debug overlay |
| indicator-status | span | Status text |
| counter-refresh | span | Refresh count |
| counter-new-loads | span | New loads count |

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
