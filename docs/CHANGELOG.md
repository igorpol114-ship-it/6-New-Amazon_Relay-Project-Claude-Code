# Changelog

## [Unreleased]

### 2026-06-18 — Fix global stop numbers in inline panel stop-detail table

**Root cause:** `parseStopBlock()` always returned `num: ''` (hardcoded empty string). `buildSegmentTable()` gates the `.ext-stop-num` circle span on `if (stop.num)` — since `num` was never assigned, no stop-number circles appeared in the expanded stop table.

**Fix:** added a post-processing loop in `readSheetData()` (after all segments are built, before the route calculation and return). For segment index `N` (0-based), stop at position `k` within the segment receives global number `N+1+k`. This produces the correct shared-stop numbering:
- Segment 0: stops [1, 2]
- Segment 1: stops [2, 3]  ← 2 is shared
- Segment 2: stops [3, 4]  ← 3 is shared

No rendering changes — `buildSegmentTable()` already rendered circles when `stop.num` was truthy.

- **`content/inlinePanel.js`**: added global-stop-number assignment loop in `readSheetData()`.

---

### 2026-06-18 — Remove temporary DIAG logs from loadObserver.js

- **`content/loadObserver.js`**: removed all temporary DIAG logs added during debugging:
  the DOM-snapshot block in `startLoadObserver()`, the per-callback mutation detail log
  (`DIAG callback: fired` with batchSize / target / added / removed class dump), the
  `var m0` binding that existed only to feed those logs. Replaced DIAG-prefixed callback
  status logs with standard operational logs (`mutation: ext-managed change only — ignored`,
  `mutation: not running — ignored`, `mutation: external change — debouncing`).
  All CLAUDE.md-required logs retained: `logger.log()` at each function entry,
  `logger.error()` in catches, standard pipeline result logs.
  File header updated to remove "DIAG logs remain" note.

---

### 2026-06-18 — Fix MutationObserver (attempt 3): broad hasExternalChange filter + _pipelineRunning guard

**Root cause of attempt 2 failure:** `hasLoadCardChange()` matched mutations by specific class names (`'load-card'`, `'load-list'`). Amazon wraps the load-list in React container nodes whose roots have dynamic/hashed class names (`css-xyz`). Those wrapper nodes ARE added to the DOM when the filter changes — but they don't carry `load-card` or `load-list` classes. All four cases in `hasLoadCardChange()` missed them. The observer WAS firing; the filter killed the debounce before it started.

**Fix:** replaced `hasLoadCardChange()` with `hasExternalChange()` — fires for ANY childList mutation that doesn't involve ext-managed nodes, regardless of class names. Amazon's non-load updates are mostly `characterData` or `attribute` mutations which `childList` doesn't observe; the rare non-load `childList` mutation triggers a pipeline pass that calls `detectNewLoads()`, finds `newCount=0`, and exits silently.

Added `_pipelineRunning` boolean guard: prevents two concurrent observer pipeline runs (e.g., Amazon's sheet DOM mutations trigger the observer while the first pipeline is still inside `await sleep(800)`). `orchTickRunning` guard unchanged.

- **`content/loadObserver.js`**: `hasLoadCardChange()` removed; `hasExternalChange()` added (broad, class-name-agnostic). `_pipelineRunning` flag added to `runObserverPipeline()` with `try/finally` reset. DIAG logs unchanged — every callback still logs target/class/running state.

---

### 2026-06-18 — Fix MutationObserver: anchor on document.body to survive container replacement

**Root cause diagnosed:** the observer was bound to `div.load-list` with `subtree:false`. Amazon is a React SPA — changing a filter unmounts the entire `div.load-list` and mounts a fresh one. The old node is detached; an observer on a detached node never fires. The observer went deaf the moment the container was replaced.

**Fix:** anchor on `document.body` (never replaced), observe `{ childList: true, subtree: true }`. Filter every callback with `hasLoadCardChange()` so only load-card or load-list node changes trigger the debounce — Amazon's unrelated UI updates (countdown, breadcrumbs, etc.) are immediately discarded.

- **`content/loadObserver.js`** — complete rewrite:
  - `isExtManagedNode()` updated: now also catches id/data-testid starting with `'ext-'` (covers surge badges with `data-testid="ext-surge-badge"`).
  - `hasLoadCardChange(mutations)` — new filter function. Four cases covered: (1) `mutation.target` is a `div.load-list`; (2) added `div.load-card/load-card__selected`; (3) added/removed `div.load-list` (container replaced); (4) added wrapper contains `div.load-card` or `div.load-list` inside (intermediate parent replaced). Each hit logs a `DIAG` line.
  - `startLoadObserver()` — now observes `document.body` with `{ childList:true, subtree:true }`. Removed `findLoadListContainer()` (no longer needed as the anchor).
  - Observer callback logs every invocation (`DIAG callback: fired`) with batch size, first mutation's target/added/removed class for diagnosis. Logs are intentionally left in until user confirms the fix works.

- **`docs/AMAZON_SELECTORS.md`**: MutationObserver anchor section updated — anchor is now `document.body` with explanation of why `div.load-list` was volatile.

---

### 2026-06-18 — Instant new-load detection via MutationObserver

New `content/loadObserver.js` — supplements the timer tick with a `MutationObserver` on `div.load-list` that runs the existing detection pipeline the moment Amazon's DOM changes (new loads pushed by Amazon, or filter-param change reloads the list). No new `.click()` sites — reuses `openTopNewLoad` neutral-zone click exactly as the tick does.

- **`content/loadObserver.js`** *(new)*:
  - `findLoadListContainer()` → `document.querySelector('div.load-list')` (first, same as parser).
  - `isExtManagedNode(node)` — filters our own `div#ext-inline-panel` insertions (direct child of load-list) and non-element nodes from triggering the pipeline. Prevents infinite observer loop.
  - `runObserverPipeline()` — async. Runs `parseLoads → detectNewLoads → checkPriceSurge → highlightNewLoads → playAlert → flashTabAlert → openTopNewLoad → showInlinePanel → tabState.set('running', false)`. Guards against concurrent tick via `orchTickRunning` flag. Idempotent: `detectNewLoads` diffs against `knownLoadIds`; back-to-back observer+tick pass finds `newCount=0` on the second run — no duplicate alert, no timer reset needed.
  - `startLoadObserver()` — creates observer with `{ childList: true, subtree: false }` and calls `.observe()` on the container. No-op if already active.
  - `stopLoadObserver()` — disconnects observer, cancels pending debounce. Safe to call when inactive.
  - Debounce: 200ms — coalesces burst mutations from filter changes.

- **`content/content.js`**: in `tabState.subscribe('running', fn)` — added `startLoadObserver()` on `val=true`, `stopLoadObserver()` on `val=false`. Added `stopLoadObserver()` before `location.reload()` in memory watchdog path.

- **`manifest.json`**: added `"content/loadObserver.js"` between `"content/panelCloser.js"` and `"content/content.js"`.

---

### 2026-06-18 — Remove filter-panel auto-close; left filter stays open by default

All code that attempted to auto-close the left filter popover on loop start has been removed. Three separate strategies were tried (close-button search, toggle-button click, Escape dispatch + retry) and none worked reliably against Amazon's DOM. The left filter panel is now intentionally left alone — it stays open or closed however the user left it. The right detail-panel auto-close is unchanged and working.

- **`content/panelCloser.js`**: removed `diagFilterPanel()`, `isFilterPanelOpen()`, `findFilterCloseButton()`, `tryCloseFilterPanel()`. `closePanelsForStart()` now contains only the detail-panel close block. File header updated.
- **`utils/constants.js`**: removed `CLOSE_FILTER_PANEL` from `ALLOWED_CLICK_INTENTS`. Comment updated from "Exactly four" to "Exactly three".
- **`docs/SAFETY.md`**: removed Click 3 (filter panel close) section including the Escape fallback note. Click 4 (detail panel) renumbered to Click 3. Counts updated from four to three throughout.
- **`docs/CLAUDE.md`**: rule 4 and safety rule 4 — removed filter-panel close from allowed click list. "Four" → "three".
- **`docs/AMAZON_SELECTORS.md`**: removed entire Filter panel close section. Detail panel close reference updated from Click 4 → Click 3.
- **`docs/UI_ELEMENTS.md`**: panelCloser description updated — filter panel mention removed.

---

### 2026-06-18 — FIX 1 (attempt 3): filter panel close — full diagnostic + retry + Escape fallback

**Why previous attempts failed:** the selector `button[aria-label="Filter"][aria-expanded="true"]` is case-sensitive. Amazon may use a different label casing or may not put `aria-expanded` on the button at all. Also `closePanelsForStart()` fires synchronously on loop start — the popover may not be present in the DOM yet at t=0.

- **`content/panelCloser.js`** — complete rewrite of filter close logic:
  - `diagFilterPanel()` — new diagnostic helper. Logs every `[aria-expanded="true"]` element (tag, aria-label, aria-controls, aria-haspopup, role, id, text) and every `button[aria-label]` containing "filter" (ariaLabel, ariaExpanded, ariaControls, ariaHaspopup, ariaPressed, visible). Runs on every `findFilterCloseButton()` call.
  - `isFilterPanelOpen()` — new helper. Returns true if a filter toggle button with `aria-expanded="true"` is present (case-insensitive), or any `button[aria-expanded="true"]` with "filter" in label, or a visible "Filter…" heading is in the DOM.
  - `findFilterCloseButton()` — enhanced. Strategy 0 now case-insensitive (`button[aria-label="Filter" i][aria-expanded="true"]`). Strategy 0b added: any `button[aria-expanded="true"]` whose aria-label includes "filter" (case-insensitive). Strategies 1–3 unchanged as fallbacks. Calls `diagFilterPanel()` on entry for live logging.
  - `tryCloseFilterPanel(attemptsLeft)` — new retry wrapper. Polls up to 3 times at 250ms intervals (total 750ms, within the 1200ms settle window). If all retries fail and `isFilterPanelOpen()` returns true, dispatches `Escape` keydown on `document.body` as last resort (Amazon React popovers close on Escape).
  - `closePanelsForStart()` — now calls `tryCloseFilterPanel(3)` instead of inline filter close. Detail panel close unchanged.

- **`docs/AMAZON_SELECTORS.md`**: Filter panel close section updated — Strategy 0 now case-insensitive; Strategy 0b added; retry + Escape fallback documented.
- **`docs/SAFETY.md`**: Added note to Click 3 — Escape keydown fallback (not a `.click()`, cannot trigger booking; only dispatched when popover appears open but no button was found after 3 retries).

---

### 2026-06-18 — FIX 1 (attempt 2): filter panel close; FIX 2: manual card open stops loop

- **`content/panelCloser.js`** — FIX 1: `findFilterCloseButton()` — prepended Strategy 0 (primary): `document.querySelector('button[aria-label="Filter"][aria-expanded="true"]')`. The filter control is a toggle button, not a panel with a separate X button — clicking it when `aria-expanded="true"` closes the popover. Existing strategies 1–3 retained as fallbacks for layout changes. No new whitelist entry needed; CLOSE_FILTER_PANEL already covers this.
- **`content/inlinePanel.js`** — FIX 2: `initManualToggle()` — inside the `waitForSheet` callback (toggle-on path), added `tabState.set('running', false)` in its own try/catch before `showInlinePanel`. Fires only when a user manually clicks a load card; the extension's own auto-open path (`openTopNewLoad` → `content.js`) already stops via the same call there. Per-tab only (tabState, not storage.local).
- **`docs/AMAZON_SELECTORS.md`**: updated Filter panel close section — Strategy 0 added as the primary approach (`button[aria-label="Filter"][aria-expanded="true"]`); existing strategies renumbered 1–3.

---

### 2026-06-18 — Auto-close filter + detail panels on loop start

- **`content/panelCloser.js`** *(new)*: `closePanelsForStart()` closes the filter popover and the load-detail sheet (`#selected-work-sheet`) once per loop start by clicking their own close controls. Two new allowed click sites (authorized in SAFETY.md). `findFilterCloseButton()`: 3-strategy search — (1) button with aria-label containing "filter"+"close", (2) panel identified by "Filter…" heading ancestor → button with aria-label "close", (3) icon-only button fallback. `findDetailCloseButton()`: (1) `button[aria-label*="close" i]` inside `#selected-work-sheet`, (2) icon-only button fallback. Every path guarded by `isForbiddenElement()`. Each close wrapped in its own try/catch; logs and skips silently when a panel is not open.
- **`content/content.js`**: added `closePanelsForStart()` call in the `tabState.subscribe('running', fn)` subscriber, before `startOrchestrator()`. Fires once per loop start; does not re-fire while loop is running.
- **`manifest.json`**: `"content/panelCloser.js"` inserted before `"content/content.js"`.
- **`utils/constants.js`**: added `CLOSE_FILTER_PANEL` and `CLOSE_DETAIL_PANEL` to `ALLOWED_CLICK_INTENTS`. Updated comment from "Only these two" to "Exactly four".
- **`docs/SAFETY.md`**: binding boundary updated to four click sites; Click 3 (filter close) and Click 4 (detail close) sections added with rationale, safety argument, gates, and intent constants. Audit checklist updated to name all four sites.
- **`docs/CLAUDE.md`**: rule 4 updated to name all four allowed click sites explicitly.
- **`docs/AMAZON_SELECTORS.md`**: Filter panel close and Detail panel close sections added with selector strategies and re-verify warnings.

---

### 2026-06-18 — Sidebar: remove surge threshold field

- **`content/sidebar.js`**: removed `sidebar-surge-label` span (`↑$`), `sidebar-surge-threshold` number input, the `surgeInput.value` seed line, and the `saveSurgeThreshold` function + its two `addEventListener` calls. Removed the three CSS rule blocks for those two testids (including the webkit spin-button suppression). `tabState.surgeThreshold` logic in `utils/tabState.js` and `content/priceSurge.js` is unchanged — per-tab threshold still works, just no longer exposed in the sidebar UI.

---

### 2026-06-18 — Per-tab state isolation: running, speed, surge threshold, price history

**Problem:** `chrome.storage.local` is shared across all tabs. Auto-stopping in Tab A also stopped Tab B; speed and surge-threshold changes in one tab affected every other tab.

**Solution:** four fields moved out of `chrome.storage.local` into an in-memory + sessionStorage per-tab store (`tabState`). Global settings (nightMode, sounds, tag filters, `surgeEnabled`) are unchanged.

- **`utils/tabState.js`** *(new)*: IIFE exposing `{ init, get, set, subscribe }`. `_state` holds `{ running, refreshIntervalMs, surgeThreshold, priceHistory }`. `set()` updates `_state`, mirrors refreshIntervalMs / surgeThreshold / priceHistory to sessionStorage (running stays memory-only), then calls all synchronous subscribers for that key. `init()` is async: reads sessionStorage for speed/history/threshold; if no threshold in sessionStorage, reads the popup global from `chrome.storage.local[surgeThreshold]` as the default for a new tab, then resolves.

- **`manifest.json`**: added `"utils/tabState.js"` immediately after `"utils/storage.js"` so it is available to all content scripts.

- **`content/sidebar.js`**: removed `async` (no more awaits). Removed both `await storage.get(SPEED/RUNNING, ...)` init reads — replaced with synchronous `tabState.get(...)`. `toggleRunning()` now calls `tabState.set('running', nowRunning)` instead of `storage.set(RUNNING, ...)`; removed direct `reflectRunning()` call (subscriber fires it synchronously). Slider writes `tabState.set('refreshIntervalMs', sec * 1000)` instead of `storage.set(SPEED, ...)`. Removed entire `chrome.storage.onChanged.addListener` block (both RUNNING and SPEED branches). Added `tabState.subscribe('running', reflectRunning)` so the pill flips when the orchestrator auto-stops. Added surge-threshold inline field: `<input type="number" data-testid="sidebar-surge-threshold">`, seeded from `tabState.get('surgeThreshold')`, writes `tabState.set('surgeThreshold', n)` on input/change.

- **`content/content.js`**: removed `chrome.storage.onChanged.addListener` for RUNNING; replaced with `tabState.subscribe('running', fn)` (registered synchronously before the async IIFE). `scheduleNextTick()` made synchronous: reads `tabState.get('running')` and `tabState.get('refreshIntervalMs')` directly. Both auto-stop blocks (new-load + surge) changed from `await storage.set(RUNNING, false); stopOrchestrator()` to `tabState.set('running', false)` — the subscriber calls `stopOrchestrator()` synchronously. Wrapped page-load init in `(async function(){ await tabState.init(); buildSidebar(); initManualToggle(); ... })()` so tabState is seeded before sidebar reads it. Memory-reload resume path changed from `storage.set(RUNNING, true)` to `tabState.set('running', true)`.

- **`content/priceSurge.js`**: removed `SURGE_THRESHOLD` and `PRICE_HISTORY` from `chrome.storage.local.get()` — now only reads `SURGE_ENABLED` from storage. Reads threshold via `tabState.get('surgeThreshold')`. Reads history via `tabState.get('priceHistory')`. Writes rebuilt history via `tabState.set('priceHistory', newHistory)` (synchronous, no await). Resets history on disable via `tabState.set('priceHistory', {})`.

---

### 2026-06-17 — Memory-pressure watchdog: rare auto-reload + resume

- **`content/content.js`**:
  - Added constants: `MEMORY_RELOAD_RATIO = 0.7`, `MEMORY_RELOAD_MIN_BYTES = 500 MB`. Both must be exceeded before a reload is considered (prevents reloads in healthy short sessions).
  - Added `shouldReloadForMemory()`: reads `performance.memory` (guards `undefined` → `false`), logs heap stats (usedMB / limitMB / ratio), returns `true` only when `used >= 500 MB && ratio >= 0.7`. `logger.log` on entry, `logger.error` in catch.
  - At the end of `orchestratorTick` try-block, after the new-load / surge branches: when `result.newCount === 0 && surgeLoads.length === 0` (loop still running, nothing for dispatcher) and `shouldReloadForMemory()` is true → sets `sessionStorage['ext_resume_after_memory_reload'] = '1'` and calls `location.reload()`.
  - Page-load init replaced: reads `sessionStorage['ext_resume_after_memory_reload']`; if `'1'` → removes key, logs, calls `storage.set(RUNNING, true)` (existing `onChanged` listener fires `startOrchestrator()`). Otherwise → existing `RUNNING=false` forced, manual Start required as before.

---

### 2026-06-17 — Price Surge: remove diagnostic code (feature confirmed working)

- **`content/priceSurge.js`**: removed all temporary debug code — per-tick `SURGE-DBG tick:` log, per-load `SURGE-DBG id=...` log, and `window.__EXT_DEBUG.simulateSurge` test hook. No behavior change; surge logic, highlight, badge, sound, and auto-stop remain intact. `grep SURGE-DBG|simulateSurge` → 0 matches.

---

### 2026-06-17 — Price Surge: diagnostics + simulateSurge test hook

- **`content/priceSurge.js`** (debug only — no behavior change):
  - **Part A — per-tick debug log** (marked `// DEBUG: remove later`): logs once per call to `checkPriceSurge` after reading storage — `SURGE-DBG tick: enabled=<bool> historySize=<n> loadsThisTick=<n>`. Shows whether the engine runs, whether surge is enabled, and whether history is populated.
  - **Per-load debug log** widened: previously only logged when `payout !== prev`; now logs for **every load where `prev !== undefined`** regardless of change — `SURGE-DBG id=<loadId> prev=<prev> now=<payout> delta=<delta> thr=<threshold> trig=<bool>`. Makes stable-price ticks visible for confirming loadId stability across refreshes.
  - **Part B — `window.__EXT_DEBUG.simulateSurge(loadId, amount)`**: console-callable test hook. Reads current loads via `parseLoads()`, parses payout, sets `PRICE_HISTORY[loadId] = payout - amount` so the **next orchestrator tick** sees delta = +amount and must trigger if amount >= threshold. Logs loadId, fakePrev, currentPayout, and expected delta to console. Default: first visible load, amount = $100.

---

### 2026-06-16 — Inline panel: center route arrow between equal-width origin/dest halves

- **`content/inlinePanel.js`** (CSS + builder, no behavior change):
  - `.ext-seg-route` grid changed from `150px 1fr` (fixed-left) to `1fr auto 1fr` (symmetric). Arrow column is `auto` (glyph width only), so origin and destination halves are always equal regardless of text length. Arrow stays centered at all times.
  - `.ext-route-origin`: `text-align` changed from `right` to `center`; `min-width:0` kept so the cell can shrink. Text wraps within its half.
  - `.ext-route-dest`: added `overflow-wrap:break-word; word-break:break-word; min-width:0; text-align:center` — previously had none of these.
  - `.ext-route-right` wrapper removed from both CSS and JS. Arrow and destination are now direct children of `.ext-seg-route`, sitting in columns 2 and 3 of the 3-column grid.
  - Arrow margin tightened from `0 0.45em` to `0 0.35em` (less gap against the tighter `auto` column).

---

### 2026-06-16 — Tag filters: add "Booked before" toggle + fix leftover space (display:none + wrapper collapse)

- **`utils/storage.js`**: added `HIDE_PAST_BOOK: 'hidePastBook'`.
- **`content/filterTags.js`**:
  - Added 4th tag state: `pastBook`. Queries `[id="PAST_BOOK"]` via `querySelectorAll`, never `getElementById`.
  - **Bug fix — leftover space**: changed all tag hiding from `visibility:hidden` to `display:none`, so the tag element's space collapses entirely.
  - **Wrapper collapse**: new `recomputeWrappers()` — after hiding individual tags, iterates every `.wo-tag` wrapper. If ALL its known tag children (`[id="PROMOTED"]`, `[id="STARTING_SOON"]`, `[id="TRAILER_READY"]`, `[id="PAST_BOOK"]`) are `display:none`, the wrapper itself is set to `display:none` to remove the remaining gap. Restores `display:''` when any child becomes visible again. Wrappers with no known tag children are never touched.
  - Observer and `anyOn` guard updated to include `pastBook`.
- **`popup/popup.html`**: 4th toggle "Booked before" added to `.popup-tag-block`; `id="popup-hide-past-book"`, `data-testid="popup-hide-past-book"`. No inline handlers.
- **`popup/popup.css`**: `.popup-tag-block` gap reduced from `6px` to `4px` to accommodate 4 items cleanly.
- **`popup/popup.js`**: `KEY_HIDE_PAST_BOOK`, element ref, load-on-open, `addEventListener('change')`, `onChanged` entry — wired identically to the other three tag toggles.

---

### 2026-06-16 — Price Surge: price-only highlight + auto-stop + open details

- **`content/priceSurge.js`**:
  - Removed full-card `.ext-surge-load` yellow background. Now highlights only the payout element: `.ext-surge-price` (green text + subtle green tint on `.wo-total_payout`). Injects a sibling badge span (`'↑ +$' + Math.round(delta)`) via `textContent` with `data-testid="ext-surge-badge"`. `clearSurgeHighlights()` removes both the class and every `[data-testid="ext-surge-badge"]` badge so stale badges never accumulate.
  - `checkPriceSurge` now **returns** an array of surge load objects (the full load, including `_element`). `priceSurge.js` itself never calls `.click()`.
- **`content/content.js`**: captures `surgeLoads = await checkPriceSurge(loads)`. Added `else if (surgeLoads.length > 0)` branch that mirrors the new-load auto-stop pattern exactly: `openTopNewLoad(surgeLoads)` (existing neutral-zone click — no new `.click()` sites), `sleep(800)`, `showInlinePanel`, then `storage.set(RUNNING, false)` + `stopOrchestrator()`. Surge branch only fires when `result.newCount === 0` (new loads take priority).

---

### 2026-06-16 — Price Surge Alert: implement + fix persistence bug

- **Root cause of persistence bug:** `popup-surge` and `popup-surge-threshold` were completely absent from `popup.js` — no key constants, no element refs, not in the storage read, no write handlers, not in the `onChanged` listener. The HTML `value="50"` attribute was the only source of truth, causing the field to revert on every popup open.
- **`utils/storage.js`**: added `SURGE_ENABLED: 'surgeEnabled'`, `SURGE_THRESHOLD: 'surgeThreshold'`, `PRICE_HISTORY: 'priceHistory'` to `STORAGE_KEYS`.
- **`popup/popup.js`**: wired `popup-surge` and `popup-surge-threshold` following the same pattern as all other controls — key constants, element refs, included in `chrome.storage.local.get([...])`, load callback, write handlers (`addEventListener` on `'input'`+`'change'` for threshold, `'change'` for toggle; invalid/NaN values silently skipped without overwriting), `onChanged` live-sync. `console.log` on both load and save paths for console verification.
- **`content/priceSurge.js`** (new): `checkPriceSurge(loads)` — single storage read per tick (`SURGE_ENABLED`, `SURGE_THRESHOLD`, `PRICE_HISTORY`); if disabled clears highlights and resets `PRICE_HISTORY` to `{}`; builds `newHistory` from scratch each tick (auto-purges gone loads); triggers only on payout increases `>= threshold`; applies `.ext-surge-load` (amber `rgb(255,214,102)`) via `classList`; calls `playAlert()` on new surge cards. DEBUG log on any payout change (any direction) for verification. Style injection idempotent by `<style id="ext-surge-style">`.
- **`content/content.js`**: `await checkPriceSurge(loads)` inserted after `detectNewLoads(loads)`, before the new-load branch — runs every tick unconditionally.
- **`manifest.json`**: `content/priceSurge.js` added after `soundAlert.js` (needs `playAlert`) and before `content.js`.

---

### 2026-06-16 — Inline panel: right-align origin in route cell

- **`content/inlinePanel.js`** (CSS only): added `text-align:right` to `.ext-route-origin`. Origin text is now flush against the arrow on its right edge; arrows stay in the same vertical column; outer columns unaffected.

---

### 2026-06-16 — Inline panel: remove status/action badges + align route arrows

- **`content/inlinePanel.js`** (CSS + builder, no data/logic change):
  - **Status column** (Loaded/Empty): removed `.ext-badge-loaded` / `.ext-badge-empty` pill rules. Now plain text directly on `.ext-seg-status` span. Green `#1a5c38` / bold for Loaded (`.ext-seg-loaded`), muted `#878787` for Empty (`.ext-seg-empty`).
  - **Action column** (Drop/Live/Preloaded): removed `.ext-badge-action` pill rule. Plain text directly on `.ext-seg-action` span, muted `#565959`.
  - **Route arrows aligned**: `.ext-seg-route` converted from inline-flow to inner 2-column grid `150px 1fr`. Origin occupies the fixed 150px column; a new `.ext-route-right` wrapper spans `[arrow + destination]` in the remaining `1fr` column. All arrows now stack in a single vertical column regardless of origin length. `min-width:0` on both sub-columns keeps the outer grid unaffected.

---

### 2026-06-16 — Inline panel: visual redesign of segment-header rows

- **`content/inlinePanel.js`** (CSS + builder, no data/logic change):
  - **Grid**: `40px minmax(0,3fr) 1.4fr 1fr 1fr 32px` (wider route column, fuller width). Vertical padding increased to 10px for better readability.
  - **Route connector**: `fromToSpan` is now three separate DOM nodes — `.ext-route-origin` + `.ext-route-arrow` + `.ext-route-dest` — all set via `textContent`, no innerHTML. Origin and destination render in a monospace stack (`ui-monospace,"SF Mono",Menlo,Consolas,monospace` 11px) for readable IDs. Arrow `→` is bold, 1.15em, `#1a5c38` accent — clearly visible separator between endpoints.
  - **Distance·time**: `.ext-seg-dist` — muted `#878787`, 11px, centered, so it recedes behind the route.
  - **Badges**: "Loaded" → `.ext-badge-loaded` (filled `#1a5c38` green pill); "Empty" → `.ext-badge-empty` (muted outline pill); Drop/Live/Preloaded → `.ext-badge-action` (neutral `#e8edf0` grey pill). Each badge sits inside a `.ext-seg-action` / `.ext-seg-status` wrapper cell for independent CSS targeting and `text-align:center`.
  - Action span always emitted (grid slot kept); badge only rendered when `loadType` is non-empty.

---

### 2026-06-16 — Inline panel: fix segment-header column alignment

- **`content/inlinePanel.js`** (CSS + builder only, no data/logic change):
  - `.ext-seg-header`: changed from `display:flex; justify-content:space-between` to `display:grid; grid-template-columns:32px minmax(0,2.2fr) 1.2fr 1fr 1fr 28px` — 6 fixed columns matching the 6 rendered fields (number / route / dist·time / action / status / arrow). Column edges now align identically across all segment rows.
  - Added `.ext-seg-route{min-width:0; overflow-wrap:break-word; word-break:break-word}` — route text wraps inside column 2 instead of overflowing or truncating. Rows may be taller when route is long; column alignment is unaffected.
  - `.ext-seg-title` and `.ext-seg-arrow` gain `text-align:center` and tighter padding (`0 4px`) to match their fixed 32/28 px columns.
  - `buildPanelElement`: `loadTypeSpan` is now always emitted (empty string when absent) so all 6 grid columns are always present. Previously the span was conditional, which collapsed the grid and shifted later columns.

---

### 2026-06-15 — Step 3: Tag filters — hide badge only (not the card)

- **`content/filterTags.js`:** changed hiding strategy from `card.style.display = 'none'` to `tagEl.style.visibility = 'hidden'` on the tag element itself. Cards stay fully visible and clickable; only the purple badge is hidden. `recomputeTagHiding()` now queries each tag id directly (`[id="PROMOTED"]` etc.) and sets `visibility` per toggle state — no card-root traversal. Restores `visibility = ''` when toggled off.
- **`content/loadDetector.js`:** reverted the `offsetParent === null` exclusion added in the previous step — it was needed only while cards were `display:none`. All cards now participate in new-load detection normally.

---

### 2026-06-15 — Step 3: Hide tag filters (Promoted / Starting soon / Trailer ready)

- **`utils/storage.js`:** added `HIDE_PROMOTED: 'hidePromoted'`, `HIDE_STARTING_SOON: 'hideStartingSoon'`, `HIDE_TRAILER_READY: 'hideTrailerReady'` (all boolean, default false).
- **`content/filterTags.js`** (new): `recomputeTagHiding()` iterates all card roots (`div.load-card, div.load-card__selected, div.wo-card-header--highlighted`), checks each for `[id="PROMOTED"]` / `[id="STARTING_SOON"]` / `[id="TRAILER_READY"]` descendants, sets `card.style.display = 'none'` or `''`. Uses `querySelectorAll` (never `getElementById`) because Amazon duplicates these ids across cards. `MutationObserver` active only while ≥1 toggle is on; disconnects when all off. `applyTagHiding()` called on init (reads storage) and on `chrome.storage.onChanged`. No `.click()`, no innerHTML.
- **`content/loadDetector.js`:** `detectNewLoads()` filter now also excludes loads where `load._element.offsetParent === null` — hidden cards (display:none or ancestor hidden) are never detected as new, never highlighted, never trigger sound or auto-open.
- **`popup/popup.html`:** replaced single "Hide Promoted & Starting Soon" row with `.popup-tag-block` — three compact columns, each with a small label (`Promoted` / `Starting soon` / `Trailer ready`) and a small toggle (`toggle-switch--sm`). ids: `popup-hide-promoted`, `popup-hide-starting-soon`, `popup-hide-trailer-ready`.
- **`popup/popup.css`:** added `.popup-tag-block`, `.popup-tag-filter`, `.popup-tag-label`, `.toggle-switch--sm` (30×16 px variant with 10 px dot and 14 px translate).
- **`popup/popup.js`:** three new key vars; all three read on popup open, written on `change`, synced via `chrome.storage.onChanged`. Updated WIRED/NOT-WIRED comment.
- **`manifest.json`:** `content/filterTags.js` inserted after `content/filterSimilar.js`.

---

### 2026-06-15 — Step 3: Sound block — expanded to 25 sounds

- **`content/soundAlert.js`:** replaced 3-branch if-else with `SOUND_DEFS` dispatch table (25 entries). Added `freqEnd` support to `playSoundConfig`: if a tone descriptor has `freqEnd`, oscillator frequency ramps linearly from `freq` to `freqEnd` over the tone duration using `setValueAtTime` + `linearRampToValueAtTime`. `getSoundTones()` now delegates to `SOUND_DEFS[soundId] || SOUND_DEFS['default']`. New sounds: bell, deep, high, click, ding, sonar, low, blip, wood, double, notify, drop, triple, alarm, fanfare, sparkle, sweep_up, sweep_down, chord, dial, burst, error.
- **`popup/popup.html`:** `<select id="popup-sound-select">` expanded from 3 to 25 `<option>` elements.
- **`popup/popup.js`:** `popupGetSoundTones()` replaced with `POPUP_SOUND_DEFS` dispatch table (identical 25 configs). `previewSound()` updated to handle `freqEnd` the same way as `playSoundConfig`.

---

### 2026-06-11 — Step 3: Sound block wired (persistence + preview)

- **`utils/storage.js`:** removed `SOUND_MUTED: 'soundMuted'`; added `VOLUME: 'soundVolume'` (number 0–100, default 70) and `SOUND_ID: 'soundId'` (string, default `'default'`).
- **`content/soundAlert.js`:** refactored. `getSoundTones(soundId, startTime)` — pure function, returns tone descriptors for `'default'` / `'soft'` / `'sharp'`. `playSoundConfig(soundId, gainPeak)` — async, resumes AudioContext, schedules oscillators. `playAlert()` — reads `VOLUME` + `SOUND_ID` from storage; returns early if `VOLUME === 0`; scales gain as `VOLUME / 100`. No more `SOUND_MUTED`.
- **`popup/popup.html`:** wrapped `<select>` and new replay `<button>` in `.popup-sound-select-row` div. New element: `id="popup-sound-replay"`, `data-testid="popup-sound-replay"`, `aria-label="Preview sound"`.
- **`popup/popup.css`:** added `.popup-sound-select-row` (flex row) and `.popup-sound-replay` (28×28 px icon button, green on hover) styles.
- **`popup/popup.js`:** Sound block fully wired. On open: reads `soundVolume` + `soundId` from storage, sets slider and dropdown (defaults: 70 / `'default'`). Slider writes on `change` (released, not every `input`). Dropdown writes on `change` then plays preview. Replay button plays preview of current selection at current volume. `previewSound(soundId, volume)` — mirrors `soundAlert.js` configs exactly (same `getSoundTones` logic) using a popup-local `AudioContext`. Live sync via `chrome.storage.onChanged`.

---

### 2026-06-11 — Step 3: Tab Alert wired

- **`utils/storage.js`:** added `TAB_ALERT: 'tabAlert'` to `STORAGE_KEYS`.
- **`content/tabAlert.js`** (new): `flashTabAlert()` — async, reads `STORAGE_KEYS.TAB_ALERT`; if enabled, swaps favicon to an orange "!" canvas icon and blinks the document title with "🔔 " prefix at 750 ms intervals for 10 s total. `stopTabAlert()` restores title and favicon; called automatically on `visibilitychange` (user focuses tab) or after duration. Both functions exposed on `window.__EXT_DEBUG`. No `.click()` calls.
- **`manifest.json`:** `content/tabAlert.js` inserted after `content/soundAlert.js`, before `content/detailOpener.js`.
- **`content/content.js`:** `flashTabAlert()` called in `orchestratorTick()` after `playAlert()` when new loads are found (`result.newCount > 0` branch). Not awaited — fire-and-forget is fine since the blink runs on its own timer.
- **`popup/popup.js`:** Tab Alert toggle wired alongside Night Mode. Reads `tabAlert` on DOMContentLoaded, writes on `change`, synced live via `chrome.storage.onChanged`.

---

### 2026-06-11 — Step 3: Night Mode wired (clean implementation)

- **`utils/storage.js`:** added `NIGHT_MODE: 'nightMode'` to `STORAGE_KEYS`.
- **`content/nightMode.js`** (new): CSS-class-toggle approach — `ensureNightStyle()` injects `<style id="ext-night-mode-style">` once (idempotent); `applyNightMode(on)` toggles `html.ext-night` class. All dark rules are scoped to `html.ext-night`, so toggling off instantly reverts to Amazon's original styles. Header preserved via `header, [role="banner"], nav[role="navigation"]` forced back to `#1a5c38`. Own sidebar (`#ext-sidebar`) and inline panel (`#ext-inline-panel`) re-asserted to their original colours at high specificity. `initNightMode()` reads storage on load; `chrome.storage.onChanged` keeps it live. `window.__EXT_DEBUG.toggleNight` exposed for console testing. No `.click()` calls.
- **`manifest.json`:** `content/nightMode.js` inserted after `utils/storage.js`, before `content/refreshManager.js`.
- **`popup/popup.js`:** Night Mode toggle wired — reads `nightMode` on DOMContentLoaded, writes on `change`, stays live via `chrome.storage.onChanged`. All other controls remain unwired.

---

### 2026-06-11 — Night Mode wiring fully reverted

Night Mode went through four CSS iterations (per-selector overrides → root invert → invert + tweaks → direct color overrides) but all had live-site conflicts (Amazon top header colour, invert side-effects). Entire Night Mode wiring reverted to UI-BUILT state pending a clean reimplementation.

- **Deleted:** `content/nightMode.js`
- **`manifest.json`:** removed `content/nightMode.js` from `content_scripts.js` array
- **`utils/storage.js`:** removed `NIGHT_MODE: 'nightMode'` from `STORAGE_KEYS`
- **`popup/popup.js`:** restored to intentionally inert (no DOMContentLoaded, no storage access)
- **`docs/UI_ELEMENTS.md`:** `popup-night-mode` status reverted to NOT wired
- **`docs/BACKLOG.md`:** Night Mode reverted from DONE → UI-BUILT; note added on correct approach (direct color overrides, not invert())

---

### Session 2026-06-11 — Sidebar redesign + Popup redesign + Bug fixes

#### content/sidebar.js — play/pause + scanline
- Removed: old `ext-btn-toggle` text button (Start / Stop).
- Added: `ext-playpause` pill control (SVG play ↔ pause icons). Visual state driven entirely by `container[data-running]` attribute + CSS selectors — no JS toggling class names. Click calls `toggleRunning()` which writes `STORAGE_KEYS.RUNNING` to storage (single source of truth). Keyboard: Enter / Space.
- Added: `ext-scanline` div at bottom edge of bar. CSS-only animation (`extScan` keyframe) runs while `container[data-running="true"]`. Speed linked to refresh interval via CSS custom property `--ext-scan-dur` set by `applyScanSpeed(speedSec)` (formula: `speedSec * 0.7`, clamped 0.5s..4s). `prefers-reduced-motion` disables animation.
- Added: `applyScanSpeed()` helper called on slider input AND on `chrome.storage.onChanged` for `STORAGE_KEYS.SPEED` (popup or other source changes speed → scanline updates live).
- `chrome.storage.onChanged` listener now handles both `STORAGE_KEYS.RUNNING` and `STORAGE_KEYS.SPEED`.

#### popup/popup.html + popup/popup.css + popup/popup.js — full redesign (UI only)
- Removed from popup: "Active" toggle, refresh-speed slider, "Loads visible" / "Last refresh" status fields. Run/speed control lives only in the sidebar now.
- New popup layout — two sections: **Display & Alerts** and **Load Board Filters**.
- Display & Alerts controls (UI built, NOT wired): Night Mode toggle, Tab Alert toggle, Sound block (volume slider + sound selector dropdown), Price Surge Alert toggle + threshold number input.
- Load Board Filters controls (UI built, NOT wired): Hide Promoted & Starting Soon toggle, Hide Similar Matches toggle.
- Footer: Reset to defaults button (NOT wired).
- `popup.js` is intentionally inert — no DOMContentLoaded handler, no storage access. Placeholder for Step 3 wiring.

#### content/detailOpener.js — scroll-before-click fix
- Bug: `elementFromPoint` returned null for new loads scrolled below the viewport (y > window.innerHeight). Fix: call `el.scrollIntoView({ block: 'center' })` (try/catch) after all three gates pass, then defer the point-resolve + click to `setTimeout(..., 250)`. Return true optimistically after scheduling. All safety checks (null, isForbiddenElement, el.contains fallback) run inside the timeout with the post-scroll rect.

#### content/detailOpener.js — earlier fix (same session)
- Replaced `dispatchRealisticClick` synthetic event sequence with `document.elementFromPoint` approach. Point biased left (30% width, 50% height) to avoid the Book button. Two additional safety gates on resolved target.

#### content/inlinePanel.js — multiple fixes and features
- `readSheetData` returns `{ header, segments }` (segmented model). Segments parsed from `.load-expander` blocks.
- Equipment text: regex `/\d+'\s*Trailer/` on normalized `.css-1cbogyo` text. Load type (Live/Drop/Preloaded): regex `Trailer\s+(Live|Drop|Preloaded)/i` on same block. Both set in one pass.
- Per-segment stop dedup by `arrival|departure` time key (fresh `seen` object per segment). Stops with missing times always kept.
- `buildPanelElement`: single-segment loads render the table directly (no accordion); two+ segments get collapsible grey headers (collapsed by default).
- Added `waitForSheet(callback)`: polls every 50ms (max 1500ms) until `#selected-work-sheet` contains `.load-expander`, then fires callback. Used by `initManualToggle` instead of fixed 800ms timeout.
- Added `initManualToggle()`: document-level click listener (bubbling); clicks on `.load-card` / `.load-card__selected` trigger `waitForSheet` → `showInlinePanel`. Clicking the same card again removes the panel (toggle off). `isForbiddenElement` guard on `ev.target`. Double-init guard via `window.__extManualToggleInit`. NOT auto-called from this file.
- `currentPanelCard` module-level variable tracks which card owns the current panel.
- CSS: `table-layout:fixed`, column widths 40/20/20/20%, `word-break:break-word`. Scanline gap removed (`margin: 0 0 12px 0`). Segment header uses `justify-content:space-between`, no `margin-left:auto` on arrow.

#### content/content.js — wiring + orchestrator fixes
- `initManualToggle()` called after `buildSidebar()` on page load.
- `startOrchestrator()` now fires `orchestratorTick().then(scheduleNextTick)` — first tick is immediate on Start, no initial delay.
- After new loads found: `openTopNewLoad` return value captured; if `autoOpen && opened`, `sleep(800)` then `showInlinePanel(result.newLoads[0]._element)` in try/catch. Auto-stop (storage.set RUNNING false + stopOrchestrator) happens AFTER the panel renders.

#### content/loadParser.js — green-highlight cards fix
- `parseLoads()` selector updated to: `div.load-card, div.load-card__selected, div.wo-card-header--highlighted`. Amazon highlights new loads with `wo-card-header--highlighted` before the user clicks them; without this fix they were invisible to the detector.

#### content/highlighter.js — match Amazon's highlight color
- `.ext-new-load` rule changed to `background-color: rgb(182, 227, 255) !important` (matches Amazon's own new-load highlight). Outline/box-shadow removed.

#### manifest.json
- `content/inlinePanel.js` added to `js` array after `detailOpener.js`, before `sidebar.js`.

---

### Stage 13 fix — 2026-06-09
- Updated: content/detailOpener.js — replaced el.click() with dispatchRealisticClick(el); fires pointerdown→mousedown→mouseup→click via dispatchEvent so Amazon's React handler sees a full synthetic event sequence; all 3 gates + FORBIDDEN guard unchanged; return values unchanged

### Stage 13.5 fix — 2026-06-04
- Updated: content/content.js — page load now forces RUNNING=false (no auto-start); orchestratorTick new-loads branch now calls storage.set(RUNNING,false)+stopOrchestrator() after highlight/sound/open, flipping sidebar+popup toggle back via onChanged

### Stage 13.5 — 2026-06-04
- Updated: utils/storage.js — added STORAGE_KEYS.AUTO_OPEN = 'autoOpenTopNew'
- Updated: content/content.js — added orchestrator: orchTimer/orchTickRunning state, sleep(), orchestratorTick() (refresh → settle → parse → diff → highlight+sound+open if new), scheduleNextTick() (reads RUNNING+SPEED, self-reschedules via setTimeout), startOrchestrator()/stopOrchestrator(); chrome.storage.onChanged listener wires RUNNING toggle; restores running state on page load

### Stage 13 — 2026-06-04
- Added: content/detailOpener.js — openTopNewLoad(newLoads): 4-gate safety check (existence, isForbiddenElement, DOM membership), NEUTRAL_ZONE intent log, ONE el.click() on card body; __EXT_DEBUG.openTopNew exposed; NOT wired to refresh loop
- Updated: manifest.json — content/detailOpener.js added after soundAlert.js, before sidebar.js
- Updated: docs/SAFETY.md — "Sole .click()" section updated to record both click sites (refreshNow + openTopNewLoad)

### Stage 12 — 2026-06-04
- Added: content/soundAlert.js — lazy AudioContext; playAlert(): checks SOUND_MUTED, resumes suspended ctx, plays 880Hz+1100Hz two-tone beep via OscillatorNode+GainNode, try/catch; __EXT_DEBUG.playAlert exposed; NO clicks, NOT wired to detector
- Updated: utils/storage.js — added STORAGE_KEYS.SOUND_MUTED = 'soundMuted'
- Updated: manifest.json — content/soundAlert.js added after highlighter.js, before sidebar.js

### Stage 11.5 fix — 2026-06-04
- Updated: content/loadParser.js — parseLoads() now scopes to first div.load-list only (main results); "Similar matches" second list ignored; parseOneCard() unchanged

### Stage 11 — 2026-06-04
- Added: content/highlighter.js — injectHighlightStyle() (once, guarded by id); highlightNewLoads(newLoads): adds .ext-new-load class; clearHighlights(): removes from all matching elements; __EXT_DEBUG.highlightNew + clearHighlights exposed; NO clicks, NOT wired to refresh loop
- Updated: manifest.json — content/highlighter.js added after loadDetector.js, before sidebar.js

### Stage 10 — 2026-06-04
- Added: content/loadDetector.js — detectNewLoads(loads): Set-based diff, first-run seeding (returns empty on first call), skips null loadIds; resetKnownLoads(); __EXT_DEBUG.detectNewLoads + resetKnownLoads exposed; NO clicks, NO highlighting, NOT wired to refresh loop
- Updated: manifest.json — content/loadDetector.js added after loadParser.js, before sidebar.js

### Stage 9 fix — 2026-06-04
- Updated: utils/storage.js — added STORAGE_KEYS.RUNNING = 'isRunning'
- Updated: content/sidebar.js — restores running state from storage on init; toggle click persists STORAGE_KEYS.RUNNING; sidebar and popup now fully in sync via storage
- Updated: popup/popup.js — comment updated confirming KEY_RUNNING literal matches STORAGE_KEYS.RUNNING; no logic change needed

### Stage 9 — 2026-06-04
- Added: popup/popup.html — CSP-safe (no inline scripts), links popup.css + popup.js
- Added: popup/popup.css — 320px wide, green toggle switch, slider, status section
- Added: popup/popup.js — reads/writes chrome.storage.local directly (isolated context); toggle writes isRunning; slider writes refreshSpeedSeconds; chrome.storage.onChanged keeps UI live; NO .click(), NO parsing
- Updated: manifest.json — action.default_popup set to popup/popup.html
- Updated: docs/UI_ELEMENTS.md — replaced placeholder popup entries with actual Stage 9 elements

### Stage 8 — 2026-06-02
- Added: content/loadParser.js — parseOneCard() + parseLoads(); Layout A only (div.load-card / load-card__selected); parses loadId, payout, pricePerMile, distance, duration, stops, equipment, trailerLetter, loadingType, deadhead, tag, specialServices, _element; per-card try/catch; __EXT_DEBUG.getLoads exposed; NO .click(), NO auto-run
- Updated: manifest.json — content/loadParser.js added after refreshManager.js, before sidebar.js
- Updated: docs/AMAZON_SELECTORS.md — expanded Load card (Layout A) section with all verified field selectors and strategies

### Stage 8-pre — 2026-06-02
- Updated: utils/constants.js — added '#book-btn-row' to FORBIDDEN_SELECTORS (Layout B/Contracts Book button; out of scope but guarded); isForbiddenElement() logic unchanged; array now has 3 selectors
- Updated: docs/AMAZON_SELECTORS.md — added #book-btn-row to Booking FORBIDDEN section with out-of-scope note; marked Layout B/Contracts as intentionally ignored with explanation
- Updated: docs/SPEC.md — added "MVP scope: Load Board only" section; clarified feature #2 as Layout A only; added Contracts/Block/Layout B to Non-goals

### Stage 7 — 2026-06-02
- Updated: content/refreshManager.js — added refreshNow(): isForbiddenElement guard + tagName==='BUTTON' check + the ONE button.click() in the codebase; exposed __EXT_DEBUG.refreshNow; findRefreshButton and refreshDryRun unchanged
- Updated: docs/SAFETY.md — recorded refreshNow() as sole .click() call site, listed all 3 required gates; updated audit checklist

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
