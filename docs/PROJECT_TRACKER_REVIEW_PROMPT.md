# Per-project tracker review prompt

Run this once in a Codex task rooted at each repository that appears under
“Needs setup” in the dashboard.

```text
/goal Review and finalize this repository's project status tracker.

Work only in the current repository.

1. Read the root AGENTS.md first and follow all repository instructions.
2. Inspect git status before changing anything. Preserve every unrelated user
   change and never stage unrelated files.
3. Read the repository's authoritative project documentation before deciding
   status:
   - README.md
   - ROADMAP.md
   - docs/CURRENT_STATUS.md
   - any roadmap, phase, milestone, product-vision, or current-status document
     explicitly identified as authoritative by the repository
4. Review the generated .project-status.json and replace its placeholder data
   with evidence-backed values:
   - name: the project's proper display name
   - status: in-progress, planned, paused, complete, or archived
   - roadmap.outcome: one concise sentence describing what will be achieved by
     the end of the current roadmap
   - roadmap.stages: the ordered stages in the current roadmap, with stable
     kebab-case ids and clear titles
   - roadmap.currentStage: the one-based index of the stage currently being
     worked on
   - githubMilestone: include it only when that exact milestone exists
5. Keep schemaVersion at 1. Set reviewed to true only when the values are
   supported by repository authority.
6. Do not infer or invent missing roadmap stages, completion state, or outcomes.
   If the authority is ambiguous or contradictory, stop and ask me one concise
   question instead of guessing.
7. Do not modify application code, roadmap documents, GitHub issues, pull
   requests, or milestones as part of this task.
8. Validate that .project-status.json parses as JSON and follows
   ~/Projects/project-status-dashboard/docs/project-status.schema.json.
9. If the centrally managed project-status block in AGENTS.md is already an
   uncommitted change, include AGENTS.md with this tracker update. Stage no
   other files.
10. Commit the scoped tracker setup locally with:
    chore: configure project status tracker

Do not push or open a pull request unless I explicitly ask in this task.

At the end, report:
- the authority files used
- status, current stage, total stages, and roadmap outcome selected
- files committed
- any unresolved ambiguity
```

After the task commits the tracker, refresh the dashboard. The project should
move out of “Needs setup” immediately; no additional registration step is
required.
