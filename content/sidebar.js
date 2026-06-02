function buildSidebar() {
  logger.log('sidebar', 'buildSidebar called');

  if (document.querySelector('[data-testid="ext-sidebar"]')) {
    logger.warn('sidebar', 'sidebar already present, skipping');
    return;
  }

  // Static CSS only — no page data, safe per CLAUDE.md rule 10
  const style = document.createElement('style');
  style.setAttribute('data-testid', 'ext-sidebar-styles');
  style.textContent =
    '#ext-sidebar {' +
    '  position: fixed;' +
    '  top: 0;' +
    '  left: 50%;' +
    '  transform: translateX(-50%);' +
    '  z-index: 2147483647;' +
    '  background: #1a5c38;' +
    '  color: #ffffff;' +
    '  height: 40px;' +
    '  padding: 0 24px;' +
    '  display: flex;' +
    '  align-items: center;' +
    '  gap: 12px;' +
    '  border-radius: 0 0 8px 8px;' +
    '  box-shadow: 0 2px 8px rgba(0,0,0,0.35);' +
    '  font-family: Arial, sans-serif;' +
    '  font-size: 13px;' +
    '  font-weight: 600;' +
    '  letter-spacing: 0.3px;' +
    '  white-space: nowrap;' +
    '  user-select: none;' +
    '}' +
    'body {' +
    '  padding-top: 44px !important;' +
    '}';
  document.head.appendChild(style);

  // Container
  const container = document.createElement('div');
  container.id = 'ext-sidebar';
  container.setAttribute('data-testid', 'ext-sidebar');

  // Title — textContent only, never innerHTML
  const title = document.createElement('span');
  title.setAttribute('data-testid', 'ext-sidebar-title');
  title.textContent = EXT_NAME;

  container.appendChild(title);
  document.body.appendChild(container);

  logger.log('sidebar', 'sidebar injected');
}
