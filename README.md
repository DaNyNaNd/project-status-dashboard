# Project Status Dashboard

A local, single-page portfolio dashboard for Git repositories under
`~/Projects`. It combines a small standardized roadmap tracker with live open
issue and pull-request counts from GitHub.

## Run locally

```bash
npm install
npm run dev
```

The local Vite server exposes both the React interface and the filesystem-backed
project API. `PROJECTS_ROOT` can override the default `~/Projects` directory.

GitHub counts use the repository's `origin` remote and the authenticated `gh`
CLI. Repositories without a GitHub remote remain visible with unavailable
counts.

## Project tracker

Every repository uses one root-level `.project-status.json` file. The canonical
format and example are in [docs/PROJECT_TRACKER.md](docs/PROJECT_TRACKER.md),
with a machine-readable schema in
[docs/project-status.schema.json](docs/project-status.schema.json).

Useful commands:

```bash
npm run agents:check
npm run agents:sync
npm run trackers:check
npm run trackers:init
npm run trackers:refresh
```

Generated trackers set `reviewed` to `false`. The dashboard labels them “Needs
setup” until someone confirms the roadmap outcome, stage list, current stage,
and project status.

`agents:sync` creates or updates a marker-managed section in every repository's
root `AGENTS.md`. Existing project-specific instructions are preserved. The
managed section tells future agents when and how to maintain the tracker as
roadmap work progresses.

To turn each generated tracker into an evidence-backed project record, run the
[per-project tracker review prompt](docs/PROJECT_TRACKER_REVIEW_PROMPT.md) once
from a Codex task rooted in that repository. No additional setup script or
dashboard registration is required.

## Verification

```bash
npm test
npm run build
npm run test:sites
```

The Product Design starter still produces a Sites-compatible static package,
but hosted builds cannot read a local `~/Projects` directory. The complete MVP
is therefore a local dashboard; a hosted version would need a separate data
sync service.
