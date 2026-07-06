Deliverable 1 — Token changes
Accent chosen: Google-blue family — --ext-accent #1a73e8 (light) / #4c8dff (dark). Rationale: blue is the universal "interactive/system" signal in Workspace, Stripe, and One UI; it sits far from the semantic trio (green/amber/red) so it never competes with data meaning, and it reads as chrome-neutral rather than branded. Green is demoted to semantic success only (Loaded status, memory-ok dot).

Renamed/added (light → dark):

--ext-accent #1a73e8 → #4c8dff · --ext-accent-hover #1765d0 → #6ba1ff
--ext-accent-bg (tint) #e8f0fe → #172236 · --ext-accent-text (AA on tint/white) #155ab5 → #7aa9ff
--ext-focus = accent · --ext-bar-bg #ffffff → #1c1f24 (was solid green)
--ext-brand-* removed from chrome. Success stays #157347/#37b06f.
Usage rules (frozen): accent → toggle-on, slider fill, focus ring, scanline, new-load indicator, stop-number tint. Semantic → memory dot, Loaded/Empty, surge badge. Everything else neutral. Stop-number circle resolved to accent-tinted (accent-bg fill + accent-text, AA 5.5:1) over saturated-fill — quieter, and ties the stop sequence to the accent language without a loud dot.



Before → After checklist (for Claude Code)
Sidebar bar: solid green → neutral surface (light #fff / dark #1c1f24) + n200 hairline + shadow-2.
Sidebar title: gold/warm on green → n900, weight 600 on neutral.
Play/pause pill: translucent-on-green → neutral n100 fill, n200 border, n700 icon; hover n200.
Speed slider fill + scanline: green --ext-brand-scan → --ext-accent (blue); slider thumb gains n300 border for light-bar contrast.
All toggles ON: green → --ext-accent; proportions bumped to 40×24, 20px knob (filters 32×18/14px); OFF track stays neutral tog-bg.
Popup title: green → n900; section labels green → n500 uppercase 2xs; vertical rhythm opened to 16–18px.
Sound volume fill: green → --ext-accent.
Stop-number circles: saturated blue fill + white text → accent-tinted (accent-bg fill + accent-text), AA 5.5:1.
New-load highlight + NEW chip: green tint/border/chip → accent-bg tint, accent left-rule, accent chip.
Route arrow: bold green → neutral n400. Green now survives only as --ext-success (Loaded text, loaded dot, memory-ok dot); surge badge remains the one loud element.
Kept intact: full token architecture, spacing/radii/motion scales, shadow system, ext-scoped reduced-motion, JS-driven --ext-scan-dur (0.5–4s), AA -text/-icon split, frozen DOM/testids, no Amazon styling beyond the two sanctioned cases.