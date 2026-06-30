# Стан проекту
Оновлено: 2026-06-30

## Поточна фаза
**Step 3 — Підключення контролів попапу до `chrome.storage.local`**

Базові стадії 0–13 повністю завершені. Зараз послідовно підключаємо кожен перемикач у popup до реального стану зберігання.

---

## Що завершено

### Стадії 0–13 (ядро системи)
- **Manifest MV3** + базова структура файлів
- **`utils/constants.js`** — `FORBIDDEN_SELECTORS`, `isForbiddenElement`, `ALLOWED_CLICK_INTENTS`
- **`utils/logger.js`** — `logger.log/warn/error/debug`
- **`utils/storage.js`** — async `storage.get/set/remove/getAll`, `STORAGE_KEYS`
- **`utils/tabState.js`** ✅ NEW — per-tab store `{ running, refreshIntervalMs, surgeThreshold, priceHistory }`. Pub/sub (`subscribe/notify`) synchronous. `set()` mirrors refreshIntervalMs/surgeThreshold/priceHistory to sessionStorage. `init()` async: restores sessionStorage, seeds surgeThreshold from global storage if absent.
- **`content/refreshManager.js`** — `findRefreshButton()`, `refreshNow()` — єдиний дозволений клік #1 (кнопка Refresh)
- **`content/loadParser.js`** — `parseLoads()`, `parseOneCard()` — Layout A
- **`content/loadDetector.js`** — `detectNewLoads()` — Set-based diff, перший запуск без спрацьовування
- **`content/highlighter.js`** — `highlightNewLoads()`, `clearHighlights()` — клас `.ext-new-load`
- **`content/detailOpener.js`** — `openTopNewLoad()` — єдиний дозволений клік #2 (neutral zone картки); `scrollIntoView` + `setTimeout(250)` для карток поза viewport
- **`content/inlinePanel.js`** — `showInlinePanel()`, `initManualToggle()` — розкладна таблиця зупинок нижче натиснутої картки; полінг `waitForSheet`; сегментований акордеон
- **`content/sidebar.js`** — `buildSidebar()` — фіксована панель зверху; play/pause pill; повзунок швидкості; анімація scanline (CSS-only). **Синхронізація через tabState pub/sub** (не onChanged). `chrome.storage.onChanged` для RUNNING/SPEED видалено. ~~`sidebar-surge-threshold`~~ видалено 2026-06-18 (tabState.surgeThreshold залишається, UI прибрано).
- **`content/loadObserver.js`** ✅ NEW (2026-06-18, fixed ×3, DIAG logs removed) — MutationObserver. **Anchor: `document.body`** `{ childList:true, subtree:true }`. `hasExternalChange()` filter: fires debounce for ANY non-ext childList mutation (class-name-agnostic). `isExtManagedNode()` guards surge badges + inline panel. `_pipelineRunning` flag prevents concurrent pipeline runs. Debounce 200ms. Same detect→highlight→sound→tabAlert→auto-open→auto-stop pipeline as tick. Standard logs only.
- **`content/panelCloser.js`** ✅ (2026-06-18) — `closePanelsForStart()`: закриває тільки detail sheet (`#selected-work-sheet`) при старті петлі. Лівий filter panel навмисно не чіпається (залишається відкритим якщо вже відкрито). `findDetailCloseButton()` + `isForbiddenElement()` перед кліком. Усі спроби закрити filter panel видалені 2026-06-18.
- **`content/inlinePanel.js`** — `initManualToggle()`: при ручному кліку на картку (`waitForSheet` callback) — тепер викликає `tabState.set('running', false)` (FIX 2, 2026-06-18) перед `showInlinePanel`. Зупиняє петлю тільки в цьому таб. Не торкається extension auto-open шляху. **Global stop numbers ✅ (2026-06-18):** `readSheetData()` призначає глобальні номери зупинок: сегмент N → `stops[0].num=N+1`, `stops[last].num=N+2`. `buildSegmentTable()` рендерить `.ext-stop-num` кружок коли `stop.num` не порожній. **Segment header rows ✅ (2026-06-18):** `buildPanelElement()` — `titleSpan` тепер береться з `stops[0].num` (а не `i+1`); у `destEl` додано `.ext-stop-num` кружок з `stops[last].num` перед кодом дестинації. Результат: рядок 0: `[1]` KILN → `[2]` DCM5; рядок 1: `[2]` DCM5 → `[3]` CMH1.
- **`content/content.js`** — оркестратор: підсвітка → звук → Tab Alert → авто-відкриття деталей → показ панелі → автостоп через `tabState.set('running', false)`. **Per-tab state ✅ (2026-06-18)**: `tabState.subscribe('running', fn)` замість onChanged; `scheduleNextTick()` — синхронна, читає tabState; init wrapped в async IIFE `await tabState.init()` перед buildSidebar. `closePanelsForStart()` викликається в subscriber при val=true. **Memory watchdog ВИДАЛЕНО (2026-06-30):** автоматичний `location.reload()` прибрано повністю — він непомітно скидав фільтри пошуку Amazon (Origin/Radius/Payout/Equipment), які живуть лише в React-стані, не в URL. Замінено на `getHeapUsageRatio()` — чисте читання `performance.memory`, без побічних дій.

### Step 3 — підключені контролі попапу
- **Night Mode ✅** — `content/nightMode.js`: CSS-клас `html.ext-night`. Ключ: `STORAGE_KEYS.NIGHT_MODE = 'nightMode'`.
- **Tab Alert ✅** — `content/tabAlert.js`: мигання заголовка + favicon (червоний/жовтий), тільки коли вкладка не у фокусі. Ключ: `STORAGE_KEYS.TAB_ALERT = 'tabAlert'`.
- **Hide Similar Matches ✅** — `content/filterSimilar.js`: CSS `:has()` ховає батьківський блок до рендеру. Ключ: `STORAGE_KEYS.HIDE_SIMILAR = 'hideSimilarMatches'`.
- **Sound block ✅** — `content/soundAlert.js` + `popup/popup.js`: 25 звуків, volume slider, sound select, replay button. Persists `soundVolume` + `soundId`.
- **Hide tag filters ✅** — `content/filterTags.js`: Promoted / Starting soon / Trailer ready / Booked before. `display:none` на badge елементах (простір колапсується). `recomputeWrappers()` ховає `.wo-tag` wrapper якщо всі відомі дочірні теги приховані. Ключі: `hidePromoted`, `hideStartingSoon`, `hideTrailerReady`, `hidePastBook`.
- **Price Surge Alert ✅** — `content/priceSurge.js`: `checkPriceSurge(loads)` кожен тік. Тригер тільки на зростання payout >= threshold. `.ext-surge-price` + `↑ +$NN` badge. **Per-tab ✅**: threshold + priceHistory в tabState; тільки `surgeEnabled` залишається в chrome.storage.local. Sidebar `sidebar-surge-threshold` — per-tab override.

### Inline panel — візуальне доведення ✅
- Грід: `40px minmax(0,3fr) 1.4fr 1fr 1fr 32px`. Route-колонка: inner 3-column grid `1fr auto 1fr`. Plain text для Loaded/Empty/Drop/Live.

### ext-action-map wired ✅ DONE (2026-06-30)
Click → `openRouteInMaps(data)` → collects unique stops from `data.segments` (dedup by `stop.num`; boundary stops shared between adjacent segments counted once) → builds Google Maps Directions URL: `origin`=stop[0], `destination`=stop[last], `waypoints`=intermediate stops joined by `|` (omitted when only 2 stops). Each stop encoded as `stop.name + ' ' + stop.address` via `encodeURIComponent`. Opens via `window.open(_blank, noopener,noreferrer)`. Handler lives in `showInlinePanel()` where `data` is in scope. No new permissions, no new dependencies.

### ext-action-camera wired ✅ DONE (2026-06-30)
Click → `html2canvas(cardElement)` → PNG blob → `navigator.clipboard.write()`. Success: green checkmark flash 1.1 s. Error: `logger.error()`. `vendor/html2canvas.min.js` v1.4.1 vendored (194 KB). `clipboardWrite` permission added to manifest.json. Handler lives in `showInlinePanel()` (where `cardElement` is in scope); `captureCardToClipboard()` + `flashActionSuccess()` are new functions.

### Card Action Bar — icons rendered ✅ DONE (2026-06-30)
Три кнопки-іконки (camera / map-pin / document+plus) додано в нижню частину кожної inline-панелі через `buildActionBar()` в `inlinePanel.js`. Render-only — без click handlers. CSS: `.ext-action-bar` + `.ext-action-btn` (hover тільки CSS). Testid: `ext-action-bar`, `ext-action-camera`, `ext-action-map`, `ext-action-post`.

### Reset to Defaults ✅ DONE (2026-06-30)
`popup-reset` button повністю підключено. Клік → `chrome.storage.local.remove(Object.values(STORAGE_KEYS))` без підтвердження → скидає всі popup-контроли до документованих defaults в callback. `tabState`/sessionStorage не чіпається. Перестилізовано як muted text-link, bottom-left. Виявлено і виправлено баг у `chrome.storage.onChanged` (volume/soundId/surgeThreshold призначали `undefined` при видаленні ключів — тепер fallback до defaults). `utils/constants.js`, `utils/logger.js`, `utils/storage.js` додано до `popup.html` (для `STORAGE_KEYS` та `logger`). Деталі: CHANGELOG.md 2026-06-30.

### Manual memory indicator ✅ DONE (2026-06-30)
Замінено автоматичний memory-watchdog reload на ручний індикатор у sidebar. `content/sidebar.js`: `ext-memory-indicator` — кольорова крапка (green ≤40% → amber ~62.5% → red ≥85%), оновлюється кожні 7с через `getHeapUsageRatio()` (content.js), незалежно від `tabState.running`. Клік/Enter/Space → `location.reload()` напряму — лише за ініціативою диспетчера, без жодного автоматичного тригера. `ext-memory-info` — іконка з tooltip (hover + tap/focus) що пояснює дію та попереджає про втрату фільтрів Amazon. Документовано в SAFETY.md як "Extension-owned click" — окрема категорія від трьох дозволених кліків по Amazon DOM. Деталі: CHANGELOG.md 2026-06-30.

---

## Що в роботі
Нічого активного. ext-action-map wired завершено 2026-06-30.

---

## Що далі (1–2 кроки)

1. **Auto-restore Amazon filters after reload** (PLANNED, потребує SAFETY.md review перед стартом).
2. **Memory-leak audit** — `_element` в `knownLoadIds` ✅ ЗАКРИТО 2026-06-30 (non-issue). Єдине джерело heap-росту, що залишилось — Amazon's React SPA; диспетчер управляє цим через ручний `ext-memory-indicator` reload.
3. **Memory-leak audit** — `_element` DOM-посилання в `knownLoadIds` (`loadDetector.js`). **Watchdog-backstop більше немає** (видалено 2026-06-30) — аудит тепер напряму зменшує, як часто диспетчеру треба тиснути на ручний індикатор.
4. **Auto-restore Amazon filters after reload** (PLANNED, не розпочато) — потребує окремого SAFETY.md review перед стартом, бо вимагає нових click/input сайтів на Amazon DOM (фільтр-панель). Див. BACKLOG.md.

---

## Блокери / важливі рішення

- **Memory-leak audit**: `_element` DOM-посилання в `knownLoadIds` (`loadDetector.js`) можуть блокувати GC. Автоматичного watchdog-backstop більше немає (видалено 2026-06-30) — дисплей покладається на ручний reload диспетчера.
- **`clipboardWrite` permission**: не додавати до manifest до реалізації Copy Screenshot (Card Action Bar).
- **Amazon filters not restorable automatically**: search filters (Origin/Radius/Payout/Equipment) живуть лише в React-стані Amazon, не в URL — втрачаються при будь-якому reload (раніше автоматичному, тепер лише ручному). Авто-відновлення — окрема майбутня фіча, потребує нових кліків на Amazon DOM.
