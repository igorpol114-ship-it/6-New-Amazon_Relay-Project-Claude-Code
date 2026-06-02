# AMAZON_DOM_REFERENCE.md — Real DOM Structure of Amazon Relay Load Board

**Companion document to:** `MVP_SPECIFICATION.md` and `VISUAL_CONTEXT.md`
**Source:** Real HTML extracted from production Amazon Relay (user-provided)
**Last verified:** 2026-05-26
**Status:** AUTHORITATIVE — use these selectors as the primary source

---

## 🚨 HOW TO USE THIS FILE

This is the **selectors and DOM patterns reference** for Claude Code. When writing parser code, querying DOM, or finding elements:

1. **Always check this file FIRST** before writing any `document.querySelector`
2. Use the selectors marked ✅ STABLE (data-attributes, semantic classes)
3. Avoid selectors marked ⚠️ FRAGILE (css-xxxxx hashes — Amazon regenerates these)
4. If a needed selector is not here — add it and mark verification date

---

## 🔑 KEY DISCOVERY: TWO DIFFERENT LAYOUTS

Amazon Relay has **two distinct load board layouts**. The extension must support both:

### Layout A — "Load Card" (search results, similar matches)
- Each load is in `<div class="load-card">`
- Container: `<div class="load-list">`
- Used in: main load search results, "Similar matches" section
- Has UUID identifier: `<div id="4070c45b-02a8-45f3-8a1c-4e1934d1f2dd">`
- Class names use `css-XXXXXX` hashes (FRAGILE — change between deploys)

### Layout B — "Tour Container" (Block/Tour view)
- Each tour: `<div data-type="T-XXXXX-tour-container">`
- Multiple loads nested inside, each: `<div data-type="LOADID-load-expander">`
- Used in: "Blocks" / "Tour" view (when user has assigned drivers)
- Has stable `data-type` and `data-id` attributes (STABLE — use these)
- Has visible Load IDs like `113JS2WXB`, `1159Q5GDG`

**Strategy:** Parser must detect which layout is active and use appropriate selectors.

---

## 📋 TABLE OF CONTENTS

1. [Layout A — Load Card Selectors](#layout-a-selectors)
2. [Layout B — Tour Container Selectors](#layout-b-selectors)
3. [Common Field Patterns](#common-field-patterns)
4. [Booking Flow DOM ⚠️](#booking-flow-dom)
5. [Right-Side Panel (DO NOT USE)](#right-side-panel)
6. [Post a Truck Form](#post-a-truck-form)
7. [Special Indicators & Highlights](#special-indicators)
8. [Refresh Button (To Be Verified)](#refresh-button)
9. [JavaScript Snippets for Extension](#javascript-snippets)
10. [Stable vs Fragile Selectors Table](#stable-vs-fragile)

---

## LAYOUT A — LOAD CARD SELECTORS

### Container hierarchy

```
div.css-1ehu6yl                              ← wrapper
  └─ div.load-list                           ← container of all cards ✅ STABLE
      └─ div.load-card                       ← single load card ✅ STABLE
          └─ div[id="UUID"]                  ← unique load ID (UUID format)
              └─ div.css-1jxh1bg             ← internal layout container
```

### Critical insight: Load UUID

Each load has a unique UUID as the `id` attribute of an inner div:

```html
<div class="load-card">
  <div id="4070c45b-02a8-45f3-8a1c-4e1934d1f2dd">  ← UUID ✅ USE AS LOAD ID
    ...
  </div>
</div>
```

**This is the most reliable Load ID for Layout A.**

```javascript
// Get all load cards with their IDs
const cards = document.querySelectorAll('div.load-card');
cards.forEach(card => {
  const innerDiv = card.querySelector('div[id]');
  const loadId = innerDiv?.id;  // UUID string
});
```

### Field-by-field selectors (Layout A)

All selectors are relative to a single `div.load-card`.

#### Deadhead
```javascript
// "4.51 mi" and "Deadhead" label
const deadheadEl = card.querySelector('span[title="Deadhead"]');
const deadheadValue = deadheadEl.previousElementSibling.textContent;
// Result: "4.51 mi" — parse number
```

Stable anchor: `span[title="Deadhead"]` ✅

#### Origin / Destination
```javascript
// All location text has class "wo-card-header__components"
const locations = card.querySelectorAll('.wo-card-header__components');
// Index 0: origin facility + city + state + zip → "DFH7 PORT ST LUCIE, FL 34987-3314"
// Index 1: pickup time                          → "Tue May 12 19:15 EDT"
// Index 2: destination facility + city + state  → "SYR1 LIVERPOOL, NY 13090-4534"
// Index 3: delivery time                        → "Fri May 15 14:19 EDT"
// Index 4: distance                             → "1,427.2 mi"
// Index 5: duration                             → "2d 19h"
```

Stable anchor: `.wo-card-header__components` ✅

⚠️ **Caveat:** Order/count of these spans varies. Better strategy: use stop numbers as anchors.

#### Stop numbers (anchors for parsing)
```html
<p class="css-kabd3k css-12mi905">1</p>   ← Origin stop number
...
<p class="css-kabd3k css-12mi905">4</p>   ← Destination stop number
```

The first stop number's parent block contains origin; second contains destination.

#### Payout (TOTAL)
```javascript
// Container span has class "wo-total_payout"
const payoutEl = card.querySelector('.wo-total_payout');
const payout = parseFloat(payoutEl.textContent.replace(/[$,]/g, ''));
// "$3,944.34" → 3944.34
```

Stable anchor: `.wo-total_payout` ✅ **CRITICAL — most reliable selector for price**

#### Payout class variants (price change indicators)
```javascript
// Standard payout
.wo-total_payout

// Modified load with INCREASED price (highlighted by Amazon itself!)
.wo-total_payout__modified-load-increase-attr

// Match deviation (for similar matches that don't exactly match filter)
.wo-card-header__components--match-deviation-attr
```

⚠️ **IMPORTANT:** Amazon already highlights price changes! Check for these classes in detector logic.

#### Price per mile
```javascript
// "$2.76/mi" - typically the wo-card-header__components after the payout
const ppmEls = card.querySelectorAll('.wo-card-header__components');
// Last one in the sequence is usually price/mi, but verify position
```

Less reliable — use position relative to `.wo-total_payout`.

#### Equipment type
```javascript
const eqEl = card.querySelector('.equipment-type-text');
// "53' Trailer "
```

Stable anchor: `.equipment-type-text` ✅

#### Trailer type circle (the "P" badge)
```javascript
const pBadge = card.querySelector('.trailer-type-circle');
// Inner <p> contains "P"
```

Stable anchor: `.trailer-type-circle` ✅

#### Loading type (Drop/Live)
```javascript
const loadTypeEl = card.querySelector('.loading-type');
// title attribute: "Drop"
// textContent: "Drop"
```

Stable anchor: `.loading-type` ✅

#### Driver type (Solo/Team)
```javascript
// The driver icon — Solo has class "driver-icon__primary"
const driverIcon = card.querySelector('.driver-icon__primary');
// Presence = Solo. Other types may have different class suffix.
```

Stable anchor: `.driver-icon__primary` ✅

### Complete parser function for Layout A

```javascript
function parseLoadCardA(cardElement) {
  try {
    const idEl = cardElement.querySelector('div[id]');
    const id = idEl?.id;
    if (!id) return null;

    const payoutEl = cardElement.querySelector('.wo-total_payout, .wo-total_payout__modified-load-increase-attr');
    const payout = payoutEl ? parseFloat(payoutEl.textContent.replace(/[$,]/g, '')) : null;

    const isPriceIncreased = !!cardElement.querySelector('.wo-total_payout__modified-load-increase-attr');
    const isMatchDeviation = !!cardElement.querySelector('.wo-card-header__components--match-deviation-attr');

    const locations = Array.from(cardElement.querySelectorAll('.wo-card-header__components'));
    const origin = locations[0]?.textContent?.trim();
    const pickupTime = locations[1]?.textContent?.trim();
    const destination = locations[2]?.textContent?.trim();
    const deliveryTime = locations[3]?.textContent?.trim();
    const distance = locations[4]?.textContent?.trim();
    const duration = locations[5]?.textContent?.trim();

    const deadheadEl = cardElement.querySelector('span[title="Deadhead"]')?.previousElementSibling;
    const deadhead = deadheadEl ? parseFloat(deadheadEl.textContent.replace(/[^\d.]/g, '')) : null;

    const equipment = cardElement.querySelector('.equipment-type-text')?.textContent?.trim();
    const trailerBadge = cardElement.querySelector('.trailer-type-circle p')?.textContent?.trim();
    const loadType = cardElement.querySelector('.loading-type')?.textContent?.trim();

    // Parse price per mile from any text matching pattern $X.XX/mi
    const allText = cardElement.textContent;
    const ppmMatch = allText.match(/\$(\d+\.\d+)\/mi/);
    const pricePerMile = ppmMatch ? parseFloat(ppmMatch[1]) : null;

    return {
      id,
      payout,
      pricePerMile,
      origin,
      destination,
      pickupTime,
      deliveryTime,
      distance,
      duration,
      deadhead,
      equipment,
      trailerBadge,
      loadType,
      // Amazon's own indicators (use for detector):
      isPriceIncreased,
      isMatchDeviation,
      // Raw element for click logic later
      _element: cardElement,
      _parseTime: Date.now()
    };
  } catch (e) {
    console.error('[loadParser] Failed to parse card', e);
    return null;
  }
}
```

### Click target for Layout A (Neutral Zone)

In `VISUAL_CONTEXT.md` we said the neutral zone is "between price and chevron." Looking at HTML:

```html
<div class="css-1xqwq2z">                          ← outer container
  <div class="css-11tnikh">
    <div class="css-1dk3tf8">
      <div class="css-11tnikh">
        <span> </span>                              ← invisible spacer
        <div class="css-szxqie">
          <span class="wo-total_payout">$3,944.34</span>
        </div>
      </div>
      <div class="css-szxqie">
        <span class="wo-card-header__components">$2.76/mi</span>
      </div>
    </div>
    <div class="css-m6lqsr">                       ← chevron icon container
      <span><svg>›</svg></span>
      <span><svg>‹</svg></span>
    </div>
  </div>
</div>
```

⚠️ **CRITICAL:** This project never books. The only clicks: (1) Refresh button, (2) neutral zone of the top new load to open its details.

**Stage 13 (detailsOpener)** clicks the neutral zone of the highest-paying NEW load to open its details panel. This is safe — neutral-zone click only expands details, it does NOT book. **Stage 11 (highlighting)** separately adds CSS classes to ALL new loads without clicking.

```javascript
// Stage 11 — highlight ALL new loads (no click):
function highlightNewLoad(load) {
  const cardEl = load._element;
  if (!cardEl || !document.contains(cardEl)) return;
  cardEl.classList.add('ext-highlight-new');
  logger.log('highlight', 'Highlighted new load', { loadId: load.id });
}

// Stage 13 — open details of the single highest-paying new load (one click):
function openTopNewLoadDetails(load) {
  const cardEl = load._element;
  if (!cardEl || !document.contains(cardEl)) return;
  if (isForbiddenElement(cardEl)) {
    logger.error('detailsOpener', 'BLOCKED: forbidden element');
    return;
  }
  cardEl.click();  // opens details panel — does NOT book
  logger.log('detailsOpener', 'Opened details of top new load', {
    loadId: load.id, payout: load.payout
  });
}
```

---

## LAYOUT B — TOUR CONTAINER SELECTORS

### Container hierarchy

```
div[data-type="T-XXXXX-tour-container"]              ← tour wrapper ✅ STABLE
  └─ div[data-id="T-XXXXX-tour-expander"]
      └─ div[data-type="expander-header"]            ← collapsed view
          ├─ div[data-areatype="id"]                 ← tour ID column
          ├─ div[data-areatype="rt"]                 ← route (origin→dest)
          ├─ div[data-areatype="dt"]                 ← distance/time
          ├─ div[data-areatype="eq"]                 ← equipment
          ├─ div[data-areatype="lt"]                 ← loading type
          ├─ div[data-areatype="po"]                 ← payout
          ├─ div[data-areatype="ta"]                 ← team/assigned
          └─ div[data-areatype="pb"]                 ← progress bar
      └─ div[id="expander-content"]                  ← expanded details
          └─ div[data-type="LOADID-load-expander"]   ← individual load leg ✅ STABLE
```

### Tour-level selectors

```javascript
// All tours on the page
const tours = document.querySelectorAll('[data-type$="-tour-container"]');

// Get tour ID from data-type attribute
const tourType = tourEl.getAttribute('data-type');
const tourId = tourType.match(/T-(\w+)-tour-container/)[1];
// Example: "T-111BBHH6B-tour-container" → "111BBHH6B"

// Get visible tour ID text
const tourIdText = tourEl.querySelector('[data-type="tour-id"] p')?.textContent;
// "T-111BBHH6B"
```

### Load-level selectors (within tour)

Each tour contains multiple "load expanders" — these are the individual legs of the tour.

```javascript
// All loads in a tour
const loads = tourEl.querySelectorAll('[data-type$="-load-expander"]');

// Get load ID
const loadType = loadEl.getAttribute('data-type');
const loadId = loadType.replace('-load-expander', '');
// Example: "113JS2WXB-load-expander" → "113JS2WXB"

// Visible load ID
const loadIdText = loadEl.querySelector('[data-type="load-id"] p')?.textContent;
// "113JS2WXB"
```

### Field-by-field selectors (Layout B)

#### Tour origin
```javascript
const originEl = tourEl.querySelector('[data-type="tour-origin-info"]');
const originFacility = originEl.querySelector('p.css-1039xnx')?.textContent;
// "BHM1 Bessemer, AL 35022"
const originTime = originEl.querySelector('p.css-19k2rpm')?.textContent;
// "Tue, May 12, 17:15 CDT"
const originStopNum = tourEl.querySelector('[data-type="tour-origin-stop-number"]')?.textContent;
// "1"
```

Stable anchors: `[data-type="tour-origin-info"]`, `[data-type="tour-origin-stop-number"]` ✅

#### Tour destination
```javascript
const destEl = tourEl.querySelector('[data-type="tour-destination-info"]');
const destFacility = destEl.querySelector('p.css-1039xnx')?.textContent;
const destTime = destEl.querySelector('span.css-nqx8ge')?.textContent;
const destStopNum = tourEl.querySelector('[data-type="tour-destination-stop-number"]')?.textContent;
```

Stable anchors: `[data-type="tour-destination-info"]`, `[data-type="tour-destination-stop-number"]` ✅

#### Tour distance
```javascript
const distEl = tourEl.querySelector('[data-type="tour-distance-string"]');
const distance = distEl?.textContent?.trim();  // "528   mi" (note extra spaces!)
```

Stable anchor: `[data-type="tour-distance-string"]` ✅

#### Tour payout
```javascript
const payoutContainer = tourEl.querySelector('[data-type="tour-payout-info"]');
const payoutText = payoutContainer.querySelector('p.css-dtpo46')?.textContent;
// "$2 827,54" — note European-style formatting in some locales!
// Need to parse carefully: handle both "$2,827.54" and "$2 827,54"
```

Stable anchor: `[data-type="tour-payout-info"]` ✅

#### Tour equipment
```javascript
const eqContainer = tourEl.querySelector('[data-type="tour-equipment-type-icons"]');
const eqText = eqContainer.querySelector('p[title]')?.textContent;
// "53' Trailer"
```

#### Driver name
```javascript
const driverEl = tourEl.querySelector('[data-type="tour-driver-name"]');
const driverName = driverEl?.querySelector('p[title]')?.textContent;
// "N. Farima"
```

Stable anchor: `[data-type="tour-driver-name"]` ✅

#### Driver selection inputs (inside load expander)
```javascript
const driverSelect = loadEl.querySelector('[data-type="driver-select-component"]');
const tractorSelect = loadEl.querySelector('[data-type="fleet-id-drop-down-tour-and-load-level"]');
// Current value:
const driverValue = driverSelect.querySelector('[id$="-value"]')?.textContent;
// "N. Farima"
```

⚠️ **DO NOT modify driver/tractor selections programmatically.** This project does not change driver assignments — only the user does that manually.

### Load distance per leg
```javascript
const legDistance = loadEl.querySelector('[data-type="load-distance-string"]')?.textContent;
// "240   mi"
```

### Complete parser function for Layout B

```javascript
function parseTourB(tourElement) {
  try {
    const tourType = tourElement.getAttribute('data-type');
    const tourId = tourType?.match(/T-(\w+)-tour-container/)?.[1];
    if (!tourId) return null;

    const fullTourId = tourElement.querySelector('[data-type="tour-id"] p')?.textContent?.trim();

    const originInfo = tourElement.querySelector('[data-type="tour-origin-info"]');
    const destInfo = tourElement.querySelector('[data-type="tour-destination-info"]');

    const origin = {
      stopNumber: tourElement.querySelector('[data-type="tour-origin-stop-number"]')?.textContent?.trim(),
      facility: originInfo?.querySelector('p.css-1039xnx')?.textContent?.trim(),
      time: originInfo?.querySelector('p.css-19k2rpm')?.textContent?.trim()
    };

    const destination = {
      stopNumber: tourElement.querySelector('[data-type="tour-destination-stop-number"]')?.textContent?.trim(),
      facility: destInfo?.querySelector('p.css-1039xnx')?.textContent?.trim(),
      time: destInfo?.querySelector('span.css-nqx8ge')?.textContent?.trim()
    };

    const distance = tourElement.querySelector('[data-type="tour-distance-string"]')?.textContent?.trim();
    const equipment = tourElement.querySelector('[data-type="tour-equipment-type-icons"] p[title]')?.textContent?.trim();
    const loadType = tourElement.querySelector('[data-type="tour-loading-unloading-type"] p')?.textContent?.trim();
    const driverName = tourElement.querySelector('[data-type="tour-driver-name"] p[title]')?.textContent?.trim();

    // Payout: handle both "$2,827.54" and "$2 827,54" formats
    const payoutText = tourElement.querySelector('[data-type="tour-payout-info"] p.css-dtpo46')?.textContent || '';
    const payout = parsePayoutFlexible(payoutText);

    // Parse all child loads (legs)
    const loadExpanders = tourElement.querySelectorAll('[data-type$="-load-expander"]');
    const legs = Array.from(loadExpanders).map(parseLoadLeg);

    return {
      id: tourId,
      fullId: fullTourId,
      type: 'tour',
      origin,
      destination,
      distance,
      equipment,
      loadType,
      driverName,
      payout,
      legs,
      legCount: legs.length,
      _element: tourElement,
      _parseTime: Date.now()
    };
  } catch (e) {
    console.error('[tourParser] Failed', e);
    return null;
  }
}

function parseLoadLeg(loadEl) {
  const loadType = loadEl.getAttribute('data-type');
  const loadId = loadType?.replace('-load-expander', '');

  return {
    id: loadId,
    fullId: loadEl.querySelector('[data-type="load-id"] p')?.textContent?.trim(),
    distance: loadEl.querySelector('[data-type="load-distance-string"]')?.textContent?.trim(),
    payout: loadEl.querySelector('[data-type="load-payout-info"] p')?.textContent?.trim(),
    origin: loadEl.querySelector('[data-type="tour-origin-info"] p.css-1039xnx')?.textContent?.trim(),
    destination: loadEl.querySelector('[data-type="tour-destination-info"] p.css-1039xnx')?.textContent?.trim()
  };
}

function parsePayoutFlexible(text) {
  // Handle "$2,827.54" (US) or "$2 827,54" (EU) or "$3 820,43"
  if (!text) return null;
  // Strip $ and whitespace
  let cleaned = text.replace(/[$\s]/g, '');
  // Check format: if last separator is comma, it's decimal (EU style)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    // EU format: "2 827,54" → cleaned to "2827,54" → "2827.54"
    cleaned = cleaned.replace(/,/g, '.');
  } else {
    // US format: "2,827.54" → "2827.54"
    cleaned = cleaned.replace(/,/g, '');
  }
  return parseFloat(cleaned);
}
```

---

## COMMON FIELD PATTERNS

### Payout formats observed

| Format example | Format type | Parser logic |
|----------------|-------------|--------------|
| `$3,944.34` | US standard | Remove `$`, `,` → parseFloat |
| `$2 827,54` | EU style (space + comma decimal) | Remove `$`, ` `; replace `,` with `.` |
| `$3,820.43` | US standard | Same as first |
| `$172,99` | Compact EU | Same as second |

Use `parsePayoutFlexible()` shown above to handle both.

### Date/time formats observed

```
"Tue May 12 19:15 EDT"        ← Day, month abbreviation, date, time, timezone
"Wed, May 13, 16:33 EDT"      ← With commas (Layout B)
"05/12 19:15 EDT"             ← MM/DD format (panel)
```

Suggest storing as raw string AND parsed ISO. Don't trust parsed date for diff comparison — use raw string match.

### Distance formats

```
"1,427.2 mi"                  ← US standard with comma thousands
"528   mi"                    ← Multiple spaces (note!) — strip whitespace
"14.5 mi"                     ← Small distances
```

Parser:
```javascript
function parseDistance(text) {
  if (!text) return null;
  const match = text.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}
```

---

## BOOKING FLOW DOM ⚠️ CRITICAL

This is the **booking sequence** — the extension must NEVER trigger these accidentally.

### Step 1: Book button

```html
<button type="button" id="rlb-book-btn" class="wo-book-button css-1lpvuz4">
  Book
</button>
```

**Selector:** `#rlb-book-btn` ✅ STABLE (has explicit ID)

⚠️ **This button STARTS the booking flow** (shows confirmation expander).
**It does NOT book yet — but extension must treat it as the entry point to a dangerous flow.**

### Step 2: Confirmation expander appears

```html
<div data-id="confirmation-expander">
  <p>Confirm booking</p>
  <!-- Payout repeated -->
  <p>Are you sure you want to book this trip?</p>
  <div>
    <button type="button" id="rlb-book-trip-no-btn" class="css-1r6inv4">
      No
    </button>
    <button type="button" id="rlb-book-trip-confirm-booking-btn" class="css-n0loux">
      Yes, confirm booking
    </button>
  </div>
</div>
```

**Selectors:**
- Cancel: `#rlb-book-trip-no-btn` ✅
- **CONFIRM (BOOKS THE LOAD):** `#rlb-book-trip-confirm-booking-btn` ✅

### 🚨 ABSOLUTE RULE FOR EXTENSION

```
NEVER, under ANY circumstances, programmatically click:
  #rlb-book-trip-confirm-booking-btn  (FINALIZES booking)
  #rlb-book-btn                        (STARTS booking flow)

This project has NO clickAutomation.js. There is no module that
clicks on booking-related elements. The only .click() call in
the entire codebase is on the Amazon Refresh button.

The FORBIDDEN_SELECTORS guard is a paranoid backup — it ensures
that if a bug ever tries to click a forbidden element, the click
is blocked at the safeRefreshClick level.
```

### Required guard implementation

```javascript
// In utils/constants.js
export const FORBIDDEN_SELECTORS = [
  '#rlb-book-trip-confirm-booking-btn',
  '#rlb-book-btn'  // Even the entry button — extra paranoid
];

// In utils/helpers.js
export function isForbiddenElement(el) {
  if (!el) return false;
  return FORBIDDEN_SELECTORS.some(sel => el.matches(sel) || el.closest(sel));
}

// Paranoid guard: even the ONLY allowed click (Refresh) checks this first.
// See safeRefreshClick() example below for the full implementation.
```

### Confirmation expander state detection

```html
<!-- Collapsed (not visible) -->
<div data-id="confirmation-expander" class="css-1yrs1zw css-asslvc">

<!-- Expanded (visible, dangerous!) -->
<div data-id="confirmation-expander" class="css-1yrs1zw css-1oc31kb">
```

The state class changes (`css-asslvc` vs `css-1oc31kb`). Extension can detect:

```javascript
function isBookingConfirmationVisible() {
  const expander = document.querySelector('[data-id="confirmation-expander"]');
  if (!expander) return false;
  // Check if visible (height > 0, opacity > 0)
  const rect = expander.getBoundingClientRect();
  return rect.height > 0 && rect.width > 0;
}
```

⚠️ **If extension detects this is visible during automation → ABORT IMMEDIATELY, alert user.**

---

## RIGHT-SIDE PANEL (DO NOT USE)

The user explicitly stated:
> "Below is the code for the right window with information about the cargo that will need to be blocked. Do not use it as this information should be provided under the load itself."

### Identification

```html
<div mdn-sheet="">
  <div class="css-16puygj">
    <div id="selected-work-sheet" tabindex="-1">
      ...
```

**Selector:** `#selected-work-sheet` ✅

### Rule for extension

```javascript
// DO NOT:
// - Parse data from #selected-work-sheet
// - Display data using this panel
// - Modify or interact with this panel

// DO:
// - Detect when it's open (it opens automatically on row click)
// - Optionally auto-close it if extension expanded a card
// - Use Layout B (tour-expander) style for inline expansion

const rightPanel = document.querySelector('#selected-work-sheet');
if (rightPanel) {
  const closeBtn = rightPanel.querySelector('button.css-q7ppch');
  // closeBtn has the X close icon — can be used to dismiss panel after Amazon auto-opens it
}
```

### Why avoid

The user wants the extension to show load info **inline under the load card** (similar to how Layout B's tour-expander already does). The right panel takes screen space and breaks the flow.

### Note on the close button

```html
<button type="button" class="css-q7ppch">
  <!-- X icon SVG -->
</button>
```

⚠️ **The extension does NOT close the right panel programmatically.** This would require a `.click()`, and the only allowed click is on the Refresh button.

Since the extension does NOT click on load cards either, the right panel never opens through extension actions. If user opens it manually, they close it manually.

If in the future the panel becomes a problem (e.g., it stays open after navigation), the solution is documentation / user education, not adding new `.click()` calls.

---

## POST A TRUCK FORM

### Entry point (button "Create Order")

```html
<div class="css-1y8wo0k">
  <h1>Post A Truck</h1>
  ...
  <button type="button" class="css-ewdq4m">Create Order</button>
</div>
```

⚠️ Class `css-ewdq4m` is fragile. Better:
```javascript
// Find button by text content
function findCreateOrderBtn() {
  return Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Create Order');
}
```

### Form structure (numbered sections)

The "Create Order" form has 4 sections:

| Section | Label | Key inputs |
|---------|-------|------------|
| 1 | Order Type | radio: POWER_ONLY, BOX_TRUCK, TRAILER_REQUIRED |
| 2 | Location | Origin select + Radius |
| 3 | Schedule | Start date/time, End date/time, Block length |
| 4 | Payout | Min payout (number, USD) |

### Submit button

```html
<div class="css-m6lqsr">
  <button type="button" class="css-oxc2yj">Cancel</button>
  <button type="button" class="css-ewdq4m">Submit</button>
</div>
```

⚠️ **Submit button class `css-ewdq4m` is FRAGILE and shared with "Create Order".**

**MVP Stage 14 behavior:** The PAT helper FILLS the form fields with load
data, then STOPS. The user reviews and presses Submit themselves.

The extension must LOCATE the Submit button only to confirm the form is
ready — it must NEVER click it. Find it by text if needed:
```javascript
function findPATSubmit() {
  const form = document.querySelector('.css-kkw3y5');  // PAT form container
  if (!form) return null;
  return Array.from(form.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Submit');
}
// This is for VERIFICATION only. Never call .click() on the result.
```

🚨 **The PAT Submit button creates a real commitment (like booking). The
extension fills the form but the USER clicks Submit. Never automate it.**

---

## SPECIAL INDICATORS & HIGHLIGHTS

### Amazon's own highlight classes (detect these!)

```javascript
// Amazon marks price increases itself
'.wo-total_payout__modified-load-increase-attr'

// Amazon marks modified times
'.wo-card-header__components--modified-load-deviation-attr'

// Amazon marks loads that don't exactly match filters
'.wo-card-header__components--match-deviation-attr'
```

**Use these as DIFF SIGNALS** in detector logic — Amazon already knows what changed, leverage it.

```javascript
function detectAmazonHighlightedChanges(card) {
  return {
    priceIncreased: !!card.querySelector('.wo-total_payout__modified-load-increase-attr'),
    timeModified: !!card.querySelector('.wo-card-header__components--modified-load-deviation-attr'),
    matchDeviation: !!card.querySelector('.wo-card-header__components--match-deviation-attr')
  };
}
```

### Tooltip data attributes

Several elements have `title` attributes with useful data:

```html
<span title="Deadhead">Deadhead</span>
<span title="Tue May 12 19:15 EDT">Tue May 12 19:15 EDT</span>
<span title="Drop">Drop</span>
<span title="53' Trailer">53' Trailer</span>
<span title="113JS2WXB">113JS2WXB</span>
```

Use `title` attributes when text is truncated:
```javascript
const tooltip = el.getAttribute('title') || el.textContent;
```

---

## REFRESH BUTTON

⚠️ **NOT FOUND IN PROVIDED HTML.**

The reference screenshot from `VISUAL_CONTEXT.md` showed:
- Bottom-right corner
- "Next Refresh 19s" countdown
- Circular refresh icon (🔄)
- Toggle switch
- "30 s" interval selector

But this HTML excerpt does not include the refresh button. **User must manually inspect and add the selector here.**

### How to find it

1. Open Amazon Relay Load Board
2. Right-click the refresh icon at bottom-right → Inspect
3. Look for:
   - `aria-label` attribute (e.g., `aria-label="Refresh"`)
   - `data-test` or `data-id` attribute
   - Parent container with stable class
4. Copy the selector and add to `AMAZON_SELECTORS.md` and update this file

### Placeholder for user to fill

```javascript
// TO BE VERIFIED — user must inspect and confirm
const REFRESH_BUTTON_SELECTOR = 'button[aria-label="Refresh"]'; // GUESS
const AUTO_REFRESH_TOGGLE_SELECTOR = '???';
const INTERVAL_SELECT_SELECTOR = '???';
```

---

## JAVASCRIPT SNIPPETS FOR EXTENSION

### 1. Detect which layout is active

```javascript
function detectLayout() {
  const hasLoadCards = document.querySelector('div.load-card');
  const hasTourContainers = document.querySelector('[data-type$="-tour-container"]');

  if (hasLoadCards && hasTourContainers) return 'BOTH';
  if (hasLoadCards) return 'LAYOUT_A';
  if (hasTourContainers) return 'LAYOUT_B';
  return 'UNKNOWN';
}
```

### 2. Parse all loads on current page

```javascript
function parseAllLoads() {
  const layout = detectLayout();
  const results = [];

  if (layout === 'LAYOUT_A' || layout === 'BOTH') {
    const cards = document.querySelectorAll('div.load-card');
    cards.forEach(card => {
      const parsed = parseLoadCardA(card);
      if (parsed) results.push({ ...parsed, _layout: 'A' });
    });
  }

  if (layout === 'LAYOUT_B' || layout === 'BOTH') {
    const tours = document.querySelectorAll('[data-type$="-tour-container"]');
    tours.forEach(tour => {
      const parsed = parseTourB(tour);
      if (parsed) results.push({ ...parsed, _layout: 'B' });
    });
  }

  return results;
}
```

### 3. Find load by ID

```javascript
function findLoadElement(loadId) {
  // Try Layout A (UUID)
  const cardInner = document.getElementById(loadId);
  if (cardInner) {
    return cardInner.closest('div.load-card');
  }
  // Try Layout B (T-XXXXX)
  return document.querySelector(`[data-type="T-${loadId}-tour-container"]`)
      || document.querySelector(`[data-type="${loadId}-load-expander"]`);
}
```

### 4. Safe Refresh click — the ONLY click in this project

```javascript
// This is the ONLY .click() call allowed in the entire codebase.
// It clicks the Amazon Refresh button to refresh the load list.
// Refresh does NOT book anything — it's safe.

function safeRefreshClick(refreshButtonEl) {
  // Guard 1: Forbidden selectors (paranoid check)
  if (isForbiddenElement(refreshButtonEl)) {
    logger.error('safety', 'BLOCKED: refresh button matched forbidden selector!');
    return false;
  }

  // Guard 2: Element is still in DOM
  if (!document.contains(refreshButtonEl)) {
    logger.error('refresh', 'Refresh button no longer in DOM');
    return false;
  }

  // Guard 3: Element is visible
  const rect = refreshButtonEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    logger.error('refresh', 'Refresh button not visible');
    return false;
  }

  // Guard 4: Booking confirmation is NOT open (anomaly check)
  if (isBookingConfirmationVisible()) {
    logger.error('safety', 'ABORT refresh: booking confirmation is open!');
    return false;
  }

  // Finally, click — the ONLY .click() in the project
  refreshButtonEl.click();
  logger.log('refresh', 'Refresh button clicked');
  return true;
}

// IMPORTANT: Do not add similar functions for load cards, slots, or any
// other element. This project does NOT click on anything except Refresh.
```

### 5. Debug interface

```javascript
window.__EXT_DEBUG = {
  layout: () => detectLayout(),
  loads: () => parseAllLoads(),
  find: (id) => findLoadElement(id),
  highlights: () => {
    const cards = document.querySelectorAll('div.load-card');
    return Array.from(cards).map(c => ({
      id: c.querySelector('div[id]')?.id,
      ...detectAmazonHighlightedChanges(c)
    }));
  },
  forbidden: () => FORBIDDEN_SELECTORS.map(s => ({
    selector: s,
    found: !!document.querySelector(s)
  })),
  panelOpen: () => !!document.querySelector('#selected-work-sheet [aria-hidden="false"]'),
  bookingOpen: () => isBookingConfirmationVisible()
};
```

---

## STABLE VS FRAGILE SELECTORS

### ✅ STABLE — Safe to use long-term

These are stable because they use semantic attributes, not auto-generated class hashes:

| Selector | Layout | What it identifies |
|----------|--------|--------------------|
| `div.load-card` | A | Single load card container |
| `div.load-list` | A | Container of all cards |
| `div[id="UUID"]` inside `load-card` | A | Unique load identifier |
| `.wo-total_payout` | A | Total payout amount |
| `.wo-total_payout__modified-load-increase-attr` | A | Price increase indicator |
| `.wo-card-header__components` | A | Generic data fields (positional) |
| `.wo-card-header__components--match-deviation-attr` | A | Match deviation indicator |
| `.wo-card-header__components--modified-load-deviation-attr` | A | Time modification indicator |
| `.wo-book-button` | Both | Book button class |
| `.equipment-type-text` | A | Equipment type span |
| `.trailer-type-circle` | A | Trailer type badge |
| `.loading-type` | A | Drop/Live indicator |
| `.driver-icon__primary` | A | Driver type indicator |
| `[data-type$="-tour-container"]` | B | Tour wrapper |
| `[data-type$="-load-expander"]` | B | Load leg wrapper |
| `[data-type="tour-id"]` | B | Tour ID display |
| `[data-type="load-id"]` | B | Load ID display |
| `[data-type="tour-origin-info"]` | B | Origin info container |
| `[data-type="tour-destination-info"]` | B | Destination info container |
| `[data-type="tour-distance-string"]` | B | Distance text |
| `[data-type="load-distance-string"]` | B | Leg distance text |
| `[data-type="tour-payout-info"]` | B | Tour payout container |
| `[data-type="load-payout-info"]` | B | Leg payout container |
| `[data-type="tour-equipment-type-icons"]` | B | Equipment container |
| `[data-type="tour-loading-unloading-type"]` | B | Drop/Live container |
| `[data-type="tour-driver-name"]` | B | Driver name container |
| `[data-type="driver-select-component"]` | B | Driver dropdown |
| `[data-type="fleet-id-drop-down-tour-and-load-level"]` | B | Tractor dropdown |
| `[data-type="tour-origin-stop-number"]` | B | Origin stop number |
| `[data-type="tour-destination-stop-number"]` | B | Destination stop number |
| `[data-areatype="id"]` | B | ID column |
| `[data-areatype="rt"]` | B | Route column |
| `[data-areatype="dt"]` | B | Distance/time column |
| `[data-areatype="eq"]` | B | Equipment column |
| `[data-areatype="lt"]` | B | Loading type column |
| `[data-areatype="po"]` | B | Payout column |
| `[data-areatype="ta"]` | B | Team/assigned column |
| `[data-areatype="pb"]` | B | Progress bar column |
| `#rlb-book-btn` | Both | **Book button (FORBIDDEN)** |
| `#rlb-book-trip-no-btn` | Both | Cancel booking button |
| `#rlb-book-trip-confirm-booking-btn` | Both | **CONFIRM BOOKING (FORBIDDEN)** |
| `[data-id="confirmation-expander"]` | Both | Booking confirmation panel |
| `[data-id="confirmation-expander-header"]` | Both | Confirmation header |
| `[data-id="tour-card-footer-payout-button-component"]` | B | Payout details button |
| `[data-id="tour-card-footer-notes-button-component"]` | B | Notes button |
| `[data-id="tour-card-footer-route-button-component"]` | B | Route view button |
| `[data-id="tour-card-footer-shipment-details-button-component"]` | B | View all details button |
| `#selected-work-sheet` | A | **Right panel (DO NOT USE)** |

### ⚠️ FRAGILE — Avoid, use only as last resort

These class names are auto-generated by CSS-in-JS and **WILL change** between Amazon deploys:

```
css-1ehu6yl, css-1jxh1bg, css-8a5j1c, css-soq2b7, css-kabd3k, css-12mi905,
css-1caqfll, css-1ic066d, css-1maqsxd, css-1gmvhuf, css-uc6a2x, css-11ryso0,
css-71quzf, css-e9glob, css-34iy07, css-fnc3ff, css-1xm8gt, css-3kf4i7,
css-1gp38wa, css-1u2n91, css-nnltzv, css-1xqwq2z, css-11tnikh, css-1dk3tf8,
css-szxqie, css-m6lqsr, css-jarjh1, css-icpham, css-1tddwld, css-n4zms0,
css-1lpvuz4, css-1r6inv4, css-n0loux, css-1ewdq4m, css-oxc2yj, css-1y8wo0k,
css-kkw3y5, css-7dm71k, css-k0s1fz, css-1ns4cr4, css-m5jxjq, css-pevixi,
css-mlihzd, css-1c02o5u, css-1d7jqjm, css-1w7hcrk, css-sjn7ji, css-1jo6cya,
css-aw51o7, css-1wotdk2, css-bqipoy, css-w8td3l, css-18fdjxj, css-144vlu9,
css-1l86uv4, css-ufegzs, css-13muojn, css-1bpc0hw, css-hkr77h, css-fmqnxp,
css-1h0azo8, css-8okyzc, css-ni5jm1, css-i5khe3, css-1ixupz2, css-6k8kf,
... (and 200+ more)
```

**Never use any class starting with `css-` and a hash as a primary selector.**

---

## NOTE ON CLASSES WITH MEANING

Some classes look like CSS hashes but actually have semantic meaning. These ARE stable:

```
wo-card-header__components                              ← "wo" = WorkOrder semantic prefix
wo-total_payout                                         ← Payout semantic
wo-total_payout__modified-load-increase-attr            ← Price increase modifier
wo-book-button                                          ← Book button semantic
trailer-type-circle                                     ← Trailer type semantic
equipment-type-text                                     ← Equipment semantic
loading-type                                            ← Loading type semantic
driver-icon__primary                                    ← Driver icon semantic
scheduled-arrival__time                                 ← Schedule arrival semantic
scheduled-departure__time                               ← Schedule departure semantic
scheduled-time                                          ← Generic schedule time
pickup-window__window__header                           ← Pickup window header
pickup-window__window__dates                            ← Pickup window dates
load-list                                               ← Load list container
load-card                                               ← Load card container
load-expander                                           ← Load expander container
entity-id                                               ← Entity ID display
```

**Recognize by:** lowercase, hyphenated, often using BEM-style (`block__element--modifier`) naming. These are intentional semantic markers and survive deploys.

---

## CHANGELOG FOR THIS FILE

| Date | Change |
|------|--------|
| 2026-05-26 | Initial version from user-provided HTML excerpts |

---

## INSTRUCTIONS FOR USING THIS FILE WITH CLAUDE CODE

When asking Claude Code to write parser/click code, reference this file like:

```
@AMAZON_DOM_REFERENCE.md

Implement Stage 8 (Load Parser) using selectors from this reference.
Support both Layout A (load-card) and Layout B (tour-container).
Use parseLoadCardA() and parseTourB() functions as shown.
NEVER use any css-XXXXXX hash classes as primary selectors.
NEVER reference #rlb-book-trip-confirm-booking-btn except in FORBIDDEN_SELECTORS.
```

---

## END OF AMAZON_DOM_REFERENCE.md
