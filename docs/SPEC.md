# Product Specification — Amazon Relay Helper (MVP)

## What is this
Chrome extension that helps Amazon Relay carriers spot new high-paying
loads faster. It refreshes the load list, highlights new loads, plays
sounds, opens details of the top new load, and helps create Post-a-Truck
orders. The USER books manually — the extension never books.

## Target user
Carrier dispatchers monitoring the Amazon Relay Load Board.

## MVP features
1. Auto-refresh via Amazon's internal refresh button (speed slider)
2. Parse loads (Layout A and Layout B)
3. Detect new loads
4. Highlight new loads + play one sound
5. Auto-open details of highest-paying new load (neutral zone click)
6. Top sidebar + Chrome toolbar popup
7. 20 selectable notification sounds (Web Audio API)
8. PAT helper: fill Post-a-Truck form (user presses Submit)

## Non-goals (OUT OF SCOPE for MVP)
- Server / data upload (future Phase 2)
- Cross-account load visibility (future Phase 2)
- AI agent (future Phase 3+)
- Auto-booking / one-click booking (future, separate spec)
- Auto-Submit for PAT

## Constraints
- Must not break Amazon Relay UI
- Must work in user's existing logged-in session
- Must NEVER click booking buttons (architectural guarantee)
- Only two click types allowed: Refresh button, neutral zone
