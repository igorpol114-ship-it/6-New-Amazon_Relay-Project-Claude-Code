// NO clicks, NO highlighting, NO sound, NO Layout B, NO booking.
// Snapshot/diff logic only. Not wired into refresh loop yet — debug only this stage.

var knownLoadIds = new Set();
var isFirstRun   = true;

function detectNewLoads(loads) {
  logger.log('loadDetector', 'detectNewLoads called', { allCount: loads.length });

  // Only consider loads that have a real loadId — skip null/undefined
  var validLoads = loads.filter(function (load) {
    return load.loadId !== null && load.loadId !== undefined;
  });

  var allCount = validLoads.length;

  if (isFirstRun) {
    // First call: seed the known set from whatever is on the page right now.
    // Return zero new loads — we don't want a flood of alerts on initial page load.
    validLoads.forEach(function (load) {
      knownLoadIds.add(load.loadId);
    });
    isFirstRun = false;
    logger.log('loadDetector', 'first run — seeded knownLoadIds, reporting 0 new', {
      allCount:    allCount,
      seededCount: knownLoadIds.size
    });
    return { newLoads: [], allCount: allCount, newCount: 0 };
  }

  // Subsequent calls: anything not in knownLoadIds is a new load
  var newLoads = validLoads.filter(function (load) {
    return !knownLoadIds.has(load.loadId);
  });

  // Absorb all current ids so they aren't "new" on the next call
  validLoads.forEach(function (load) {
    knownLoadIds.add(load.loadId);
  });

  var newCount = newLoads.length;

  logger.log('loadDetector', 'detectNewLoads done', {
    allCount:   allCount,
    newCount:   newCount,
    knownTotal: knownLoadIds.size
  });

  return { newLoads: newLoads, allCount: allCount, newCount: newCount };
}

function resetKnownLoads() {
  logger.log('loadDetector', 'resetKnownLoads called');
  knownLoadIds.clear();
  isFirstRun = true;
  logger.log('loadDetector', 'knownLoadIds cleared, isFirstRun reset to true');
}

// Expose for manual console testing only — NOT called automatically.
// Usage: __EXT_DEBUG.detectNewLoads()  — runs a fresh parse + diff each time.
//        __EXT_DEBUG.resetKnownLoads() — wipes state so next call is treated as first run.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.detectNewLoads  = function () { return detectNewLoads(parseLoads()); };
window.__EXT_DEBUG.resetKnownLoads = resetKnownLoads;
