# MVP SPECIFICATION — Amazon Relay Helper Extension

**Версія:** 2.0 (MVP — clean rebuild)
**Дата:** 2 червня 2026
**Платформа:** Chrome Extension Manifest V3
**Мова:** Vanilla JavaScript (без jQuery, без фреймворків)
**Цільовий сайт:** Amazon Relay Load Board

---

## 🚨 НАЙГОЛОВНІШЕ — ПРОЧИТАТИ ПЕРШИМ

### Розширення НЕ бронює вантажі. Крапка.

Це **абсолютна, незмінна заборона** для MVP:

- ❌ Розширення НІКОЛИ не натискає кнопку Book (`#rlb-book-btn`)
- ❌ Розширення НІКОЛИ не натискає підтвердження (`#rlb-book-trip-confirm-booking-btn`)
- ❌ Немає автобукерів, немає авто-бронювання, немає «бронювання за один клік»
- ❌ Немає `clickAutomation.js`, `autoBooking.js` чи подібних файлів
- ❌ Немає ARMED перемикача

«Бронювання за один клік» — це **окрема майбутня функція**, яка буде розроблятись пізніше, окремо, з окремою специфікацією. У ЦЬОМУ MVP її НЕМАЄ.

### Єдиний дозволений `.click()` у проєкті

Розширення робить рівно **два типи кліків**, обидва безпечні:

1. **Refresh кнопка Amazon** (внизу сторінки) — оновлює список, нічого не бронює
2. **Neutral zone вантажу** — відкриває деталі вантажу (right panel), нічого не бронює

Більше жодних програмних кліків. PAT-форма заповнюється, але **Submit натискає користувач сам**.

---

## ЗАГАЛЬНЕ БАЧЕННЯ (для контексту)

Кінцева система (майбутнє, НЕ цей MVP) складається з:
- Розширення на кількох акаунтах → збирають вантажі
- Сервер → дедуплікація, спільний пул, cross-account показ
- AI-агент → аналіз, рекомендації, (далеке майбутнє) авто-бронювання

**Цей MVP — це Фаза 1: тільки розширення, тільки твій акаунт.**
Сервер, cross-account, AI — все це майбутні фази. Архітектура MVP має
залишити чисте місце для їх додавання, але НЕ реалізовувати їх зараз.

---

## ФУНКЦІЇ MVP (що саме будуємо)

### Розширення на сторінці Amazon Relay:

1. **Refresh engine** — періодично натискає внутрішню кнопку Refresh Amazon (НЕ перезавантаження сторінки), з регульованою швидкістю через повзунок
2. **Парсер вантажів** — сканує список, витягує структуровані дані (Layout A і Layout B)
3. **Детектор нових вантажів** — порівнює знімки, знаходить нові
4. **Підсвічування** — нові вантажі підсвічуються кольором
5. **Звукове сповіщення** — один звук при появі нових (не по кожному), вибір з 20 згенерованих тонів
6. **Авто-відкриття деталей** — коли з'являються нові вантажі: підсвітити всі нові → один звук → один клік по neutral zone найвищого нового вантажу (відкриває деталі)
7. **Top sidebar** — мінімалістична панель прикріплена зверху сторінки
8. **Popup меню** — випадає при натисканні іконки розширення в Chrome (швидкість, налаштування)
9. **PAT helper** — кнопка на кожному вантажі → шаблон з параметрами вантажу → підтвердження → заповнення форми Post-a-Truck (Submit тисне користувач)

### Що НЕ в MVP (майбутні фази):

- Сервер і відправка даних
- Дедуплікація на сервері
- Cross-account показ вантажів
- AI-агент
- Авто-бронювання / «бронювання за один клік»
- Авто-Submit для PAT

---

## АРХІТЕКТУРА ПРОЄКТУ

```text
relay-extension/
│
├── manifest.json
│
├── docs/                              ← документація (Stage 0)
│   ├── SPEC.md
│   ├── SAFETY.md
│   ├── UI_ELEMENTS.md
│   ├── AMAZON_SELECTORS.md
│   ├── GLOSSARY.md
│   ├── CHANGELOG.md
│   ├── TEST_CASES.md
│   ├── BUG_REPORT_TEMPLATE.md
│   └── CLAUDE.md
│
├── background/
│   └── background.js                  ← service worker
│
├── popup/                             ← Chrome toolbar popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
│
├── content/
│   ├── content.js                     ← entry point
│   │
│   ├── ui/
│   │   ├── sidebar.js                 ← top sidebar
│   │   ├── sidebar.css
│   │   ├── patModal.js                ← Post-a-Truck template modal
│   │   ├── patModal.css
│   │   ├── debugOverlay.js
│   │   └── soundManager.js            ← Web Audio API, 20 tones
│   │
│   ├── logic/
│   │   ├── refreshManager.js
│   │   ├── loadDetector.js
│   │   ├── priceTracker.js
│   │   ├── detailsOpener.js           ← opens details of top new load (1 click)
│   │   ├── patHelper.js               ← fills PAT form (no Submit)
│   │   └── storageManager.js
│   │
│   └── parsers/
│       └── loadParser.js              ← Layout A + Layout B
│
└── utils/
    ├── constants.js                   ⚠️ FORBIDDEN_SELECTORS here
    ├── helpers.js
    ├── logger.js
    └── domSelectors.js

# Reserved for future phases (NOT created in MVP):
#   services/apiService.js       (server upload — Phase 2)
#   services/websocketService.js (realtime — Phase 2)
#   content/logic/aiAgent.js     (AI — Phase 3+)
```

---

## ЕТАПИ РОЗРОБКИ

Кожен етап: **мета → файли → acceptance criteria → тест → commit**.
Правило: не переходити до наступного етапу поки поточний не працює на 100%.
Після кожного робочого етапу — `git commit`.

---

### Stage 0 — Documentation Foundation 📚

**Мета:** Створити всю документацію до написання коду.

**Файли:** всі 9 у `docs/` + `README.md`. Зміст — за шаблонами нижче в цьому документі.

**Acceptance:** 9 файлів існують, мають реальний зміст, жодного `.js` файлу ще немає.

**Тест:** не потрібен (немає коду).

**Commit:** `chore: documentation foundation`

---

### Stage 1 — Manifest & Empty Skeleton 🏗️

**Мета:** Розширення завантажується в Chrome без помилок.

**Файли:**
- `manifest.json` (Manifest V3)
- `background/background.js` — лог при старті
- `content/content.js` — лог при завантаженні

**Manifest вимоги:**
- `manifest_version: 3`
- `host_permissions`: точний URL Amazon Relay Load Board (НЕ `<all_urls>`)
- `permissions`: `storage`, `scripting`, `activeTab`
- `content_scripts.run_at`: `document_idle`
- `action` з popup (для Stage 9)

**Acceptance:** завантажується через chrome://extensions без червоних помилок; обидва логи видно в консолі на сторінці Amazon.

**Тест:** Load unpacked → відкрити Amazon Relay → F12 → бачиш `[EXT][bg] loaded` і `[EXT][content] loaded`.

**Commit:** `feat(stage-1): manifest v3 and skeleton`

---

### Stage 2 — Logger & Constants 📝

**Мета:** Централізоване логування + базові константи (включно з safety).

**Файли:**
- `utils/logger.js`
- `utils/constants.js`

**constants.js обов'язково містить:**
```javascript
export const FORBIDDEN_SELECTORS = [
  '#rlb-book-btn',                        // STARTS booking flow
  '#rlb-book-trip-confirm-booking-btn'    // FINALIZES booking
];
export const DEBUG_LEVEL = 2;
```

**logger.js інтерфейс:**
```javascript
logger.log(module, msg, data)
logger.warn(module, msg, data)
logger.error(module, msg, error)
logger.debug(module, msg, data)   // тільки якщо DEBUG_LEVEL >= 2
```

Формат: `[EXT][timestamp][module] message {data}`

**Acceptance:** logger працює в content і background; debug приховується при DEBUG_LEVEL < 2; FORBIDDEN_SELECTORS експортується.

**Тест:** тестові логи з'являються при завантаженні.

**Commit:** `feat(stage-2): logger and safety constants`

---

### Stage 3 — Top Sidebar (порожній) 🎨

**Мета:** Панель з'являється зверху сторінки, не ламає верстку Amazon.

**Файли:**
- `content/ui/sidebar.js`
- `content/ui/sidebar.css`
- оновити `content/content.js` → `sidebar.init()`

**Вимоги:**
- `position: fixed`, прикріплена зверху, по центру горизонтально
- `z-index: 2147483647`
- темно-зелений фон (як Amazon Relay)
- поки тільки назва «Relay Helper» + версія
- `body { padding-top }` через CSS injection щоб не накривати контент

**Acceptance:** панель видно, контент Amazon не накритий, не зникає при скролі.

**Тест:** відкрити Amazon Relay → панель зверху → скрол → панель на місці.

**Commit:** `feat(stage-3): empty top sidebar`

---

### Stage 4 — Sidebar Controls (UI only) 🎛️

**Мета:** Елементи керування на панелі. Тільки логи кліків, без логіки.

**Елементи (всі з `data-testid`):**

| Елемент | data-testid | Тип |
|---------|-------------|-----|
| Start | `btn-start` | button |
| Stop | `btn-stop` | button |
| Повзунок швидкості | `slider-refresh-speed` | input range |
| Значення швидкості | `label-speed-value` | span |
| Перемикач звуку | `toggle-sound` | checkbox |
| Перемикач debug | `toggle-debug` | checkbox |
| Індикатор статусу | `indicator-status` | span |
| Лічильник refresh | `counter-refresh` | span |
| Лічильник нових | `counter-new-loads` | span |

**Acceptance:** усі елементи видно, кожен з testid, клік логується, повзунок дає десяткові значення.

**Тест:** натиснути кожен → лог `[EXT][sidebar] click btn-start`.

**Commit:** `feat(stage-4): sidebar controls with test IDs`

---

### Stage 5 — Storage Manager 💾

**Мета:** Зберігати налаштування між перезавантаженнями.

**Файли:** `content/logic/storageManager.js`

**Зберігається в `chrome.storage.local`:**
```javascript
{
  isRunning: false,
  refreshSpeed: 2.5,
  soundEnabled: true,
  soundChoice: 1,       // який з 20 тонів
  debugMode: false
}
```

**Acceptance:** Start зберігається, після reload стан відновлюється, швидкість зберігається.

**Тест:** Start → reload → статус «running» відновлений.

**Commit:** `feat(stage-5): storage manager`

---

### Stage 6 — Refresh Engine (dry test) 🔄

**Мета:** Логіка інтервалу + симульований клік (лог). Перевірити що таймер не дублюється і не тече.

**Файли:**
- `content/logic/refreshManager.js`
- `utils/domSelectors.js` (селектор Refresh кнопки — TODO для тебе)

**Клас:**
```javascript
class RefreshManager {
  start()
  stop()
  triggerRefresh()    // dry test: тільки лог "[dry] would click refresh"
  setSpeed(seconds)
}
```

**Важливо:** тільки ОДИН активний інтервал; `stop()` чистить через `clearInterval`; safety lock проти overlap.

**Acceptance:** Start → лог кожні N сек; Stop → припиняється; зміна швидкості → новий інтервал; немає memory leak.

**Тест:** Start інтервал 2с → логи кожні 2с → Stop → тиша.

**Commit:** `feat(stage-6): refresh engine dry test`

---

### Stage 7 — Refresh Engine (live) ✅

**Мета:** Реальний клік по Refresh кнопці Amazon. Безпечно — refresh нічого не бронює.

**Файли:** оновити `refreshManager.js` → використати `safeRefreshClick()`

**safeRefreshClick перевіряє:** елемент не forbidden, в DOM, видимий, booking confirmation НЕ відкрито. Тоді клік.

**Acceptance:** Refresh реально натискається, список оновлюється, при відсутності кнопки extension не падає.

**Тест:** Start інтервал 3с → список Amazon оновлюється → Stop → припиняється.

**Commit:** `feat(stage-7): refresh engine live click`

---

### Stage 8 — Load Parser 📦

**Мета:** Парсити вантажі в структуру (Layout A + Layout B).

**Файли:**
- `content/parsers/loadParser.js`
- `utils/domSelectors.js`

**Структура вантажу:**
```javascript
{
  id, payout, pricePerMile, origin, destination,
  pickupTime, deliveryTime, distance, duration,
  deadhead, equipment, loadType, isPromoted, stopCount,
  _layout, _element, _parseTime
}
```

Використати `parseLoadCardA()` і `parseTourB()` з AMAZON_DOM_REFERENCE.md.
Використати `parsePayoutFlexible()` для US/EU форматів цін.

**Захист від race conditions:** перевіряти `isComplete()` перед прийняттям знімка; якщо напівзавантажений — повернути попередній.

**Debug interface:**
```javascript
window.__EXT_DEBUG = {
  getLoads: () => /* parsed loads */,
  getLayout: () => /* 'A' | 'B' | 'BOTH' */,
  ...
}
```

**Acceptance:** `__EXT_DEBUG.getLoads()` повертає масив з заповненими полями; кількість = видимим вантажам.

**Тест:** консоль → `window.__EXT_DEBUG.getLoads()` → масив об'єктів з цінами.

**Commit:** `feat(stage-8): load parser layout A and B`

---

### Stage 9 — Popup Menu 🔽

**Мета:** Випадне меню з іконки розширення в Chrome toolbar.

**Файли:**
- `popup/popup.html`
- `popup/popup.js`
- `popup/popup.css`

**Зміст popup:**
- Повзунок швидкості (синхронізований зі sidebar через storage)
- Перемикач звуку + вибір з 20 звуків (dropdown)
- Перемикач debug
- Кнопка Start/Stop (дублює sidebar)
- Статус

**Acceptance:** popup відкривається з іконки; зміни в popup синхронізуються зі sidebar через `chrome.storage`; вибір звуку зберігається.

**Тест:** клік на іконку → popup → змінити швидкість → sidebar оновлюється.

**Commit:** `feat(stage-9): toolbar popup menu`

---

### Stage 10 — Snapshot & Diff (Load Detector) 🔍

**Мета:** Виявляти нові вантажі.

**Файли:**
- `content/logic/loadDetector.js`
- `content/logic/priceTracker.js`

**Клас:**
```javascript
class LoadDetector {
  takeSnapshot()
  detectNewLoads()       // → [load, ...]
  detectPriceChanges()   // → [{id, oldPrice, newPrice}, ...]
}
```

Після кожного refresh → snapshot → diff → подія `extension:load-diff`.
Використати Amazon-власні класи (`wo-total_payout__modified-load-increase-attr`) як додатковий сигнал.

**Acceptance:** новий вантаж → `detectNewLoads()` має його; зміна ціни → в `detectPriceChanges()`.

**Тест:** консоль → `__EXT_DEBUG.getLastDiff()` показує нові.

**Commit:** `feat(stage-10): snapshot and diff`

---

### Stage 11 — Visual Highlighting 🎨

**Мета:** Підсвічувати нові вантажі і зміни цін.

**Файли:** `content/ui/sidebar.css` (класи) + `loadDetector.js` (застосування)

**Правила:**
- Нові: світло-зелений фон, fade-out
- Зростання ціни: жовтий
- Падіння ціни: оранжевий
- Тільки CSS класи (`ext-highlight-new`, `ext-highlight-price-up`), без inline styles
- Smooth transitions, без миготіння

**Acceptance:** нові зеленим, зміни цін кольором, плавне зникнення.

**Тест:** запустити 5 хв → нові підсвічуються плавно.

**Commit:** `feat(stage-11): visual highlighting`

---

### Stage 12 — Sound System 🔊

**Мета:** 20 звуків через Web Audio API, один звук на появу нових.

**Файли:** `content/ui/soundManager.js`

**Клас:**
```javascript
class SoundManager {
  constructor()           // AudioContext
  play(soundId)           // soundId 1-20
  setVolume(v)
  mute() / unmute()
  preview(soundId)        // для вибору в popup
}
```

20 тонів — різні частоти/патерни/тривалості, згенеровані осциляторами.

**Anti-spam:** один звук на появу нових (не по кожному вантажу); мінімум 500ms між звуками; warming-up flag перші 3 сек.

**Acceptance:** нові вантажі → один звук обраного тону; mute працює; preview в popup грає тон.

**Тест:** запустити → нові → чути один звук; змінити звук у popup → preview інший.

**Commit:** `feat(stage-12): 20-tone sound system`

---

### Stage 13 — Auto-open Details of Top New Load 🎯

**Мета:** Коли з'являються нові вантажі — підсвітити всі нові, один звук, і відкрити деталі найвищого нового вантажу одним кліком по neutral zone.

**Файли:** `content/logic/detailsOpener.js`

**Логіка:**
1. Diff дає нові вантажі (1 або більше)
2. Підсвітити ВСІ нові (Stage 11 вже робить)
3. Один звук (Stage 12)
4. Знайти найвищий за payout серед нових
5. Один клік по його neutral zone → відкриваються деталі

⚠️ **Це НЕ бронювання.** Neutral zone клік тільки відкриває деталі (right panel). Перевірити що клік НЕ потрапляє на forbidden елемент.

**Acceptance:** поява нових → всі підсвічені → один звук → деталі найвищого відкриті; жоден forbidden елемент не натиснутий.

**Тест:** дочекатись нових → бачиш підсвітку + чуєш звук + деталі топового відкрились.

**Commit:** `feat(stage-13): auto-open details of top new load`

---

### Stage 14 — PAT Helper (fill form, no Submit) 📋

**Мета:** Кнопка на кожному вантажі → шаблон → заповнення Post-a-Truck форми (Submit тисне користувач).

**Файли:**
- `content/logic/patHelper.js`
- `content/ui/patModal.js`
- `content/ui/patModal.css`

**Логіка:**
1. На кожен вантаж додається кнопка `btn-create-pat` (з `data-testid`)
2. Клік → модальне вікно з усіма параметрами вантажу (origin, destination, equipment, payout, час)
3. Питання: «Створити Post-a-Truck на основі цього вантажу?»
4. Підтвердження → відкрити PAT форму («Create Order») і заповнити поля даними
5. **Submit НЕ натискається** — користувач перевіряє і тисне сам

**PAT форма (з AMAZON_DOM_REFERENCE.md):** 4 секції — Order Type (radio), Location, Schedule, Payout. Submit кнопка — НЕ чіпати.

**Acceptance:** кнопка на кожному вантажі; модал показує параметри; підтвердження заповнює форму; Submit лишається користувачу.

**Тест:** клік на кнопку вантажу → модал → підтвердити → PAT форма заповнена → Submit не натиснутий.

**Commit:** `feat(stage-14): PAT helper fills form without submit`

---

### Stage 15 — Performance & Memory 🚀

**Мета:** Стабільна робота годинами.

**Перевірки:** немає незакритих таймерів; MutationObserver disconnect при stop; debouncing на парсингу; WeakMap для DOM↔дані.

**Acceptance:** за 1 годину пам'ять < 50MB зростання; CPU idle < 5%; long tasks < 50ms.

**Тест:** запустити 2 години, моніторити DevTools.

**Commit:** `perf(stage-15): memory and performance`

---

### Stage 16 — Error Handling 🛡️

**Мета:** Жодна помилка не вбиває розширення.

**Файли:** `utils/errorHandler.js`

**Що:** глобальний error handler; try/catch на DOM операціях; fallback (парсер впав → кеш); повідомлення в indicator-status.

**Acceptance:** помилки логуються з контекстом; розширення не падає; UI показує warning при системній помилці.

**Commit:** `feat(stage-16): error handling`

---

### Stage 17 — Booking Safety Audit 🔒

**Мета:** Підтвердити що розширення НЕ може забронювати вантаж.

**Аудит:**
1. `grep -r "\.click()" content/ background/` → тільки Refresh і neutral zone
2. `grep -r "rlb-book"` → тільки в FORBIDDEN_SELECTORS
3. Немає файлів clickAutomation.js / autoBooking.js
4. 30-хв live test без жодного бронювання
5. Звіт у `docs/SAFETY.md` з датою

**Acceptance:** аудит чистий; live test без бронювань; звіт записаний.

**Commit:** `chore(stage-17): booking safety audit`

---

### Stage 18 — Final Refactor & Build 🎁

**Мета:** Готова версія.

**Кроки:** прибрати debug-логи з production; видалити невикористаний код; іконки (16/32/48/128); README з інструкцією; перевірити manifest; зібрати .zip.

**Acceptance:** працює стабільно; .zip < 1MB; README з інструкцією; всі тести з TEST_CASES.md пройдені.

**Commit:** `chore(stage-18): production build`

---

## ШАБЛОНИ ДОКУМЕНТІВ (для Stage 0)

### `docs/SPEC.md`

```markdown
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
```

### `docs/SAFETY.md`

```markdown
# SAFETY RULES — Booking Protection

## Project Scope
This extension does NOT book loads. Ever. The only clicks it performs:
1. Amazon's internal Refresh button (refreshes list, books nothing)
2. A load's neutral zone (opens details, books nothing)

PAT forms are FILLED but the user presses Submit manually.

Auto-booking and "one-click booking" are OUT OF SCOPE — future separate
projects with their own specs and safety reviews.

## Defense in Depth

### Layer 1: Architectural
No module exists that clicks Book buttons. No clickAutomation.js,
no autoBooking.js. Only refreshManager (Refresh) and detailsOpener
(neutral zone) perform clicks.

### Layer 2: FORBIDDEN_SELECTORS guard
File: utils/constants.js
const FORBIDDEN_SELECTORS = [
  '#rlb-book-btn',
  '#rlb-book-trip-confirm-booking-btn'
];

function isForbiddenElement(el) {
  if (!el) return false;
  return FORBIDDEN_SELECTORS.some(s => el.matches(s) || el.closest(s));
}

Every .click() in the codebase calls isForbiddenElement() first.

### Layer 3: Booking confirmation detection
If [data-id="confirmation-expander"] ever becomes visible during
operation — anomaly. Log it, alert user, stop refresh loop.

## Allowed on Live Site
SAFE: parsing, diff, highlighting, sounds, Refresh click,
neutral-zone click, filling PAT form, storage.

NOT IN SCOPE: clicking Book, clicking Submit, any auto-acceptance.

## Audit Checklist (Stage 17)
- [ ] grep "\.click()" → only Refresh + neutral zone
- [ ] grep "rlb-book" → only in FORBIDDEN_SELECTORS
- [ ] no clickAutomation.js / autoBooking.js
- [ ] isForbiddenElement() called before every .click()
- [ ] 30-min live test, zero bookings
```

### `docs/UI_ELEMENTS.md`

```markdown
# UI Elements Registry

Every UI element MUST have a unique data-testid.
When reporting a bug, use the testid name.

## Sidebar (Stage 3-4)
| testid | Type | Function |
|--------|------|----------|
| btn-start | button | Start refresh loop |
| btn-stop | button | Stop refresh loop |
| slider-refresh-speed | range | Set refresh speed |
| label-speed-value | span | Show current speed |
| toggle-sound | checkbox | Enable/disable sound |
| toggle-debug | checkbox | Show debug overlay |
| indicator-status | span | Status text |
| counter-refresh | span | Refresh count |
| counter-new-loads | span | New loads count |

## Popup (Stage 9)
| testid | Type | Function |
|--------|------|----------|
| popup-slider-speed | range | Speed (synced) |
| popup-sound-select | select | Choose 1 of 20 sounds |
| popup-btn-preview | button | Preview selected sound |
| popup-toggle-sound | checkbox | Sound on/off |
| popup-btn-start | button | Start (synced) |

## PAT Modal (Stage 14)
| testid | Type | Function |
|--------|------|----------|
| btn-create-pat | button | On each load — open PAT modal |
| pat-modal | div | The template modal |
| pat-confirm | button | Confirm → fill form |
| pat-cancel | button | Cancel |
```

### `docs/AMAZON_SELECTORS.md`

```markdown
# Amazon Relay Selectors

Pull stable selectors from AMAZON_DOM_REFERENCE.md.
Update here if Amazon changes layout. Record verification date.

## Refresh button ⚠️ TODO — USER MUST FILL
Selector: [INSPECT MANUALLY before Stage 6]
The refresh button is bottom-right with "Next Refresh Xs" text.
Right-click it → Inspect → find aria-label or data attribute.
Verified: ___

## Load card (Layout A) ✅
Container: div.load-card
Load ID: div[id] inside (UUID)
Payout: .wo-total_payout
Price increase: .wo-total_payout__modified-load-increase-attr
Equipment: .equipment-type-text
Loading type: .loading-type

## Tour container (Layout B) ✅
Container: [data-type$="-tour-container"]
Load leg: [data-type$="-load-expander"]
Payout: [data-type="tour-payout-info"]
Distance: [data-type="tour-distance-string"]

## Booking (FORBIDDEN — never click) ⚠️
Book button: #rlb-book-btn
Confirm: #rlb-book-trip-confirm-booking-btn
Cancel: #rlb-book-trip-no-btn

## PAT form (Stage 14)
Container: .css-kkw3y5 (fragile — find by structure)
Create Order: find button by text "Create Order"
Submit: find button by text "Submit" (DO NOT CLICK — user does)

## Neutral zone (Stage 13)
The load card itself (div.load-card) — clicking opens details panel.
NOT the payout, NOT the chevron, NOT any button.
```

### `docs/GLOSSARY.md`

```markdown
# Glossary

| Term | Definition |
|------|------------|
| Load | Available cargo on Amazon Relay |
| Layout A | Search results view (div.load-card) |
| Layout B | Block/Tour view (data-type tour-container) |
| Tour | A tour contains multiple Loads (legs) |
| Refresh | Click Amazon's refresh button (NOT page reload) |
| Neutral zone | Empty area of a load row; click opens details |
| Diff | Difference between two snapshots |
| Snapshot | Captured state of all loads at a moment |
| PAT | Post-a-Truck — tell Amazon you have a truck for a route |
| FORBIDDEN_SELECTORS | Selectors the extension must NEVER click |
| Booking | Accepting a load — extension NEVER does this |
```

### `docs/CHANGELOG.md`

```markdown
# Changelog

## [Unreleased]

### Stage 0 — 2026-06-02
- Added: documentation foundation (docs/ + README)
```

### `docs/TEST_CASES.md`

```markdown
# Test Cases

## Stage 1
- [ ] Loads in chrome://extensions without errors
- [ ] Background logs on install
- [ ] Content logs on Amazon Relay

## Stage 2
- [ ] logger formats correctly
- [ ] debug hidden when DEBUG_LEVEL < 2
- [ ] FORBIDDEN_SELECTORS exported

## Stage 3
- [ ] Sidebar visible, top-center
- [ ] Amazon content not covered
- [ ] Stays fixed on scroll

(continue per stage)
```

### `docs/BUG_REPORT_TEMPLATE.md`

```markdown
# Bug Report Template

Copy this when reporting a bug to Claude Code. Fill every field.

---
Stage: [number + name]
Expected: [what should happen]
Actual: [what happened instead]

Console output:
```
[paste console logs here]
```

__EXT_DEBUG output (if relevant):
```
[paste result of window.__EXT_DEBUG.getLoads() or similar]
```

Screenshot: [attach if visual]

What I already tried: [optional]
---
```

### `docs/CLAUDE.md`

```markdown
# Rules for Claude Code

## Before ANY change
1. Read SPEC.md, SAFETY.md, UI_ELEMENTS.md
2. Read CHANGELOG.md for recent changes
3. If adding any .click() — STOP unless it's Refresh or neutral zone

## After ANY change
1. Update CHANGELOG.md (date, file, what, why)
2. New UI element → add to UI_ELEMENTS.md
3. New Amazon selector → add to AMAZON_SELECTORS.md
4. Bug fixed → add test to TEST_CASES.md

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
```

### `README.md` (root)

```markdown
# Amazon Relay Helper Extension

Chrome Extension for monitoring the Amazon Relay Load Board.

## Scope (MVP)
Monitors loads, highlights new ones, plays sounds, opens details,
helps create Post-a-Truck orders. Does NOT book loads — user books
manually.

## Status
In development. Currently: Stage 0.

## Documentation
- MVP_SPECIFICATION.md — this 18-stage plan
- VISUAL_CONTEXT.md — UI zones
- AMAZON_DOM_REFERENCE.md — DOM selectors
- docs/ — working documents

## Safety
Interacts with a live booking system but books nothing.
See docs/SAFETY.md.

## Installation
(after Stage 1)
```

---

## ПІДСУМОК ЗМІН ВІД ПОПЕРЕДНЬОЇ ВЕРСІЇ

| Що | Стало |
|----|-------|
| Сервер/WebSocket/backend | Винесено в майбутню Фазу 2 (не в MVP) |
| Cross-account показ | Майбутня Фаза 2 |
| AI-агент | Майбутня Фаза 3+ |
| Stage 12 Notifier | Розбито: Sound (12), Auto-open details (13) |
| Додано Popup menu | Stage 9 |
| Додано PAT helper | Stage 14 (fill form, no Submit) |
| Додано BUG_REPORT_TEMPLATE | для швидкого циклу баг→фікс |
| 20 звуків | Web Audio API, вибір у popup |
| Повзунок швидкості | замість текстового поля |

---

## НАСТУПНІ КРОКИ

1. Прочитай цю специфікацію
2. Поклади її в папку проєкту разом з VISUAL_CONTEXT.md і AMAZON_DOM_REFERENCE.md
3. Дай Claude Code промпт почати Stage 0
4. Не починай Stage 1 поки Stage 0 не завершено і не перевірено

---

## END OF MVP_SPECIFICATION.md
