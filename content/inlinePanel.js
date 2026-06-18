// Read-only module — reads Amazon's native #selected-work-sheet and renders
// our own collapsible segmented summary panel injected below the clicked load card.
// NO clicks on Amazon elements, NO booking, NO hiding or modifying the native sheet.

var PANEL_ID        = 'ext-inline-panel';
var SHEET_SELECTOR  = '#selected-work-sheet';
var currentPanelCard = null; // tracks which card the currently visible panel belongs to

function injectPanelStyle() {
  if (document.getElementById('ext-inline-panel-style')) return;
  var style = document.createElement('style');
  style.id = 'ext-inline-panel-style';
  style.textContent =
    '.ext-inline-panel{' +
      'border:1px solid #d5d9d9;border-radius:4px;margin:0 0 12px 0;' +
      'font-family:Arial,sans-serif;font-size:13px;background:#fff;overflow:hidden;' +
    '}' +
    '.ext-inline-panel__header{' +
      'background:rgb(182,227,255);color:#042C53;padding:8px 14px;' +
      'display:flex;gap:14px;align-items:center;font-size:12px;' +
    '}' +
    '.ext-inline-panel__header .ext-payout{' +
      'margin-left:auto;font-weight:bold;' +
    '}' +
    '.ext-seg-header{' +
      'background:#f0f2f2;border-top:1px solid #e7e7e7;padding:10px 14px;' +
      'display:grid;grid-template-columns:40px minmax(0,3fr) 1.4fr 1fr 1fr 32px;' +
      'gap:0;align-items:center;' +
      'font-size:12px;color:#565959;cursor:pointer;user-select:none;' +
    '}' +
    '.ext-seg-header > span{padding:0 8px;}' +
    '.ext-seg-route{min-width:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;}' +
    '.ext-route-origin{' +
      'font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;' +
      'overflow-wrap:break-word;word-break:break-word;min-width:0;text-align:center;' +
    '}' +
    '.ext-route-dest{' +
      'font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;' +
      'overflow-wrap:break-word;word-break:break-word;min-width:0;text-align:center;' +
    '}' +
    '.ext-route-arrow{font-size:1.15em;font-weight:700;color:#1a5c38;margin:0 0.35em;}' +
    '.ext-seg-dist{color:#878787;font-size:11px;text-align:center;}' +
    '.ext-seg-action{text-align:center;font-size:11px;color:#565959;}' +
    '.ext-seg-status{text-align:center;font-size:11px;}' +
    '.ext-seg-loaded{color:#1a5c38;font-weight:500;}' +
    '.ext-seg-empty{color:#878787;}' +
    '.ext-seg-header .ext-seg-title{display:flex;align-items:center;justify-content:center;padding:0;}' +
    '.ext-seg-header .ext-seg-arrow{transition:transform .15s;text-align:center;padding:0 4px;}' +
    '.ext-seg-header.ext-open .ext-seg-arrow{transform:rotate(180deg);}' +
    '.ext-seg-body{display:none;}' +
    '.ext-seg-body.ext-open{display:block;}' +
    '.ext-inline-panel__table{width:100%;border-collapse:collapse;table-layout:fixed;}' +
    '.ext-inline-panel__table th:nth-child(1),.ext-inline-panel__table td:nth-child(1){width:40%;}' +
    '.ext-inline-panel__table th:nth-child(2),.ext-inline-panel__table td:nth-child(2){width:20%;}' +
    '.ext-inline-panel__table th:nth-child(3),.ext-inline-panel__table td:nth-child(3){width:20%;}' +
    '.ext-inline-panel__table th:nth-child(4),.ext-inline-panel__table td:nth-child(4){width:20%;}' +
    '.ext-inline-panel__table th{' +
      'text-align:left;font-size:11px;color:#565959;font-weight:bold;' +
      'padding:8px 14px;border-bottom:1px solid #e7e7e7;' +
    '}' +
    '.ext-inline-panel__table td{' +
      'padding:10px 14px;border-bottom:1px solid #f0f0f0;vertical-align:top;word-break:break-word;' +
    '}' +
    '.ext-stop-num{' +
      'display:inline-flex;width:18px;height:18px;border-radius:50%;' +
      'background:#185FA5;color:#fff;font-size:11px;' +
      'align-items:center;justify-content:center;margin-right:8px;' +
    '}' +
    '.ext-seg-title .ext-stop-num{margin-right:0;}' +
    '.ext-stop-addr{color:#565959;font-size:12px;}' +
    '.ext-dot-loaded{' +
      'display:inline-block;width:11px;height:11px;border-radius:50%;' +
      'background:#000;margin-right:6px;vertical-align:middle;' +
    '}' +
    '.ext-dot-empty{' +
      'display:inline-block;width:11px;height:11px;border-radius:50%;' +
      'border:1.5px solid #000;margin-right:6px;vertical-align:middle;' +
    '}';
  document.head.appendChild(style);
}

// Polls until Amazon's native sheet has rendered segments, then calls callback.
// Fires as soon as ready; falls back after 1500ms regardless.
function waitForSheet(callback) {
  var POLL_MS  = 50;
  var MAX_MS   = 1500;
  var elapsed  = 0;
  var interval = setInterval(function () {
    elapsed += POLL_MS;
    var sheet = document.querySelector(SHEET_SELECTOR);
    var ready = sheet && sheet.querySelector('.load-expander');
    if (ready || elapsed >= MAX_MS) {
      clearInterval(interval);
      callback();
    }
  }, POLL_MS);
}

function parseStopBlock(block) {
  var addrContainer = block.querySelector('.css-w1kk5u');
  var name          = '';
  var addressLines  = [];

  if (addrContainer) {
    var paras = addrContainer.querySelectorAll('p');
    paras.forEach(function (p) {
      var bold = p.querySelector('b');
      if (bold) {
        name = bold.textContent.trim();
      }
      var text = p.textContent.trim();
      if (text) addressLines.push(text);
    });
    addressLines = addressLines.filter(function (line) { return line !== name; });
  }

  var address = addressLines.join(', ');

  var arrivalEl   = block.querySelector('.scheduled-arrival__time .scheduled-time');
  var departureEl = block.querySelector('.scheduled-departure__time .scheduled-time');
  var arrival     = arrivalEl   ? arrivalEl.textContent.trim()   : '';
  var departure   = departureEl ? departureEl.textContent.trim() : '';

  // Equipment text + load type — both extracted from the same .css-1cbogyo block
  // that contains "Trailer". Normalized text looks like: "Equipment/ID 53' Trailer Drop"
  var equipmentText = '';
  var loadType      = '';
  var equipEls      = block.querySelectorAll('.css-1cbogyo');
  equipEls.forEach(function (eq) {
    if (eq.textContent.indexOf('Trailer') !== -1) {
      var normalized   = eq.textContent.replace(/\s+/g, ' ').trim();
      var trailerMatch = normalized.match(/\d+'\s*Trailer/);
      equipmentText    = trailerMatch ? trailerMatch[0].trim() : '';
      var statusMatch  = normalized.match(/Trailer\s+(Live|Drop|Preloaded)/i);
      if (statusMatch) {
        var raw = statusMatch[1].toLowerCase();
        if      (raw === 'live')      loadType = 'Live';
        else if (raw === 'drop')      loadType = 'Drop';
        else if (raw === 'preloaded') loadType = 'Preloaded';
      }
    }
  });

  // Loaded flag — first matching circle icon only; classList.contains avoids substring match
  var loaded   = false;
  var dotIcons = block.querySelectorAll('i.fa-circle, i.fa-circle-o');
  for (var d = 0; d < dotIcons.length; d++) {
    var icon = dotIcons[d];
    if (icon.classList.contains('fa-circle-o')) {
      loaded = false;
    } else if (icon.classList.contains('fa-circle')) {
      loaded = true;
    }
    break;
  }

  return {
    num:           '',
    name:          name,
    address:       address,
    equipmentText: equipmentText,
    loadType:      loadType,
    loaded:        loaded,
    arrival:       arrival,
    departure:     departure
  };
}

function readSheetData() {
  try {
    var sheet = document.querySelector(SHEET_SELECTOR);
    if (!sheet) {
      logger.warn('inlinePanel', 'readSheetData: sheet not found', { selector: SHEET_SELECTOR });
      return null;
    }

    // Header summary — stopsCount + totalMiles
    var stopsCount    = '';
    var totalMiles    = '';
    var headerSummary = sheet.querySelector('.css-ntd8uw .css-1q48g4q');
    if (headerSummary) {
      var summaryPs = headerSummary.querySelectorAll('p');
      if (summaryPs[0]) stopsCount = summaryPs[0].textContent.trim();
      if (summaryPs[1]) totalMiles = summaryPs[1].textContent.trim();
    }

    // Payout
    var payoutEl = sheet.querySelector('.css-6hcxnp');
    var payout   = payoutEl ? payoutEl.textContent.trim() : null;

    // Segments — one per .load-expander
    var loadExpanders = sheet.querySelectorAll('.load-expander');
    var segments      = [];

    loadExpanders.forEach(function (expander) {
      // Segment header (id="#expanded-header" is reused; query within this expander)
      var segHeaderEl = expander.querySelector('#expanded-header');
      var fromName    = '';
      var toName      = '';
      var miles       = '';

      if (segHeaderEl) {
        var stopLabels = segHeaderEl.querySelectorAll('.css-17jtd1r');
        if (stopLabels[0]) {
          var fn = stopLabels[0].querySelector('.css-424exj');
          fromName = fn ? fn.textContent.trim() : '';
        }
        if (stopLabels[1]) {
          var tn = stopLabels[1].querySelector('.css-424exj');
          toName = tn ? tn.textContent.trim() : '';
        }
        var milesEl = segHeaderEl.querySelector('.css-14f9df9');
        miles = milesEl ? milesEl.textContent.trim() : '';
      }

      var fromTo = fromName + ' → ' + toName;

      // Duration — extract token after first bullet if present
      var duration   = '';
      var durationEl = expander.querySelector('.css-gudqq2 .css-1cp4is8');
      if (durationEl) {
        var dText  = durationEl.textContent;
        var bullet = dText.indexOf('•');
        if (bullet !== -1) {
          duration = dText.slice(bullet + 1).trim().split('•')[0].trim();
        }
      }

      // Stops from expander-content
      var content = expander.querySelector('.expander-content');
      var stops   = [];
      if (content) {
        var stopBlocks = content.querySelectorAll('.css-zgauvq');
        stopBlocks.forEach(function (block) {
          var stop = parseStopBlock(block);
          if (!stop.address && !stop.arrival) return;
          stops.push(stop);
        });
      }

      // De-duplicate stops within this segment by arrival+departure time.
      // Fresh seen object per segment — no cross-segment dedup.
      var seen         = {};
      var dedupedStops = [];
      for (var s = 0; s < stops.length; s++) {
        var stop    = stops[s];
        var timeKey = stop.arrival + '|' + stop.departure;
        if (stop.arrival && stop.departure) {
          if (seen[timeKey]) continue;
          seen[timeKey] = true;
        }
        dedupedStops.push(stop);
      }

      // segment.loaded = true if ANY stop in dedupedStops is loaded
      var segLoaded = false;
      for (var k = 0; k < dedupedStops.length; k++) {
        if (dedupedStops[k].loaded) { segLoaded = true; break; }
      }

      // segment.loadType = loadType of the LAST stop (delivery reflects what happens at destination)
      var segLoadType = '';
      if (dedupedStops.length > 0) {
        segLoadType = dedupedStops[dedupedStops.length - 1].loadType || '';
      }

      segments.push({
        idLabel:  '',
        fromTo:   fromTo,
        miles:    miles,
        duration: duration,
        loadType: segLoadType,
        loaded:   segLoaded,
        price:    '',
        stops:    dedupedStops
      });
    });

    // Assign global stop numbers.
    // A multi-stop route is one continuous sequence: stop 1, 2, 3, … N+1.
    // Adjacent segments share a boundary stop: segment N covers global stops (N+1) and (N+2).
    // Stop at position k within segment N → global number N+1+k.
    // Example (3 segments / 4 stops):
    //   seg 0: stops[0].num="1"  stops[1].num="2"
    //   seg 1: stops[0].num="2"  stops[1].num="3"   ← 2 shared with seg 0 end
    //   seg 2: stops[0].num="3"  stops[1].num="4"   ← 3 shared with seg 1 end
    for (var n = 0; n < segments.length; n++) {
      var segStops = segments[n].stops;
      var baseNum  = n + 1;
      for (var sn = 0; sn < segStops.length; sn++) {
        segStops[sn].num = String(baseNum + sn);
      }
    }

    // Route = first segment from-name → last segment to-name
    var route = '';
    if (segments.length > 0) {
      var firstParts = segments[0].fromTo.split(' → ');
      var lastParts  = segments[segments.length - 1].fromTo.split(' → ');
      route = (firstParts[0] || '') + ' → ' + (lastParts[lastParts.length - 1] || '');
    }

    return {
      header: {
        route:      route,
        stopsCount: stopsCount,
        totalMiles: totalMiles,
        payout:     payout
      },
      segments: segments
    };

  } catch (e) {
    logger.error('inlinePanel', 'readSheetData failed', { error: e });
    return null;
  }
}

// Builds the stops <table> for a segment — shared by both single and multi rendering.
function buildSegmentTable(segment) {
  var table = document.createElement('table');
  table.className = 'ext-inline-panel__table';

  var thead   = document.createElement('thead');
  var headRow = document.createElement('tr');
  ['Stop', 'Equipment / Id', 'Arrival', 'Departure'].forEach(function (label) {
    var th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');

  segment.stops.forEach(function (stop) {
    var tr = document.createElement('tr');

    // td1 — optional stop-num + name + address
    var td1 = document.createElement('td');
    if (stop.num) {
      var numSpan = document.createElement('span');
      numSpan.className = 'ext-stop-num';
      numSpan.textContent = String(stop.num);
      td1.appendChild(numSpan);
    }
    var nameEl = document.createElement('b');
    nameEl.textContent = stop.name;
    var addrDiv = document.createElement('div');
    addrDiv.className = 'ext-stop-addr';
    addrDiv.textContent = stop.address;
    td1.appendChild(nameEl);
    td1.appendChild(addrDiv);

    // td2 — loaded dot + equipment text
    var td2 = document.createElement('td');
    var dot = document.createElement('span');
    dot.className = stop.loaded ? 'ext-dot-loaded' : 'ext-dot-empty';
    td2.appendChild(dot);
    td2.appendChild(document.createTextNode(stop.equipmentText));

    // td3 — arrival
    var td3 = document.createElement('td');
    td3.textContent = stop.arrival;

    // td4 — departure
    var td4 = document.createElement('td');
    td4.textContent = stop.departure;

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function buildPanelElement(data) {
  var panel = document.createElement('div');
  panel.className = 'ext-inline-panel';

  var multi = data.segments.length > 1;

  data.segments.forEach(function (segment, i) {
    if (multi) {
      // Two or more segments — collapsible grey header, body collapsed by default
      var segHeader = document.createElement('div');
      segHeader.className = 'ext-seg-header';

      var titleSpan = document.createElement('span');
      titleSpan.className = 'ext-seg-title';
      var originNum   = segment.stops.length > 0 ? segment.stops[0].num : String(i + 1);
      var originNumEl = document.createElement('span');
      originNumEl.className  = 'ext-stop-num';
      originNumEl.textContent = originNum;
      titleSpan.appendChild(originNumEl);

      // Route column — origin, bold accent arrow, destination as separate nodes.
      // Never uses innerHTML; each part set via textContent.
      var fromToSpan = document.createElement('span');
      fromToSpan.className = 'ext-seg-route';

      var routeParts = segment.fromTo.split(' → ');
      var originText = routeParts[0] || '';
      var destText   = routeParts.length > 1 ? routeParts.slice(1).join(' → ') : '';

      var originEl = document.createElement('span');
      originEl.className  = 'ext-route-origin';
      originEl.textContent = originText;

      var routeArrowEl = document.createElement('span');
      routeArrowEl.className  = 'ext-route-arrow';
      routeArrowEl.textContent = '→';

      var destEl = document.createElement('span');
      destEl.className  = 'ext-route-dest';
      // Show destination global stop# as a circle matching the header circles.
      var destNum   = segment.stops.length > 1
        ? segment.stops[segment.stops.length - 1].num
        : String(i + 2);
      var destNumEl = document.createElement('span');
      destNumEl.className  = 'ext-stop-num';
      destNumEl.textContent = destNum;
      destEl.appendChild(destNumEl);
      destEl.appendChild(document.createTextNode(destText));

      fromToSpan.appendChild(originEl);
      fromToSpan.appendChild(routeArrowEl);
      fromToSpan.appendChild(destEl);

      // Distance · duration — muted secondary
      var milesSpan = document.createElement('span');
      milesSpan.className = 'ext-seg-dist';
      milesSpan.textContent = segment.duration
        ? segment.miles + ' · ' + segment.duration
        : segment.miles;

      // Action text (Drop/Live/Preloaded) — plain text; always emit span for grid
      var loadTypeSpan = document.createElement('span');
      loadTypeSpan.className = 'ext-seg-action';
      loadTypeSpan.textContent = segment.loadType || '';

      // Status text — plain text with subtle color; no pill/chip
      var loadedSpan = document.createElement('span');
      loadedSpan.className = 'ext-seg-status ' + (segment.loaded ? 'ext-seg-loaded' : 'ext-seg-empty');
      loadedSpan.textContent = segment.loaded ? 'Loaded' : 'Empty';

      var arrowSpan = document.createElement('span');
      arrowSpan.className  = 'ext-seg-arrow';
      arrowSpan.textContent = '⌄';

      segHeader.appendChild(titleSpan);
      segHeader.appendChild(fromToSpan);
      segHeader.appendChild(milesSpan);
      segHeader.appendChild(loadTypeSpan);
      segHeader.appendChild(loadedSpan);
      segHeader.appendChild(arrowSpan);

      var segBody = document.createElement('div');
      segBody.className = 'ext-seg-body'; // no ext-open — collapsed by default
      segBody.appendChild(buildSegmentTable(segment));

      // Toggle collapse — closure captures this header + body pair
      (function (hdr, body) {
        hdr.addEventListener('click', function () {
          hdr.classList.toggle('ext-open');
          body.classList.toggle('ext-open');
        });
      }(segHeader, segBody));

      panel.appendChild(segHeader);
      panel.appendChild(segBody);

    } else {
      // Single segment — table always visible, no accordion wrapper
      var wrapper = document.createElement('div');
      wrapper.appendChild(buildSegmentTable(segment));
      panel.appendChild(wrapper);
    }
  });

  return panel;
}

function showInlinePanel(cardElement) {
  logger.log('inlinePanel', 'showInlinePanel called');

  injectPanelStyle();

  var old = document.getElementById(PANEL_ID);
  if (old) old.remove();

  var data = readSheetData();
  if (!data || !data.segments || data.segments.length === 0) {
    logger.warn('inlinePanel', 'no sheet data to render');
    return false;
  }

  var panel = buildPanelElement(data);
  panel.id  = PANEL_ID;

  cardElement.parentNode.insertBefore(panel, cardElement.nextSibling);

  logger.log('inlinePanel', 'panel rendered', { segments: data.segments.length });
  return true;
}

function removeInlinePanel() {
  var old = document.getElementById(PANEL_ID);
  if (old) old.remove();
}

function initManualToggle() {
  if (window.__extManualToggleInit) return;
  window.__extManualToggleInit = true;

  document.addEventListener('click', function (ev) {
    var card = ev.target.closest('div.load-card, div.load-card__selected');
    if (!card) return;

    // SAFETY: never react to clicks on forbidden elements (Book buttons etc.)
    if (isForbiddenElement(ev.target)) return;

    // Toggle off: clicking the same card while its panel is open removes it
    if (currentPanelCard === card && document.getElementById(PANEL_ID)) {
      removeInlinePanel();
      currentPanelCard = null;
      return;
    }

    // Toggle on: wait for Amazon's native sheet to render segments, then show our panel.
    // Also stop auto-refresh so the dispatcher can review the card without interruption.
    waitForSheet(function () {
      try {
        tabState.set('running', false);
        logger.log('inlinePanel', 'manual card open — stopping loop for dispatcher review');
      } catch (e) {
        logger.error('inlinePanel', 'tabState stop failed on manual card open', { error: e });
      }
      try {
        var ok = showInlinePanel(card);
        if (ok) { currentPanelCard = card; }
      } catch (e) {
        logger.warn('inlinePanel', 'manual toggle render failed', { error: e });
      }
    });
  });

  logger.log('inlinePanel', 'manual toggle initialized');
}

// Expose for manual console testing only — NOT called automatically.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.showPanel        = function () {
  var c = document.querySelector('div.load-card__selected, div.load-card');
  return showInlinePanel(c);
};
window.__EXT_DEBUG.removePanel      = removeInlinePanel;
window.__EXT_DEBUG.initManualToggle = initManualToggle;
