# Changelog

## [Unreleased]

### Stage 6 — 2026-06-02
- Added: content/refreshManager.js — findRefreshButton() (2-strategy fallback chain, NO .click()); refreshDryRun() (finds, logs, isForbiddenElement check, NO .click()); __EXT_DEBUG.refreshDryRun exposed for manual console testing only
- Updated: manifest.json — content/refreshManager.js added after storage.js, before sidebar.js
- Updated: docs/AMAZON_SELECTORS.md — replaced Refresh button TODO with verified fallback chain strategy (strategy 1: "Next Refresh" text → parent → button; strategy 2: SVG path d-attribute → .closest('button'))

### Stage 5 — 2026-06-02
- Added: utils/storage.js — storage object with async get/set/remove/getAll wrapping chrome.storage.local; STORAGE_KEYS.SPEED constant defined here
- Updated: manifest.json — utils/storage.js added after logger.js, before sidebar.js
- Updated: content/sidebar.js — buildSidebar made async; restores saved speed from storage before attaching listeners; slider input persists STORAGE_KEYS.SPEED

### Stage 4 — 2026-06-02
- Updated: content/sidebar.js — added ext-btn-toggle (Start/Stop, data-running state), ext-slider-speed (0.5–8s step 0.5 default 2), ext-slider-value (one decimal); removed ext-status and ext-count; addEventListener only, no Amazon clicks, no setInterval
- Updated: docs/UI_ELEMENTS.md — registered Stage 4 elements; removed ext-status and ext-count

### Stage 3 — 2026-06-02
- Added: content/sidebar.js — buildSidebar() injects fixed top-center bar with title; guard against double injection; CSS via style.textContent (static only)
- Updated: manifest.json — added content/sidebar.js before content/content.js in js array
- Updated: content/content.js — removed self-test lines; calls buildSidebar() on load
- Updated: docs/UI_ELEMENTS.md — added ext-sidebar and ext-sidebar-title entries

### Stage 2 — 2026-06-02
- Updated: utils/constants.js — added ALLOWED_CLICK_INTENTS (REFRESH, NEUTRAL_ZONE), EXT_NAME, EXT_VERSION, DEBUG_LEVEL; FORBIDDEN_SELECTORS + isForbiddenElement untouched
- Updated: utils/logger.js — debug() now gated by DEBUG_LEVEL constant
- Updated: content/content.js — 4-level self-test (log/warn/error/debug) on load

### Stage 1 — 2026-06-02
- Added: manifest.json (MV3, host_permissions relay.amazon.com only)
- Added: utils/constants.js (FORBIDDEN_SELECTORS, isForbiddenElement)
- Added: utils/logger.js (logger.log, logger.warn, logger.error, logger.debug)
- Added: content/content.js (skeleton — logs "extension loaded" only)

### Stage 0 — 2026-06-02
- Added: documentation foundation (docs/ + README)
