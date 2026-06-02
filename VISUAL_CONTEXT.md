# VISUAL_CONTEXT.md — Amazon Relay Load Board UI Reference

**Companion document to:** `MVP_SPECIFICATION.md`
**Purpose:** Visual and structural reference for Claude Code when working with Amazon Relay Load Board DOM
**Last verified:** 2026-05-26
**Status:** Authoritative reference — read before parsing, clicking, or modifying any DOM interaction code

---

## 🚨 CRITICAL READING ORDER FOR CLAUDE CODE

Before touching any code that interacts with Amazon Relay DOM:

1. Read `SAFETY.md` — booking protection rules
2. Read `MVP_SPECIFICATION.md` — the 18-stage MVP plan and architecture
3. Read **THIS FILE** (`VISUAL_CONTEXT.md`) — UI structure
4. Read `AMAZON_SELECTORS.md` — exact CSS selectors (user-maintained)
5. Then write code

If any of these documents conflict — `SAFETY.md` wins, always.

---

## 📋 TABLE OF CONTENTS

1. [Page Overview](#page-overview)
2. [Critical UI Zone #1 — Internal Refresh Button](#zone-1-internal-refresh-button)
3. [Critical UI Zone #2 — Load Rows](#zone-2-load-rows)
4. [Critical UI Zone #3 — Neutral Click Zone](#zone-3-neutral-click-zone)
5. [Critical UI Zone #4 — Load Price (Payout)](#zone-4-load-price-payout)
6. [Load Row Anatomy — Full Field Map](#load-row-anatomy)
7. [Special Row States](#special-row-states)
8. [Page Header & Filters](#page-header-and-filters)
9. [Highest Paying Load Logic](#highest-paying-load-logic)
10. [Visual Highlighting Rules](#visual-highlighting-rules)
11. [Audio Behavior](#audio-behavior)
12. [State Management](#state-management)
13. [Performance Requirements](#performance-requirements)
14. [Anti-Patterns (FORBIDDEN)](#anti-patterns)

---

## PAGE OVERVIEW

The Amazon Relay Load Board is a paginated table interface showing available freight loads. Reference screenshot shows the typical layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard / Load Board                            [icons] [profile] │
│ Load Board                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ⚙ Showing 1-50 of 109 results               ↓ Relevance            │
│ [Filter chips: Work type, Origin city, Payout, Price/mi, ...]      │
├─────────────────────────────────────────────────────────────────────┤
│ ROW 1 — Single Load Container                                       │
│  [deadhead] [origin] → [destination] [distance] [equipment] $X.XX  │
│ ROW 2 ...                                                           │
│ ROW 3 ...                                                           │
│ ...                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ ↑ Go to top  Clear filters    Next Refresh 19s  🔄  [toggle] [30s] │
└─────────────────────────────────────────────────────────────────────┘
```

Four critical interaction zones are marked in red on the reference screenshot:

1. **Internal Refresh Button** (bottom-right)
2. **Load Rows** (table body)
3. **Neutral Click Zone** (right side of each row)
4. **Load Price / Payout Amount** (rightmost column)

---

## ZONE 1 — INTERNAL REFRESH BUTTON

**Location:** Bottom-right corner of the Load Board, next to "Next Refresh Xs" countdown text and the auto-refresh toggle.

**Visual indicator:** A circular refresh icon (🔄). Adjacent UI shows:
- Text "Next Refresh 19s" (countdown)
- Toggle switch (blue when on)
- Interval selector (e.g., "30 s")

**Purpose:** This is the **ONLY** mechanism the extension uses to refresh loads.

### ❌ FORBIDDEN refresh methods:

```javascript
// NEVER do any of these:
window.location.reload()
window.location.href = window.location.href
location.reload()
history.go(0)
// Any navigation that causes full page reload
```

**Why forbidden:** Full page reload destroys WebSocket connections, loses user session state, triggers Amazon's bot detection, and is much slower than internal refresh.

### ✅ CORRECT refresh method:

```javascript
// In refreshManager.js — Stage 6 (dry test, before wiring real click):
const btn = document.querySelector(REFRESH_BUTTON_SELECTOR);
if (btn) {
  logger.log('refreshManager', '[dry] Would click refresh button', {
    selector: REFRESH_BUTTON_SELECTOR,
    visible: isVisible(btn),
    inDOM: document.contains(btn)
  });
}

// In live mode (Stage 7+) — use safeRefreshClick() from AMAZON_DOM_REFERENCE.md:
safeRefreshClick(btn);
```

### Selector strategy (priority order):

1. **Best:** `[data-test="..."]` or `[data-testid="..."]` attributes if Amazon provides them
2. **Good:** `[aria-label="Refresh"]` or similar accessibility attributes
3. **Acceptable:** `button[role="button"]` near the refresh icon
4. **Last resort:** CSS class names (fragile — Amazon changes these often)

### Anti-patterns to avoid:

- ❌ Multiple concurrent refresh loops (use single timer with locking)
- ❌ Overlapping clicks (if previous refresh still loading)
- ❌ Click without checking element exists

### Required safety lock:

```javascript
class RefreshManager {
  constructor() {
    this._isRefreshing = false;
  }

  async triggerRefresh() {
    if (this._isRefreshing) {
      logger.warn('refreshManager', 'Skipping — previous refresh still in progress');
      return;
    }
    this._isRefreshing = true;
    try {
      // ... click logic
    } finally {
      this._isRefreshing = false;
    }
  }
}
```

---

## ZONE 2 — LOAD ROWS

**Location:** Main table body, between filter chips (top) and pagination/footer (bottom).

**Visual structure of each row** (left to right):

```
[Deadhead miles]  [Origin city + ZIP]  →  [Destination city + ZIP]  [Distance]  [Driver icon]  [Equipment type]  [Drop/Live]  [Payout]
[Pickup time]                              [Delivery time]
```

### Required parsed fields per row:

```javascript
{
  id: string,              // Unique identifier (see "Load ID strategy" below)
  payout: number,          // Total payout in USD (e.g., 2365.86)
  pricePerMile: number,    // e.g., 1.84
  origin: {
    city: string,          // "DALLAS"
    state: string,         // "TX"
    zip: string,           // "75241..." (may be truncated in UI)
    facilityCode: string   // "FTW1" or similar
  },
  destination: {
    city: string,
    state: string,
    zip: string,
    facilityCode: string   // "SLC3", "AFW5", "TUS2", etc.
  },
  deadhead: number,        // miles, e.g., 243.34
  distance: number,        // total trip miles, e.g., 1284.3
  duration: string,        // "2d 5h" — total transit time
  equipmentType: string,   // "53' Trailer, 53' Container"
  loadType: string,        // "Drop" or "Live"
  pickupTime: string,      // ISO format, e.g., "2026-04-27T16:58:00-05:00"
  deliveryTime: string,    // ISO format
  isPromoted: boolean,     // true if "Promoted Load" badge present
  stopCount: number        // number of stops (visible as small numbered circles)
}
```

### Load ID strategy

Amazon may or may not expose a stable load ID in the DOM. Strategy:

1. **First choice:** Use Amazon's own `data-*` attribute (e.g., `data-load-id`)
2. **Fallback:** Compose a hash from stable fields:
   ```javascript
   const id = `${origin.facilityCode}_${destination.facilityCode}_${pickupTime}_${payout}`;
   ```
3. **Document the choice in `AMAZON_SELECTORS.md`** so it's traceable

### Resilient parsing rules:

- ❌ DO NOT rely on exact CSS class names (Amazon randomizes them)
- ✅ DO use semantic structure — first child, second child, etc. within a row
- ✅ DO use repeated layout patterns (every row has same structure)
- ✅ DO use icons/symbols as anchors (e.g., the arrow `→` between origin and destination)
- ✅ DO validate parsed data (price is a number, dates are valid)

### Race condition guard:

When Amazon refreshes the table, rows may be partially rendered for a few ms. Parser must:

```javascript
parseAllLoads() {
  const rows = document.querySelectorAll(LOAD_ROW_SELECTOR);
  const loads = [];

  for (const row of rows) {
    const load = this.parseRow(row);
    if (!this.isComplete(load)) {
      logger.warn('loadParser', 'Skipping incomplete row, will retry next cycle');
      return this._lastValidSnapshot;  // return previous good state
    }
    loads.push(load);
  }

  this._lastValidSnapshot = loads;
  return loads;
}

isComplete(load) {
  return load.id &&
         typeof load.payout === 'number' && load.payout > 0 &&
         load.origin?.city &&
         load.destination?.city &&
         load.pickupTime;
}
```

---

## ZONE 3 — NEUTRAL CLICK ZONE

**Location:** Right side of each load row, between the price column and the `>` chevron at the far right edge.

**Visual indicator:** Empty/whitespace area on the row. NOT the price text, NOT any button, NOT any icon.

**Purpose:** Clicking this area expands the load details panel without triggering any booking action.

### ❌ Areas FORBIDDEN to click (will cause unwanted actions):

| Area | Why forbidden |
|------|---------------|
| Payout text (`$2,365.86`) | May open price detail modal |
| Origin/destination text | May trigger map navigation |
| Equipment type badges | May filter the list |
| Driver icon | May open driver details |
| Lock icons (if present) | May trigger acceptance flow |
| "Promoted Load" badge | May open promotion details |
| Stop count circles | May open stop details |
| The `>` chevron itself | May trigger expansion AND booking action — TEST CAREFULLY |
| Any element with `role="button"` not explicitly verified |  Unknown behavior |

### ✅ The neutral zone:

Empty space within the row container, OUTSIDE any interactive child element.

### Click strategy: NONE

⚠️ **The ONLY clicks this project performs: (1) Refresh button, (2) neutral zone of the top new load to open its details.** Nothing else — never Book, never Submit.

In the MVP (Stage 13, detailsOpener), when new loads appear, the extension clicks the neutral zone of the highest-paying NEW load exactly once to open its details panel. This is safe — neutral zone click only expands details, it does NOT book.

```javascript
// Stage 13 (detailsOpener) — clicks neutral zone of top new load to OPEN DETAILS:
function openTopNewLoadDetails(rowElement, load) {
  if (!rowElement || !document.contains(rowElement)) return;

  // Safety: never click a forbidden (booking) element
  if (isForbiddenElement(rowElement)) {
    logger.error('detailsOpener', 'BLOCKED: row matched forbidden selector');
    return;
  }

  // The neutral zone is the load card body — clicking opens the details panel
  rowElement.click();
  logger.log('detailsOpener', 'Opened details of top new load', {
    loadId: load.id,
    payout: load.payout
  });
}
```

Stage 11 (highlighting) separately adds CSS classes to ALL new loads. detailsOpener only opens the single highest-paying one.

### Identification heuristic for neutral zone:

The neutral zone is typically:
- A container `div` that wraps the row content
- Has no `onclick` listener visible in DOM
- Has no `role="button"` on itself
- Is positioned between price column and chevron column
- Width is roughly 40-80px

**Best practice:** Identify it by its position in the row's child structure, NOT by class name.

```javascript
// Example identification (pseudo):
const cells = row.children;
// Skip: deadhead, origin, arrow, destination, distance, driver, equipment, type, payout
// The neutral zone is BEFORE the chevron, AFTER the payout
const neutralZone = cells[cells.length - 2];  // example — verify in DevTools
```

⚠️ **This is a guess.** User must verify in DevTools and document in `AMAZON_SELECTORS.md`.

---

## ZONE 4 — LOAD PRICE (PAYOUT)

**Location:** Rightmost data column of each row, before the chevron.

**Visual format:**
```
$2,365.86
$1.84/mi
```

- **Top line:** Total payout (large, bold)
- **Bottom line:** Price per mile (smaller, gray)

### Parsing rules:

```javascript
parsePayout(text) {
  // Input: "$2,365.86"
  // Remove "$", remove commas, parse float
  return parseFloat(text.replace(/[$,]/g, ''));
}

parsePricePerMile(text) {
  // Input: "$1.84/mi"
  return parseFloat(text.replace(/[$,/mi]/g, ''));
}
```

### Validation:

- Payout must be > 0
- Payout must be < 50000 (sanity check — anything higher is likely a parse error)
- Price per mile must be > 0 and < 100
- If validation fails → log warning, skip row

### Special visual states:

| State | Visual | Meaning |
|-------|--------|---------|
| Normal | White background, black text | Standard load |
| Highlighted green | Light green background on payout | Newly detected by extension |
| Highlighted yellow | Yellow background | Price increased ≥ $50 (extension highlight) |
| Promoted | "Promoted Load" badge on left | Amazon-promoted, possibly featured |

⚠️ **Distinguish Amazon's own highlights from extension highlights** — use dedicated CSS class names like `ext-highlight-new` and `ext-highlight-price-up` to avoid conflicts.

---

## LOAD ROW ANATOMY — FULL FIELD MAP

Reference: Row 1 in the screenshot (Dallas → Salt Lake City, $2,365.86).

```
┌──────────────┬──────────────────────┬───┬──────────────────────┬─────────┬─────┬──────────────────────┬──────┬─────────────────┐
│ 243.34 mi    │ FTW1 DALLAS, TX...  │ → │ SLC3 SALT LAKE CITY  │ 1,284.3 │  👤 │ 53' Trailer, 53'... │ Drop │ $2,365.86       │
│ Deadhead     │ ✏ Mon Apr 27 16:58  │   │ Wed Apr 29 22:36 CDT │ 2d 5h   │     │ Container ...   P   │      │ $1.84/mi      > │
└──────────────┴──────────────────────┴───┴──────────────────────┴─────────┴─────┴──────────────────────┴──────┴─────────────────┘
   CELL 1         CELL 2 (origin)    arrow   CELL 3 (destination)  CELL 4   CELL5   CELL 6 (equipment)  CELL7  CELL 8 (payout)
```

### Cell-by-cell parsing:

| Cell | Field | Notes |
|------|-------|-------|
| 1 | `deadhead` (top), `Deadhead` label (bottom) | Empty miles to pickup |
| 2 | `origin.facilityCode`, `origin.city`, `origin.state`, `origin.zip` (top), `pickupTime` (bottom) | Facility code is "FTW1", "WOM5", etc. |
| arrow | (separator) | Anchor for finding adjacent cells |
| 3 | `destination.*`, `deliveryTime` (bottom) | Same structure as origin |
| 4 | `distance` (top), `duration` (bottom) | Total trip miles and time |
| 5 | Driver icon | Indicates driver type (Solo, Team) |
| 6 | `equipmentType` | May have "P" badge (Preferred?) — verify |
| 7 | `loadType` | "Drop" or "Live" |
| 8 | `payout` (top), `pricePerMile` (bottom), `>` chevron | Rightmost cell |

### Stop count indicators:

Small numbered circles (e.g., ①, ②, ③, ④) appear within the origin or destination cell, indicating number of stops along the route. Parse as integer.

---

## SPECIAL ROW STATES

### "Promoted Load" badge

Appears as a colored badge (usually blue/purple) on the far left of certain rows, e.g., the 5th row in the screenshot ("Promoted Load" → FTW6 COPPELL → LBB5 LUBBOCK).

**Detection:**
```javascript
const isPromoted = !!row.querySelector(PROMOTED_BADGE_SELECTOR);
```

**Treatment:**
- Promoted loads ARE eligible for highest-paying detection
- Mark `load.isPromoted = true` in parsed object
- May want to show different visual highlight (optional, discuss with user)

### Rows with empty/missing data

If Amazon is still loading a row:
- Some cells may be empty
- Skeleton loaders may be visible

**Treatment:** Skip the row, return previous snapshot, log warning. See "Race condition guard" above.

---

## PAGE HEADER AND FILTERS

**Above the table:**
```
⚙ Showing 1 - 50 of 109 results                                ↓ Relevance
[Work type: One-Way/Round Trip ✕] [Origin city: TULSA, OK ✕] [Payout (min): 400 ✕]
[Price/mi: 1.7 ✕] [Driver type: Solo ✕] [Stops (max): 4 ✕]
[Equipment: 53' Trailer (P) ✕] [Equipment: 53' Container (P) ✕]
```

### Important notes:

- **"Showing X - Y of Z results"** — total count of loads matching current filters
- **Sort order** — "Relevance" by default. Sort changes affect parsing order. Extension should NOT change sort.
- **Filter chips** — applied filters. Extension should NOT modify filters. Read-only.
- **Pagination** — only first 50 loads visible at a time. Extension parses currently visible page only.

### Detection of total count:

Parsing "Showing 1 - 50 of 109 results" helps determine if more loads exist on other pages. Extension does NOT auto-paginate (user controls pagination).

---

## HIGHEST PAYING LOAD LOGIC

### When triggered

After every refresh cycle, if `detectNewLoads()` returns ≥ 1 new load:

1. Compare ONLY among **newly detected** loads (not existing ones)
2. Find the one with highest `payout`
3. If tie — choose lowest deadhead miles
4. If still tie — choose earliest pickup time

### Implementation:

```javascript
function findHighestPayingNewLoad(newLoads) {
  if (newLoads.length === 0) return null;

  return newLoads.reduce((best, current) => {
    if (current.payout > best.payout) return current;
    if (current.payout < best.payout) return best;

    // Tie on payout — prefer lower deadhead
    if (current.deadhead < best.deadhead) return current;
    if (current.deadhead > best.deadhead) return best;

    // Tie on deadhead — prefer earlier pickup
    return new Date(current.pickupTime) < new Date(best.pickupTime)
      ? current : best;
  });
}
```

### What happens after the highest-paying NEW load is identified:

When new loads appear, the MVP does this sequence:
1. **Stage 11 (highlighting):** adds CSS class to ALL new loads → green highlight
2. **Stage 12 (sound):** plays ONE sound (not per load), using the user's chosen tone
3. **Stage 13 (detailsOpener):** finds the highest-paying NEW load and clicks its neutral zone ONCE → opens its details panel
4. The sidebar shows text, e.g., `🎯 Best new load: $2,365.86 (DALLAS→SALT LAKE CITY)`

The extension does NOT:
- Click on any Book button
- Click on Submit
- Open the right-side panel by any means other than the neutral-zone click in Stage 13
- Modify any Amazon DOM beyond CSS highlight classes and the single details-open click

⚠️ **Booking is a manual user action.** The extension surfaces and opens the best load; the user reads it and clicks Book themselves if they want it.

---

## VISUAL HIGHLIGHTING RULES

### New load detected

- **CSS class:** `ext-highlight-new`
- **Background:** Light green (`#C8E6C9` or similar)
- **Duration:** Persistent until next refresh cycle, then fade-out over 1 second
- **Transition:** `transition: background-color 1s ease-out`

### Price increase ≥ $50

- **CSS class:** `ext-highlight-price-up`
- **Background:** Yellow (`#FFF59D`)
- **Duration:** 5 seconds, then fade-out
- **Additional:** Show price delta on hover (e.g., "+$75")

### Price decrease (optional, discuss)

- **CSS class:** `ext-highlight-price-down`
- **Background:** Light orange (`#FFCCBC`)
- **Duration:** 5 seconds, then fade-out

### Anti-flicker requirements:

- ✅ Use CSS transitions, not JavaScript timers for fade
- ✅ Apply class once, remove once
- ❌ DO NOT toggle classes rapidly
- ❌ DO NOT use inline styles
- ❌ DO NOT modify Amazon's own classes

---

## AUDIO BEHAVIOR

### Two distinct sounds

| Event | Sound | Description |
|-------|-------|-------------|
| New load detected | `playNewLoad()` | Short soft beep (800Hz, 100ms) |
| Price increase ≥ $50 | `playPriceUp()` | Two-tone (1000Hz then 1200Hz, 200ms total) |

### Anti-spam rules

- ✅ Minimum 500ms between any two sounds
- ✅ If multiple events at once → play one sound (the higher-priority one: price > new)
- ❌ DO NOT play sound on every parsed row
- ❌ DO NOT play sound during initial page load (use "warming up" flag for first 3 sec)

### Implementation hint (Web Audio API)

```javascript
class SoundManager {
  constructor() {
    this.ctx = new AudioContext();
    this.lastPlayedAt = 0;
  }

  playTone(freq, durationMs) {
    const now = Date.now();
    if (now - this.lastPlayedAt < 500) return;
    this.lastPlayedAt = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    osc.start();
    osc.stop(this.ctx.currentTime + durationMs / 1000);
  }
}
```

No `.mp3` files needed — synthesized tones are sufficient and instant.

---

## STATE MANAGEMENT

### In-memory state (runtime)

```javascript
const state = {
  currentLoads: [],         // most recent parsed snapshot
  previousLoads: [],        // snapshot before last refresh (for diff)
  detectedNewLoads: [],     // loads added since last refresh
  trackedPriceChanges: [],  // {id, oldPrice, newPrice, delta}
  warmingUp: true,          // first 3 sec after start
  refreshCount: 0
};
```

### Persistent settings (`chrome.storage.local`)

```javascript
{
  isRunning: false,         // restored on page reload
  refreshInterval: 2.5,
  soundEnabled: true,
  debugMode: false,
  highlightDurationMs: 5000
}
```

### NEVER persist

- `currentLoads`, `previousLoads` — recompute on each session
- Detected diffs — ephemeral

---

## PERFORMANCE REQUIREMENTS

### Long-running session (target: 8+ hours continuous)

| Metric | Target | How to verify |
|--------|--------|---------------|
| Memory growth | < 50 MB / hour | DevTools → Performance → Memory |
| CPU usage (idle) | < 5% | Task Manager |
| Long tasks | < 50ms each | DevTools → Performance |
| DOM observers | ≤ 2 active | Code review |
| Intervals/timers | ≤ 3 active | Code review |

### Must do

- ✅ Debounce parsing on rapid DOM mutations (100ms)
- ✅ Throttle UI updates (max 4 per second)
- ✅ Use `WeakMap` for DOM ↔ load object references
- ✅ Clean up listeners on `stop()`
- ✅ Disconnect `MutationObserver` on `stop()`

### Must NOT do

- ❌ Re-parse entire DOM on every mutation (use diff)
- ❌ Create new `MutationObserver` on every refresh
- ❌ Store DOM nodes in long-lived arrays (memory leak)
- ❌ Use `setInterval` without storing the ID for cleanup
- ❌ Use `forEach` callbacks that capture closures over large objects

---

## ANTI-PATTERNS

### ❌ Quick fixes and temporary patches

If a bug is found, Claude Code MUST:
1. Understand the root cause (read related code + docs)
2. Propose a fix that integrates with existing architecture
3. Write a test case in `TEST_CASES.md`
4. Document the fix in `CHANGELOG.md`

NEVER:
- Add `setTimeout` to "wait it out"
- Wrap everything in `try/catch {}` to silence errors
- Add hardcoded delays without explanation
- Copy-paste similar logic into multiple files

### ❌ Tightly coupled code

- ❌ Content script directly calls panel UI methods
- ✅ Content script publishes event, panel listens

- ❌ Parser knows about sound system
- ✅ Detector emits event, sound manager listens

- ❌ Click automation reads from DOM directly
- ✅ Click automation receives load object from detector

### ❌ Duplicate logic

If the same parsing/comparison/formatting appears in 2+ places — extract to `utils/helpers.js`.

### ❌ Bypassing safety

NEVER write code that:
- Adds a `.click()` call on any element except the Refresh button
- Removes or bypasses the `isForbiddenElement()` check
- Creates a file named `clickAutomation.js`, `autoBooking.js`, or similar
- Modifies the `FORBIDDEN_SELECTORS` array
- Hides errors from the user

---

## DEBUG INTERFACE REMINDER

Expose for runtime inspection (per MVP_SPECIFICATION Stage 8+):

```javascript
window.__EXT_DEBUG = {
  getLoads: () => state.currentLoads,
  getPreviousLoads: () => state.previousLoads,
  getLastDiff: () => ({
    newLoads: state.detectedNewLoads,
    priceChanges: state.trackedPriceChanges
  }),
  getStats: () => ({
    refreshCount: state.refreshCount,
    memoryEstimate: JSON.stringify(state).length,
    isRunning: state.isRunning
  }),
  getSelectors: () => domSelectors,
  forceRefresh: () => refreshManager.triggerRefresh(),
  // NO method to click anything except Refresh
};
```

This is the user's diagnostic tool. When the user reports a bug, they will run these commands and paste output for Claude Code.

---

## SCREENSHOT-DERIVED EXAMPLES

Based on the reference screenshot, here are example parsed loads (for testing parser):

```javascript
// Row 1 (highlighted in red — "Single Load Container")
{
  id: "FTW1_SLC3_2026-04-27T16:58_2365.86",
  payout: 2365.86,
  pricePerMile: 1.84,
  origin: { facilityCode: "FTW1", city: "DALLAS", state: "TX", zip: "75241" },
  destination: { facilityCode: "SLC3", city: "SALT LAKE CITY", state: "UT" },
  deadhead: 243.34,
  distance: 1284.3,
  duration: "2d 5h",
  equipmentType: "53' Trailer, 53' Container",
  loadType: "Drop",
  pickupTime: "2026-04-27T16:58:00-05:00",  // Mon Apr 27 16:58 CDT
  deliveryTime: "2026-04-29T22:36:00-05:00", // Wed Apr 29 22:36 CDT
  isPromoted: false,
  stopCount: 1
}

// Row 3 (highlighted green in screenshot — likely "new" or "high paying")
{
  id: "FOE1_TUS2_2026-04-27T18:15_3556.83",
  payout: 3556.83,
  pricePerMile: 1.92,
  origin: { facilityCode: "FOE1", city: "KANSAS CITY", state: "KS" },
  destination: { facilityCode: "TUS2", city: "TUCSON", state: "AZ", zip: "85753" },
  deadhead: 218.49,
  distance: 1856.2,
  duration: "3d 0h",
  equipmentType: "53' Trailer, 53' Container",
  loadType: "Drop",
  pickupTime: "2026-04-27T18:15:00-05:00",
  deliveryTime: "2026-04-30T18:40:00-05:00",
  isPromoted: false,
  stopCount: 4
}

// Row 5 (Promoted Load)
{
  id: "FTW6_LBB5_2026-04-28T10:45_645.61",
  payout: 645.61,
  pricePerMile: 1.80,
  origin: { facilityCode: "FTW6", city: "COPPELL", state: "TX", zip: "75019" },
  destination: { facilityCode: "LBB5", city: "LUBBOCK", state: "TX", zip: "79404" },
  deadhead: 227.61,
  distance: 358.9,
  duration: "8h 28m",
  equipmentType: "53' Trailer",
  loadType: "Drop",
  pickupTime: "2026-04-28T10:45:00-05:00",
  deliveryTime: "2026-04-28T19:13:00-05:00",
  isPromoted: true,    // ← key difference
  stopCount: 3
}
```

Use these as fixtures for parser unit tests.

---

## CHANGELOG OF THIS FILE

| Date | Change | By |
|------|--------|-----|
| 2026-05-26 | Initial version based on reference screenshot | Initial spec |

---

## END OF VISUAL_CONTEXT.md
