// Popup verstka stage — controls are NOT wired yet.
// Functional logic (Night Mode, Tab Alert, Sound volume/selector, Price Surge,
// Hide filters, Reset) will be added one control at a time in Step 3.
//
// Popup runs in its own isolated context. It never clicks page elements,
// never parses loads, and never triggers a refresh.
//
// Intentionally inert for now. No DOMContentLoaded handler, no storage access.
