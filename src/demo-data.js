export const DEMO_RESPONSE = {
  projectsRoot: "~/Projects",
  syncedAt: "2026-07-26T14:41:00.000Z",
  github: {
    available: true,
    error: null,
  },
  projects: [
    ["Memory Vault", "A private, encrypted place to capture and retrieve what matters.", 3, 6, 12, 5],
    ["Release Radar", "Track product and dependency releases so nothing important slips.", 4, 7, 7, 3],
    ["Studio Site", "A fast, clean website to showcase work and drive inquiries.", 2, 5, 5, 1],
    ["Book Notes", "Organize notes, highlights, and thoughts from every book.", 3, 5, 9, 2],
    ["Stock Watch", "Monitor holdings and market movers with simple, timely insights.", 5, 6, 14, 4],
    ["Content Studio", "Plan, create, and publish content consistently across channels.", 1, 6, 3, 0, "planned"],
    ["Project Kit", "A starter kit for new projects with best practices baked in.", 1, 5, 2, 0, "planned"],
    ["AI Radar", "Discover and evaluate AI tools that actually move the needle.", 1, 4, 1, 0, "planned"],
  ].map(([name, outcome, currentStage, totalStages, issues, prs, status = "in-progress"]) => ({
    name,
    path: `/demo/${name.toLowerCase().replaceAll(" ", "-")}`,
    status,
    trackerState: "ready",
    roadmap: {
      outcome,
      currentStage,
      stages: Array.from({ length: totalStages }, (_, index) => ({
        id: `stage-${index + 1}`,
        title: `Stage ${index + 1}`,
      })),
    },
    github: {
      repository: `example/${name.toLowerCase().replaceAll(" ", "-")}`,
      url: "https://github.com",
      issuesUrl: "https://github.com/issues",
      pullRequestsUrl: "https://github.com/pulls",
      openIssues: issues,
      openPullRequests: prs,
      error: null,
    },
  })),
};
