# ShiftARC visual system

The application uses three palettes (amber/Kehribar, ion/İyon, grove/Koruluk),
each with LIGHT and DARK modes. Appearance is persisted on workspace settings.
New workspaces use amber, LIGHT, STATIC and DIGITAL.

## Foundations

Onest is the interface face, Manrope is used for headings and JetBrains Mono
for time. Font binaries and OFL licenses are served locally from public/fonts.
Body copy is 14–16px and secondary text is at least 12px. Spacing follows a 4px
grid, controls use 8px corners, panels 12px. Theme and semantic status colors
come from index.css; category colors remain user data.

Desktop navigation is grouped into daily work, planning, history and settings.
Mobile navigation has Today, Tasks, Calendar and an accessible additional-pages
dialog. Existing routes, domain forms and API query layers are retained.

## Adaptive daily timeline

The complete 00:00–24:00 snapshot remains visible on desktop. A six-hour window
(starting one hour before now) occupies 60% of the timeline. The remaining
18 hours share 40% proportionally. The window is clamped to 00:00–06:00 and
18:00–24:00 at day boundaries. This is a deliberately non-linear display,
not a change to scheduling durations.

All geometry uses time-scale.ts. Items crossing scale boundaries are segmented
visually while retaining one identity and one accessible button. Narrow items
expose their details on selection. Pointer presence, keyboard focus and editing
dialogs freeze geometry; the clock and execution timer continue. Day rollover
refreshes the snapshot in the workspace timezone. Mobile scroll position is
initialized once rather than continually forced.

The day-type editor uses a separate linear scale for direct editing. Its geometry
must remain proportional even for five-minute blocks; the list below supplies
readable details.

## Clocks and state

DIGITAL, DIAL and SEGMENT are independent of the palette. The dial and segment
display are SVG; textual accessible time is always available. Seconds are not
live-announced. Pomodoro progress comes from plannedEndAt, including immediately
after reloading an active session.

Preference previews are temporary until saved; leaving without saving restores
persisted colors. Missing optional fields in older update requests retain their
stored values. Errors remain visible and are not presented as empty data.

## Verification

Run scripts/check.ps1 for the contract, frontend lint/tests/build, backend tests,
migration chain and secret check. PostgreSQL tests use only the guarded isolated
test database.

For browser QA, provide a locally installed Playwright module via
SHIFTARC_PLAYWRIGHT_MODULE (or install it outside the repository), start the
frontend, then run:

    node frontend/scripts/visual-check.mjs

SHIFTARC_VISUAL_URL may override the default loopback URL. The script intercepts
only /api/v1 requests with synthetic fixtures; it never writes application data.
It uses headless Microsoft Edge and saves screenshots and contrast/overflow
results in the ignored test-results/visual directory. Coverage includes six
palette variants, all three clocks, core dialogs, 360/768/1024/1440px layouts,
long titles, empty/error/dense lists and empty daily plans.

## Verified implementation — 2026-09-06

- Full quality gate passed: 39 frontend tests and 68 backend tests, none skipped.
- PostgreSQL checks covered both an empty schema and all three legacy palette
  records upgraded from V8, including retained background settings and versions.
- Browser QA produced 71 screenshots with no page overflow at the tested widths.
- Foreground/background, secondary text, primary buttons and destructive buttons
  passed 4.5:1 contrast across all six palette/mode combinations; minimum 5.71:1.
- Representative desktop and mobile screenshots were visually inspected. Fixes
  included compressed tick spacing, search input padding, linear day-type geometry
  and removing residual glow/color styles.
- The real local backend and persisted appearance page were checked after restart.
- Browser network fixtures cover presentation and UI states; unit, HTTP and
  PostgreSQL tests cover mutations. This does not claim a full WCAG certification.
