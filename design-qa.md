# Design QA

## Evidence

- Source visual truth: `design-reference/gruvbox-roadmap-dashboard.png`
- Final implementation screenshot:
  `design-reference/implementation-demo-final.jpg`
- Mobile implementation screenshot:
  `design-reference/implementation-mobile.jpg`
- Comparison state: demo portfolio, all projects, idle sync control
- Desktop viewport: 1487 × 1058 CSS px
- Source pixels: 1487 × 1058 PNG
- Implementation pixels: 1487 × 1058 JPEG
- Device scale factor: 1
- Density normalization: none required; source and implementation were compared
  at identical pixel dimensions and viewport proportions.
- Full-view comparison: source and implementation were opened together at
  1487 × 1058. The header, section labels, eight project rows, stage tracks,
  roadmap outcomes, issue counts, and PR counts were all visible.
- Focused-region comparison: not required. At identical full resolution, the
  dense row typography, stage numbers, icons, separators, and control labels
  remained legible; the target contains no photographic or illustrative assets
  requiring crop-level inspection.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: Source Serif 4 reproduces the warm editorial display,
  project-name, and italic roadmap treatment. Inter provides the compact UI
  labels and controls. Hierarchy, weights, wrapping, and line lengths match the
  source intent.
- Spacing and layout rhythm: the implementation preserves the full-width
  surface, 27 px page edge, left summary / center stage track / right GitHub
  count grid, lightweight separators, and compact planned rows.
- Colors and visual tokens: the implementation uses Gruvbox Dark Medium
  `#282828`, warm foreground `#ebdbb2`, muted surfaces, dark Gruvbox green for
  completed stages, aqua for the current stage, and orange for the primary
  action. There are no gradients or heavy shadows.
- Image quality and asset fidelity: the source contains no image assets.
  Phosphor icons are used for sync, completed stages, GitHub status, and warning
  states; no placeholder art, custom SVGs, or raster substitutes are present.
- Copy and content: the demo copy follows the source hierarchy. Live copy
  clearly distinguishes reviewed roadmaps from generated starter trackers.
- Accessibility and responsiveness: semantic headings, labeled controls,
  reduced-motion handling, high-contrast focus rings, and practical mobile tap
  targets are present. Desktop (1487 × 1058), tablet (768 × 900), and mobile
  (390 × 844) checks showed no horizontal overflow or clipped controls.

## Comparison History

1. Pass 1 — blocked
   - Earlier P2: the 160 px header and uniform 113 px row height pushed the last
     planned project below the 1440 × 1024 comparison viewport.
   - Fix: reduced the desktop header to 128 px and made planned rows 96 px tall.
   - Post-fix evidence:
     `design-reference/implementation-demo-pass-2.jpg`.
2. Pass 2 — passed
   - The final 1487 × 1058 capture shows all eight rows and matches the source
     region proportions without overflow.
   - Final evidence:
     `design-reference/implementation-demo-final.jpg`.

## Primary Interactions Tested

- Project filter: selecting “Planned” hides the in-progress section and shows
  exactly the three planned projects.
- GitHub sync: the button enters a disabled “Syncing…” state and returns to an
  enabled “Sync GitHub” state after refresh.
- Live data: the local route loaded 24 repositories, including one reviewed
  in-progress roadmap and 23 honest “Needs setup” trackers.
- GitHub fallback: repositories with inaccessible or missing remotes retain
  roadmap data and show unavailable counts without blocking the page.
- Browser console: no warnings or errors.

## Open Questions

- None.

## Implementation Checklist

- [x] Match the selected Gruvbox stage-track visual.
- [x] Keep the MVP to one page.
- [x] Wire the project filter and sync action.
- [x] Load real local repositories and GitHub counts.
- [x] Preserve mobile and tablet usability.

## Follow-up Polish

- None required for MVP handoff.

final result: passed
