# Product Specification — Amazon Relay Helper (MVP)

## What is this
Chrome extension that helps Amazon Relay carriers spot new high-paying
loads faster. It refreshes the load list, highlights new loads, plays
sounds, opens details of the top new load, and helps create Post-a-Truck
orders. The USER books manually — the extension never books.

## Target user
Carrier dispatchers monitoring the Amazon Relay Load Board.

## MVP scope: Load Board only
This extension operates exclusively on the Amazon Relay Load Board
(Layout A: div.load-card). The Contracts / Block view (Layout B,
data-type tour-container, data-tag offer-row) is explicitly excluded
from this MVP — it is a future separate project with its own spec.

## MVP features
1. Auto-refresh via Amazon's internal refresh button (speed slider)
2. Parse loads — Load Board Layout A ONLY (div.load-card)
3. Detect new loads
4. Highlight new loads + play one sound
5. Auto-open details of highest-paying new load (neutral zone click)
6. Top sidebar + Chrome toolbar popup
7. 25 selectable notification sounds (Web Audio API)
8. PAT helper: fill Post-a-Truck form (user presses Submit)

## Non-goals (OUT OF SCOPE for MVP)
- Server / data upload (future Phase 2)
- Cross-account load visibility (future Phase 2)
- AI agent (future Phase 3+)
- Auto-booking / one-click booking (future, separate spec)
- Auto-Submit for PAT
- Contracts / Block / Layout B parsing (future separate project)

## Constraints
- Must not break Amazon Relay UI
- Must work in user's existing logged-in session
- Must NEVER click booking buttons (architectural guarantee)
- Only three click types allowed on Amazon DOM: Refresh button (refreshManager.js), load-card neutral zone (detailOpener.js), detail-panel close (panelCloser.js). See docs/SAFETY.md for the extension-owned memory-indicator click (not Amazon DOM).
