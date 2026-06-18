# Стан проекту
Оновлено: 2026-06-18

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
- **`content/loadObserver.js`** ✅ NEW (2026-06-18, fixed 2026-06-18) — MutationObserver. **Anchor: `document.body`** (not `div.load-list` — that node is volatile; Amazon unmounts+remounts it on filter change). Config: `{ childList:true, subtree:true }`. `hasLoadCardChange()` filter: only debounces when load cards or load-list container appear/disappear (4 cases). `isExtManagedNode()` guards surge badges + inline panel. DIAG logs active until confirmed. Debounce 200ms. `runObserverPipeline()`: same pipeline as tick. `startLoadObserver()` / `stopLoadObserver()` from tabState 'running' subscriber and memory-watchdog path.
- **`content/panelCloser.js`** ✅ (2026-06-18) — `closePanelsForStart()`: закриває тільки detail sheet (`#selected-work-sheet`) при старті петлі. Лівий filter panel навмисно не чіпається (залишається відкритим якщо вже відкрито). `findDetailCloseButton()` + `isForbiddenElement()` перед кліком. Усі спроби закрити filter panel видалені 2026-06-18.
- **`content/inlinePanel.js`** — `initManualToggle()`: при ручному кліку на картку (`waitForSheet` callback) — тепер викликає `tabState.set('running', false)` (FIX 2, 2026-06-18) перед `showInlinePanel`. Зупиняє петлю тільки в цьому таб. Не торкається extension auto-open шляху.
- **`content/content.js`** — оркестратор: підсвітка → звук → Tab Alert → авто-відкриття деталей → показ панелі → автостоп через `tabState.set('running', false)`. Memory watchdog ✅. **Per-tab state ✅ (2026-06-18)**: `tabState.subscribe('running', fn)` замість onChanged; `scheduleNextTick()` — синхронна, читає tabState; init wrapped в async IIFE `await tabState.init()` перед buildSidebar. `closePanelsForStart()` викликається в subscriber при val=true.

### Step 3 — підключені контролі попапу
- **Night Mode ✅** — `content/nightMode.js`: CSS-клас `html.ext-night`. Ключ: `STORAGE_KEYS.NIGHT_MODE = 'nightMode'`.
- **Tab Alert ✅** — `content/tabAlert.js`: мигання заголовка + favicon (червоний/жовтий), тільки коли вкладка не у фокусі. Ключ: `STORAGE_KEYS.TAB_ALERT = 'tabAlert'`.
- **Hide Similar Matches ✅** — `content/filterSimilar.js`: CSS `:has()` ховає батьківський блок до рендеру. Ключ: `STORAGE_KEYS.HIDE_SIMILAR = 'hideSimilarMatches'`.
- **Sound block ✅** — `content/soundAlert.js` + `popup/popup.js`: 25 звуків, volume slider, sound select, replay button. Persists `soundVolume` + `soundId`.
- **Hide tag filters ✅** — `content/filterTags.js`: Promoted / Starting soon / Trailer ready / Booked before. `display:none` на badge елементах (простір колапсується). `recomputeWrappers()` ховає `.wo-tag` wrapper якщо всі відомі дочірні теги приховані. Ключі: `hidePromoted`, `hideStartingSoon`, `hideTrailerReady`, `hidePastBook`.
- **Price Surge Alert ✅** — `content/priceSurge.js`: `checkPriceSurge(loads)` кожен тік. Тригер тільки на зростання payout >= threshold. `.ext-surge-price` + `↑ +$NN` badge. **Per-tab ✅**: threshold + priceHistory в tabState; тільки `surgeEnabled` залишається в chrome.storage.local. Sidebar `sidebar-surge-threshold` — per-tab override.

### Inline panel — візуальне доведення ✅
- Грід: `40px minmax(0,3fr) 1.4fr 1fr 1fr 32px`. Route-колонка: inner 3-column grid `1fr auto 1fr`. Plain text для Loaded/Empty/Drop/Live.

---

## Що в роботі
Нічого активного. MutationObserver instant detection завершено 2026-06-18.

---

## Що далі (1–2 кроки)

1. **Reset to Defaults** (`popup-reset`) — очищення всіх extension-ключів з `chrome.storage.local`.
2. **Hide Similar Matches** — `popup-hide-similar` (UI-BUILT, not wired).
3. **Memory-leak audit** — `_element` DOM-посилання в `knownLoadIds` (`loadDetector.js`). Watchdog є як backstop; аудит зменшить частоту перезавантажень.

---

## Блокери / важливі рішення

- **Memory-leak audit**: `_element` DOM-посилання в `knownLoadIds` (`loadDetector.js`) можуть блокувати GC. Watchdog вже є як backstop.
- **`clipboardWrite` permission**: не додавати до manifest до реалізації Copy Screenshot (Card Action Bar).
