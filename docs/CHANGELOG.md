# Changelog

## [Unreleased]

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
