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

---

## MutationObserver instant detection (2026-06-18)

### TC-OBS-1 — Radius (or any) filter change highlights new loads instantly
1. Set timer tick to 6s. Start loop (running = true).
2. Change the radius filter (or any filter param) in the filter panel.
3. **Expected:** new loads highlighted (`.ext-new-load`) within ~200ms — WITHOUT waiting for the 6s tick. Sound alert and tab flash fire if new loads found.
4. **Console confirms (attempt 3):** `DIAG callback: fired` entries appear during filter change, then `DIAG callback: external change while running — debouncing`, then `runObserverPipeline called` within 200ms — WITHOUT waiting for the next tick.

### TC-OBS-2 — Auto-open and auto-stop fire on observer-driven pass
1. Start loop with Auto-Open enabled.
2. Change filter so a new load appears.
3. **Expected:** top new load card opens (detail sheet + inline panel) AND loop stops (pill shows paused) — same behaviour as timer tick with new loads. Loop was stopped by `tabState.set('running', false)` in `runObserverPipeline`.

### TC-OBS-3 — No infinite observer loop from ext DOM mutations
1. Start loop. Let it find a new load and render the inline panel (highlight + badge + panel insertion).
2. **Expected:** no second pipeline pass fires as a result of the inline panel insertion or highlight class addition. Console shows "ext-managed change only — ignored" for the panel insert mutation.
3. Confirm: no duplicate sound, no double auto-open, no console error loop.

### TC-OBS-4 — Observer stops on pause; restarts on resume
1. Start loop, confirm observer is active (logs "observer active on first div.load-list").
2. Pause loop (click pause pill).
3. Change a filter. **Expected:** no pipeline pass fires (observer disconnected or running-gated).
4. Resume loop. **Expected:** observer reconnects; filter change again triggers detection.

### TC-OBS-5 — Observer stops on memory reload
1. Simulate memory reload: `sessionStorage.setItem('ext_resume_after_memory_reload','1'); location.reload()`.
2. **Expected after reload:** extension auto-resumes (observer + timer both start). No stale observer from before reload fires callbacks.

---

## Inline panel stop numbers (2026-06-18)

### TC-STOP-1 — Global stop numbers appear in stop-detail table
1. Start loop. Let auto-open fire on a multi-segment load (≥ 2 legs).
2. Expand one segment's stop-detail accordion.
3. **Expected:** each address row has a blue `.ext-stop-num` circle showing the global stop number.
   - Segment 0 rows: circles "1" and "2".
   - Segment 1 rows: circles "2" and "3" (2 is shared with segment 0's destination).
   - Segment 2 rows: circles "3" and "4" (3 is shared with segment 1's destination).
4. **Regression check (single-segment load):** circles "1" and "2" appear.

### TC-STOP-2 — Shared stop has identical number in both segments
1. Open a 3-segment load's inline panel.
2. Expand segment 0 and note the destination stop number (e.g., "XBN6 → 2").
3. Expand segment 1 and note the origin stop number.
4. **Expected:** both show the same number ("2"). Stop numbering is continuous, not per-segment restarted.

---

### TC-OBS-6 — Back-to-back observer + timer tick: no duplicate alert
1. Start loop with timer interval = 2s.
2. At t=0, a filter change triggers the observer; observer runs at t=200ms (debounce). Finds 0 new loads.
3. At t=2000ms, timer tick runs. Also finds 0 new loads.
4. **Expected:** only ONE detection pass' worth of behaviour — no duplicate sound, no double highlight. `detectNewLoads` idempotency confirmed.
