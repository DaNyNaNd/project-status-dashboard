# Project tracker standard

Every Git repository under `~/Projects` is represented by a
`.project-status.json` file at its repository root.

The file is intentionally small:

- `status` groups the project in the portfolio view.
- `reviewed` distinguishes confirmed roadmap data from a generated starter.
- `roadmap.outcome` explains what the current roadmap will achieve.
- `roadmap.currentStage` is a one-based pointer into `roadmap.stages`.
- each stage has a stable `id`, a readable `title`, and an optional
  `githubMilestone`.

Example:

```json
{
  "schemaVersion": 1,
  "name": "Project Status Dashboard",
  "status": "in-progress",
  "reviewed": true,
  "roadmap": {
    "outcome": "A local portfolio dashboard that joins roadmap progress with GitHub activity.",
    "currentStage": 1,
    "stages": [
      {
        "id": "mvp-dashboard",
        "title": "Single-page MVP"
      },
      {
        "id": "project-details",
        "title": "Project drill-down",
        "githubMilestone": "Project details"
      }
    ]
  }
}
```

Run `npm run trackers:check` to count missing trackers. Run
`npm run trackers:init` to create honest starter files without overwriting any
existing tracker. Review each generated file, replace the starter outcome and
stage, then set `reviewed` to `true`.

GitHub issue and pull-request counts come from each repository's `origin` remote
through the authenticated GitHub CLI. The optional milestone field is reserved
for future project-detail views; the MVP shows repository-wide open counts.
