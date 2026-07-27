# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Product decisions

- Preserve the selected stage-track layout from `design-reference/gruvbox-roadmap-dashboard.png`.
- Use the Gruvbox Dark Medium palette with `#282828` as the base surface.
- Keep the MVP to one portfolio page. Individual project drill-down belongs to a future phase.
- Every discovered Git repository remains visible unless its relative path is explicitly listed in `EXCLUDED_REPOSITORY_PATHS` in `lib/project-status.mjs`. Use exclusions only for repositories that should not be portfolio-tracked at all; missing or unreviewed tracker data for included repositories must be labeled honestly instead of inferred.
- The standardized repository tracker is `.project-status.json`.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

<!-- PROJECT_STATUS_TRACKER_INSTRUCTIONS_START -->
## Project status tracker

- Treat the root `.project-status.json` as the canonical portfolio summary for this repository.
- Update it in the same change whenever the project status, roadmap outcome, stage list, or current stage changes.
- Keep `schemaVersion` at `1`. Keep `roadmap.currentStage` as a one-based index into the ordered `roadmap.stages` array.
- Preserve stable stage `id` values after they are introduced. Change the stage order or roadmap outcome only when the actual roadmap changes.
- When work advances to another stage, update `roadmap.currentStage`. When the final stage is finished, set `status` to `complete` and leave `currentStage` pointing at the final stage.
- Use `status` values only from `in-progress`, `planned`, `paused`, `complete`, or `archived`.
- GitHub issue and pull-request counts are derived by the dashboard; never store those counts in the tracker. Use an optional stage `githubMilestone` only when that milestone really exists.
- If `reviewed` is `false`, inspect the repository's authoritative roadmap and current-status documentation, replace the generated placeholder data, and set `reviewed` to `true`. Do not invent roadmap stages or outcomes when authority is unclear.
<!-- PROJECT_STATUS_TRACKER_INSTRUCTIONS_END -->
