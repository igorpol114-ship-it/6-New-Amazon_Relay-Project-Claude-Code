# Amazon Relay Helper Extension

Chrome Extension (MV3, vanilla JS) for monitoring the Amazon Relay Load Board.

## Scope
Monitors loads, highlights new ones, plays sounds, opens details, shows an inline stop-detail panel. Does NOT book loads — the dispatcher books manually.

## Current status (2026-06-30)
- Stages 0–13 complete (core monitoring loop fully working).
- Sidebar: play/pause pill, speed slider, animated scanline, memory indicator dot (green→amber→red, manual dispatcher-triggered reload; no automatic reload).
- Popup: all controls fully wired to storage — Night Mode, Tab Alert, Sound (25 sounds + volume), Price Surge, Hide tag filters, Hide Similar Matches, Reset to Defaults.
- Inline panel (`content/inlinePanel.js`): collapsible segmented stop table below clicked card. Card Action Bar at bottom: screenshot→clipboard (camera), Google Maps route (map), create-post placeholder (not yet wired).
- `utils/loadStore.js` (LoadUnit): unified per-load data model, in-memory, updated each board tick and when detail sheet is opened.
- Automatic memory-watchdog reload removed (silently wiped Amazon filter state); replaced by manual `ext-memory-indicator` dot in sidebar.

## Next steps
See `docs/BACKLOG.md` for the full feature backlog.

## Safety
Interacts with a live booking system but books nothing. See `docs/SAFETY.md` for the full click audit.

Three allowed `.click()` sites on Amazon's own DOM:
- Refresh button — `refreshManager.js`
- Load-card neutral zone — `detailOpener.js`
- Detail-panel close — `panelCloser.js`

One extension-owned click (not Amazon DOM): `ext-memory-indicator` in `sidebar.js` — dispatcher-triggered `location.reload()` only; no automatic trigger.

## Documentation
- `MVP_SPECIFICATION.md` — original 18-stage plan
- `VISUAL_CONTEXT.md` — UI zones reference
- `AMAZON_DOM_REFERENCE.md` — DOM selectors reference
- `docs/SPEC.md` — working spec (updated during development)
- `docs/SAFETY.md` — click audit and forbidden selectors (canonical click-site policy)
- `docs/CHANGELOG.md` — full change history
- `docs/UI_ELEMENTS.md` — all UI elements with testids and current state
- `docs/BACKLOG.md` — planned features and backlog
- `docs/CLAUDE.md` — rules for Claude Code executor
- `docs/AMAZON_SELECTORS.md` — verified Amazon DOM selectors

## Installation
1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select this directory
4. Navigate to `https://relay.amazon.com`
