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

---

## Per-tab state isolation (2026-06-18)

Two relay.amazon.com tabs open simultaneously. All cases verified with both tabs visible.

### TC-TAB-1 — Pause in Tab A does not stop Tab B
1. Start loop in Tab A and Tab B.
2. Click pause in Tab A.
3. **Expected:** Tab A pill shows paused, scanline stops. Tab B pill stays running, scanline continues.

### TC-TAB-2 — Auto-stop after new load in Tab A does not stop Tab B
1. Start loop in both tabs.
2. A new load appears in Tab A — loop auto-stops in Tab A.
3. **Expected:** Tab A pill pauses. Tab B continues running unaffected.

### TC-TAB-3 — Different speeds run independently
1. Set Tab A slider to 1 s, Tab B slider to 5 s.
2. Watch refresh cadence in each tab.
3. **Expected:** Tab A refreshes ~1×/s, Tab B ~1×/5 s. Changing one slider does not change the other.
4. Reload Tab A (memory-reload simulation): after resume, Tab A speed is still 1 s.

### TC-TAB-4 — Surge thresholds are independent; history is per-tab
1. Set sidebar-surge-threshold to $50 in Tab A, $100 in Tab B.
2. Run `__EXT_DEBUG.simulateSurge()` in Tab A with amount=$60.
3. Start loop in Tab A; wait one tick.
4. **Expected:** Tab A surge triggers (60 >= 50). Tab B is unaffected.
5. Run `__EXT_DEBUG.simulateSurge()` in Tab B with amount=$80.
6. Start loop in Tab B; wait one tick.
7. **Expected:** Tab B does NOT trigger (80 < 100).
8. Open chrome://extensions DevTools → `chrome.storage.local.get('priceHistory')` should return `undefined` or `{}` (price history is no longer stored there).

### TC-TAB-5 — Memory-watchdog reload in Tab A auto-resumes; Tab B unaffected
1. Start both tabs.
2. Simulate reload in Tab A: run in Tab A console:
   ```javascript
   sessionStorage.setItem('ext_resume_after_memory_reload', '1');
   location.reload();
   ```
3. **Expected after reload:**
   - Tab A resumes loop automatically (pill shows running).
   - Tab A speed matches the value set before reload.
   - Tab A surge threshold matches the value set before reload.
   - Tab B is unchanged throughout.

### TC-TAB-6 — Global settings apply to both tabs
1. In popup: toggle Night Mode on.
2. **Expected:** both Tab A and Tab B switch to dark theme simultaneously.
3. Repeat for Tab Alert, sound volume, tag filters.
4. **Expected:** all global settings propagate to all tabs via chrome.storage.onChanged.

---

## Panel closer fixes (2026-06-18)

### TC-PANEL-1 — Filter panel closes on loop start (FIX 1)
1. On Amazon Relay, open the filter popover (click the Filter button — verify button has `aria-expanded="true"`).
2. Start the loop (click play in the sidebar).
3. **Expected:** filter popover closes immediately; button returns to `aria-expanded="false"`. Loop continues as normal.
4. **Regression check:** start loop when filter popover is NOT open — no error, loop starts normally.

### TC-PANEL-2 — Manual card open stops loop (FIX 2)
1. Start loop in the tab (pill shows running, scanline animates).
2. While loop is running, manually click any load card to open its detail panel.
3. **Expected:** `#selected-work-sheet` opens AND loop stops in this tab (pill shows paused, scanline stops).
4. **Regression check (extension auto-open):** let the loop find a new load and auto-open it — loop ALSO stops (via content.js existing logic), inline panel shows. No double-stop error in logs.
5. **Per-tab isolation:** open two tabs. Stop loop in Tab A via manual card click. Tab B should continue running unaffected.

### TC-PANEL-3 — Toggle-off card click does not double-stop
1. Start loop. Manually click a card (loop stops, panel appears — TC-PANEL-2 satisfied).
2. Click the same card again to close the inline panel (toggle-off path).
3. **Expected:** panel closes. Loop remains stopped (no redundant start/stop cycle).
4. No errors in console.
