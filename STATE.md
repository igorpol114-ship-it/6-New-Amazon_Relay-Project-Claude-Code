# Стан проекту
Оновлено: 2026-06-16

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
- **`content/refreshManager.js`** — `findRefreshButton()`, `refreshNow()` — єдиний дозволений клік #1 (кнопка Refresh)
- **`content/loadParser.js`** — `parseLoads()`, `parseOneCard()` — Layout A
- **`content/loadDetector.js`** — `detectNewLoads()` — Set-based diff, перший запуск без спрацьовування
- **`content/highlighter.js`** — `highlightNewLoads()`, `clearHighlights()` — клас `.ext-new-load`
- **`content/detailOpener.js`** — `openTopNewLoad()` — єдиний дозволений клік #2 (neutral zone картки); `scrollIntoView` + `setTimeout(250)` для карток поза viewport
- **`content/inlinePanel.js`** — `showInlinePanel()`, `initManualToggle()` — розкладна таблиця зупинок нижче натиснутої картки; полінг `waitForSheet`; сегментований акордеон
- **`content/sidebar.js`** — `buildSidebar()` — фіксована панель зверху; play/pause pill; повзунок швидкості; анімація scanline (CSS-only); синхронізація через `chrome.storage.onChanged`
- **`content/content.js`** — оркестратор: підсвітка → звук → Tab Alert → авто-відкриття деталей → показ панелі → автостоп

### Step 3 — підключені контролі попапу
- **Night Mode ✅** — `content/nightMode.js`: CSS-клас `html.ext-night`. Ключ: `STORAGE_KEYS.NIGHT_MODE = 'nightMode'`.
- **Tab Alert ✅** — `content/tabAlert.js`: мигання заголовка + favicon (червоний/жовтий), тільки коли вкладка не у фокусі. Ключ: `STORAGE_KEYS.TAB_ALERT = 'tabAlert'`.
- **Hide Similar Matches ✅** — `content/filterSimilar.js`: CSS `:has()` ховає батьківський блок до рендеру. Ключ: `STORAGE_KEYS.HIDE_SIMILAR = 'hideSimilarMatches'`.
- **Sound block ✅** — `content/soundAlert.js` + `popup/popup.js`:
  - Volume slider (`popup-volume`): зберігається як `soundVolume` (0–100, default 70). `gain = volume / 100`; `volume === 0` → тиша.
  - Sound select (`popup-sound-select`): **25 звуків** у dispatch-таблиці `SOUND_DEFS`. Зберігається як `soundId` (default `'default'`). Підтримка `freqEnd` для плавних sweep-тонів.
  - При зміні dropdown — негайний preview. Кнопка `popup-sound-replay` (▶) — повтор preview.
  - `SOUND_MUTED` повністю видалено. Sound block **ЗАКРИТО**.
- **Hide tag filters ✅** — `content/filterTags.js`: три тогли в попапі — Promoted, Starting soon, Trailer ready. Ховає **лише значок тегу** (`visibility:hidden` на `[id="PROMOTED"]` / `[id="STARTING_SOON"]` / `[id="TRAILER_READY"]`). Картка залишається повністю видимою та бере участь у детекції нових вантажів. MutationObserver тільки поки ≥1 тогл ввімкнено. Ключі: `hidePromoted`, `hideStartingSoon`, `hideTrailerReady`.

### Inline panel — візуальне доведення ✅
- **Грід**: `40px minmax(0,3fr) 1.4fr 1fr 1fr 32px`. Route-колонка: origin + `→` + destination як окремі DOM-вузли (`textContent`). Monospace для кодів локацій. Dist·time — muted, centered.
- **Стрілки вирівняні по колонці**: `.ext-seg-route` — внутрішній 2-колонковий грід `150px 1fr`. Origin у фіксованій 150px-колонці; `.ext-route-right` (arrow + dest) — у `1fr`. Стрілки завжди стоять в одній вертикальній лінії незалежно від довжини origin.
- **Без badge-пілюль**: Loaded/Empty → plain text з кольором (`.ext-seg-loaded` / `.ext-seg-empty`). Drop/Live/Preloaded → plain text (`ext-seg-action`, muted). Усі тři badge-класи видалені.

---

## Що в роботі
Нічого активного. Inline panel **ЗАКРИТО** 2026-06-16.

---

## Що далі (1–2 кроки)

1. **Price Surge Alert** — `popup-surge` + `popup-surge-threshold`: порівнювати поточний payout з останнім відомим для кожного loadId. Потребує per-loadId price-history store з очищенням. Ключі: `SURGE_ENABLED`, `SURGE_THRESHOLD`, `PRICE_HISTORY`.
2. **Reset to Defaults** — `popup-reset`: очищення всіх extension-ключів з `chrome.storage.local`.

---

## Блокери / важливі рішення

- **Price-history store (Price Surge)**: повинен очищати записи для loadId, яких більше немає на сторінці — інакше RAM та storage зростають без обмежень.
- **Memory-leak audit**: `_element` DOM-посилання в `knownLoadIds` (`loadDetector.js`) можуть блокувати GC. Запланований аудит.
- **`clipboardWrite` permission**: не додавати до manifest до реалізації Copy Screenshot (Card Action Bar).
