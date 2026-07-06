// Design token injection — listed FIRST in manifest.json content_scripts so all
// --ext-* custom properties are on :root before any other extension script runs.
// Dark overrides activate when nightMode.js sets html.ext-night on the page.
// Popup page duplicates this token block at the top of popup/popup.css.
(function () {
  if (document.getElementById('ext-design-tokens')) return;
  var style = document.createElement('style');
  style.id = 'ext-design-tokens';
  style.textContent =
    ':root{' +
      /* accent — blue, interactive/system signal */
      '--ext-accent:#1a73e8;' +
      '--ext-accent-hover:#1765d0;' +
      '--ext-accent-bg:#e8f0fe;' +
      '--ext-accent-text:#155ab5;' +
      /* semantic — success / warning / danger kept separate from accent */
      '--ext-success:#157347;' +
      '--ext-success-bg:#e6f4ee;' +
      /* surface & bar */
      '--ext-bar-bg:#ffffff;' +
      '--ext-surface:#ffffff;' +
      /* neutral scale */
      '--ext-n100:#f5f7fa;' +
      '--ext-n200:#e2e6ea;' +
      '--ext-n300:#c8d0d8;' +
      '--ext-n400:#8fa1b2;' +
      '--ext-n500:#607080;' +
      '--ext-n700:#364455;' +
      '--ext-n900:#0e1c2b;' +
      /* shadows */
      '--ext-shadow-1:0 1px 3px rgba(0,0,0,.08);' +
      '--ext-shadow-2:0 2px 8px rgba(0,0,0,.14);' +
      /* motion — JS overrides this on the sidebar container via applyScanSpeed() */
      '--ext-scan-dur:2.8s;' +
      /* radii */
      '--ext-radius-pill:20px;' +
      '--ext-radius-card:8px;' +
      '--ext-radius-sm:4px;' +
    '}' +
    'html.ext-night{' +
      '--ext-accent:#4c8dff;' +
      '--ext-accent-hover:#6ba1ff;' +
      '--ext-accent-bg:#172236;' +
      '--ext-accent-text:#7aa9ff;' +
      '--ext-success:#37b06f;' +
      '--ext-success-bg:#0e2a1a;' +
      '--ext-bar-bg:#1c1f24;' +
      '--ext-surface:#23272d;' +
      '--ext-n100:#23272d;' +
      '--ext-n200:#2c313a;' +
      '--ext-n300:#3a4250;' +
      '--ext-n400:#586070;' +
      '--ext-n500:#7a8c9c;' +
      '--ext-n700:#b0bcca;' +
      '--ext-n900:#e5edf5;' +
      '--ext-shadow-2:0 2px 8px rgba(0,0,0,.4);' +
    '}';
  document.head.appendChild(style);
}());
