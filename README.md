# Amazon Relay Helper Extension

Chrome Extension (MV3, vanilla JS) for monitoring the Amazon Relay Load Board.

## Scope
Monitors loads, highlights new ones, plays sounds, opens details, shows an inline stop-detail panel. Does NOT book loads — the dispatcher books manually.

## Current status (2026-06-11)
- Stages 0–13 complete (core monitoring loop fully working).
- Sidebar redesigned: play/pause pill button + animated scanline replaces old Start/Stop text button.
- Popup redesigned: full Settings panel UI built; popup controls are NOT yet wired to storage (Step 3 work).
- Inline panel (`content/inlinePanel.js`): reads Amazon's native sheet, renders collapsible segmented stop table below the clicked card. Manual click-toggle works.
- `content/inlinePanel.js` is in the manifest load order between `detailOpener.js` and `sidebar.js`.

## Next steps
See `docs/BACKLOG.md` for the full feature backlog and Step 3 wiring plan.

## Safety
Interacts with a live booking system but books nothing. See `docs/SAFETY.md`.
Two allowed `.click()` sites only: Amazon refresh button (`refreshManager.js`) and load-card neutral zone (`detailOpener.js`).

## Documentation
- `MVP_SPECIFICATION.md` — original 18-stage plan
- `VISUAL_CONTEXT.md` — UI zones reference
- `AMAZON_DOM_REFERENCE.md` — DOM selectors reference
- `docs/SPEC.md` — working spec (updated during development)
- `docs/SAFETY.md` — click audit and forbidden selectors
- `docs/CHANGELOG.md` — full change history
- `docs/UI_ELEMENTS.md` — all UI elements with testids and current state
- `docs/BACKLOG.md` — planned features, Step 3 wiring plan, memory-leak audit tasks
- `docs/CLAUDE.md` — rules for Claude Code executor
- `docs/AMAZON_SELECTORS.md` — verified Amazon DOM selectors

## Installation
1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select this directory
4. Navigate to `https://relay.amazon.com`
