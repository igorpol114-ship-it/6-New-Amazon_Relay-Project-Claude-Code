// Stage 6: findRefreshButton() + refreshDryRun() — NO .click()
// Stage 7: refreshNow() — one of the three allowed Amazon-DOM click sites (Refresh button);
//          see docs/SAFETY.md (canonical). Guarded by isForbiddenElement() + tagName check.

const REFRESH_PATH_D = 'M20.128 2l-.493 5.635L14 7.142M19.44 6.935a9 9 0 101.023 8.134';

function findRefreshButton() {
  logger.log('refreshManager', 'findRefreshButton called');

  // Strategy 1: find <p> containing "Next Refresh", then button in its parentElement.
  // Anchor: Amazon's own countdown text — stable across CSS rebuilds.
  try {
    const allP = document.querySelectorAll('p');
    for (const p of allP) {
      if (p.textContent && p.textContent.includes('Next Refresh')) {
        const parent = p.parentElement;
        const btn = parent && parent.querySelector('button');
        if (btn) {
          logger.log('refreshManager', 'findRefreshButton: found via "Next Refresh" text (strategy 1)', {
            parentTag: parent.tagName,
            outerHTMLLength: btn.outerHTML.length
          });
          return btn;
        }
      }
    }
  } catch (e) {
    logger.error('refreshManager', 'findRefreshButton: strategy 1 threw', { error: e });
  }

  // Strategy 2: find <path> matching refresh icon SVG geometry, then .closest('button').
  // Anchor: SVG path d-attribute geometry — does not change with CSS rebuilds.
  try {
    const paths = document.querySelectorAll('path');
    for (const path of paths) {
      const d = (path.getAttribute('d') || '').trim();
      if (d === REFRESH_PATH_D || d.startsWith('M20.128 2l-.493 5.635')) {
        const btn = path.closest('button');
        if (btn) {
          logger.log('refreshManager', 'findRefreshButton: found via SVG path geometry (strategy 2)', {
            outerHTMLLength: btn.outerHTML.length
          });
          return btn;
        }
      }
    }
  } catch (e) {
    logger.error('refreshManager', 'findRefreshButton: strategy 2 threw', { error: e });
  }

  logger.error('refreshManager', 'findRefreshButton: button not found by any strategy');
  return null;
}

function refreshDryRun() {
  logger.log('refreshManager', 'refreshDryRun called');

  const button = findRefreshButton();

  if (!button) {
    logger.warn('refreshManager', 'refresh button not found');
    return;
  }

  const forbidden = isForbiddenElement(button);

  logger.log('refreshManager', 'DRY RUN — would click refresh', {
    found: true,
    tag: button.tagName,
    outerHTMLLength: button.outerHTML.length,
    isForbidden: forbidden
  });

  if (forbidden) {
    logger.error('refreshManager', 'SAFETY CHECK FAILED: refresh button matched a FORBIDDEN selector!');
  } else {
    logger.log('refreshManager', 'Safety check passed — isForbiddenElement returned false (correct)');
  }

  // NO .click() here — dry run only.
}

function refreshNow() {
  logger.log('refreshManager', 'refreshNow called');

  const button = findRefreshButton();

  if (!button) {
    logger.warn('refreshManager', 'refreshNow: button not found, NOT clicking');
    return false;
  }

  // MANDATORY SAFETY GATE — Layer 2 guard (see SAFETY.md)
  if (isForbiddenElement(button)) {
    logger.error('refreshManager', 'BLOCKED: refresh target matched FORBIDDEN selector — NOT clicking', {});
    return false;
  }

  // Belt-and-suspenders: confirm we have an actual button element
  if (button.tagName !== 'BUTTON') {
    logger.error('refreshManager', 'BLOCKED: refresh target is not a BUTTON element — NOT clicking', {
      actualTag: button.tagName
    });
    return false;
  }

  // All checks passed — one of the three allowed Amazon-DOM click sites — see docs/SAFETY.md (canonical).
  logger.log('refreshManager', 'SAFETY PASSED — clicking refresh button now', { tag: button.tagName });
  button.click();
  logger.log('refreshManager', 'refresh button clicked');
  return true;
}

// Expose for manual console testing only — NOT called automatically.
// content.js does NOT call refreshNow(). No setInterval anywhere in this file.
window.__EXT_DEBUG = window.__EXT_DEBUG || {};
window.__EXT_DEBUG.findRefreshButton = findRefreshButton;
window.__EXT_DEBUG.refreshDryRun = refreshDryRun;
window.__EXT_DEBUG.refreshNow = refreshNow;
