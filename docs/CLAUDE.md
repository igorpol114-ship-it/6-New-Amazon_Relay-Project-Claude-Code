# Rules for Claude Code

## Working roles
- **Claude Desktop = Project Manager**: writes the prompts, tracks the project, decides sequencing. Does NOT write production code directly.
- **Claude Code = executor**: applies the prompts, writes the actual files.

## Token economy
- Do NOT request extra files or re-verify working code without a real need. If something already works, leave it alone.
- At the END of every completed step, write all changes/notes into the MD docs (CHANGELOG.md, UI_ELEMENTS.md, BACKLOG.md as appropriate).

## Before ANY change
1. Read SPEC.md, SAFETY.md, UI_ELEMENTS.md
2. Read CHANGELOG.md for recent changes
3. If adding any .click() — STOP unless it's Refresh or neutral zone

## After ANY change
1. Update CHANGELOG.md (date, file, what, why)
2. New UI element → add to UI_ELEMENTS.md
3. New Amazon selector → add to AMAZON_SELECTORS.md
4. Bug fixed → add test to TEST_CASES.md
5. New planned feature / backlog change → update BACKLOG.md

## Code rules
1. NEVER use jQuery
2. NEVER use inline event handlers
3. NEVER remove FORBIDDEN_SELECTORS
4. NEVER add .click() except Refresh button and neutral zone
5. NEVER create clickAutomation.js, autoBooking.js, or similar
6. NEVER click Book or Submit — user does those
7. Every UI element MUST have data-testid
8. Every function MUST have logger.log() at entry
9. Every catch MUST have logger.error() with context
10. NEVER use innerHTML with page data — use textContent

## Safety rules
1. Code clicking booking elements → STOP, report
2. Unsure about booking safety → ASK
3. NEVER modify FORBIDDEN_SELECTORS
4. Only allowed clicks: Refresh button, neutral zone

## Communication
1. Before work — short plan, wait for approval
2. Bug reported → reproduce in logs, then fix
3. After fix — explain what was wrong
4. Broke something else → say so immediately
5. Stop after each stage, wait for approval
