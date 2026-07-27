import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const TRACKER_FILENAME = ".project-status.json";
export const PROJECT_STATUSES = new Set([
  "in-progress",
  "planned",
  "paused",
  "complete",
  "archived",
]);

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".worktrees",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".astro",
  ".venv",
  "vendor",
]);

// Relative to PROJECTS_ROOT. Keep projects here only when they should not be
// portfolio-tracked at all: for example, a completed site with no active
// roadmap, or a repository whose roadmap is owned by someone else.
export const EXCLUDED_REPOSITORY_PATHS = new Set([
  "forty/fusion",
  "kielworks/kielworks-blog",
  "kielworks/kielworks-site",
  "onecode/one-code-blog",
  "onecode/one-code-site",
  "onecode/redspur/app",
  "personal/content-generator",
  "personal/open-weight-tests",
  "personal/project-starter-kit",
  "skills",
]);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function humanizeName(value) {
  const preferredTokens = new Map([
    ["ai", "AI"],
    ["aiops", "AIOps"],
    ["os", "OS"],
    ["pm", "PM"],
    ["mergerisk", "MergeRisk"],
  ]);

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((token) => {
      const normalized = token.toLowerCase();
      return (
        preferredTokens.get(normalized) ??
        `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
      );
    })
    .join(" ");
}

function projectNameFromPath(repoPath) {
  const directoryName = path.basename(repoPath);

  if (directoryName.toLowerCase() === "app") {
    return `${humanizeName(path.basename(path.dirname(repoPath)))} App`;
  }

  return humanizeName(directoryName);
}

export function validateTracker(value) {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["Tracker must be a JSON object."];
  }

  if (value.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1.");
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    errors.push("name must be a non-empty string.");
  }

  if (!PROJECT_STATUSES.has(value.status)) {
    errors.push(`status must be one of: ${[...PROJECT_STATUSES].join(", ")}.`);
  }

  if (typeof value.reviewed !== "boolean") {
    errors.push("reviewed must be a boolean.");
  }

  if (!value.roadmap || typeof value.roadmap !== "object") {
    errors.push("roadmap must be an object.");
    return errors;
  }

  if (typeof value.roadmap.outcome !== "string" || !value.roadmap.outcome.trim()) {
    errors.push("roadmap.outcome must be a non-empty string.");
  }

  if (!Array.isArray(value.roadmap.stages) || value.roadmap.stages.length === 0) {
    errors.push("roadmap.stages must contain at least one stage.");
  } else {
    const ids = new Set();

    value.roadmap.stages.forEach((stage, index) => {
      if (!stage || typeof stage !== "object") {
        errors.push(`roadmap.stages[${index}] must be an object.`);
        return;
      }

      if (typeof stage.id !== "string" || !stage.id.trim()) {
        errors.push(`roadmap.stages[${index}].id must be a non-empty string.`);
      } else if (ids.has(stage.id)) {
        errors.push(`roadmap.stages[${index}].id must be unique.`);
      } else {
        ids.add(stage.id);
      }

      if (typeof stage.title !== "string" || !stage.title.trim()) {
        errors.push(`roadmap.stages[${index}].title must be a non-empty string.`);
      }

      if (
        stage.githubMilestone !== undefined &&
        (typeof stage.githubMilestone !== "string" || !stage.githubMilestone.trim())
      ) {
        errors.push(
          `roadmap.stages[${index}].githubMilestone must be a non-empty string when provided.`,
        );
      }
    });
  }

  if (
    !Number.isInteger(value.roadmap.currentStage) ||
    value.roadmap.currentStage < 1 ||
    value.roadmap.currentStage > (value.roadmap.stages?.length ?? 0)
  ) {
    errors.push("roadmap.currentStage must point to an existing stage.");
  }

  return errors;
}

export function createStarterTracker(repoPath) {
  return {
    schemaVersion: 1,
    name: projectNameFromPath(repoPath),
    status: "planned",
    reviewed: false,
    roadmap: {
      outcome: "Review this repository and define the outcome of its current roadmap.",
      currentStage: 1,
      stages: [
        {
          id: "define-roadmap",
          title: "Define roadmap",
        },
      ],
    },
  };
}

export async function discoverRepositories(projectsRoot) {
  const repositories = [];

  async function walk(directory, depth) {
    if (depth > 6) return;

    if (await exists(path.join(directory, ".git"))) {
      const relativePath = path.relative(projectsRoot, directory);

      if (!EXCLUDED_REPOSITORY_PATHS.has(relativePath)) {
        repositories.push(directory);
      }
      return;
    }

    let entries;

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.isDirectory() &&
            !SKIPPED_DIRECTORIES.has(entry.name) &&
            !entry.name.startsWith("."),
        )
        .map((entry) => walk(path.join(directory, entry.name), depth + 1)),
    );
  }

  await walk(projectsRoot, 0);
  return repositories.sort((left, right) => left.localeCompare(right));
}

function parseGitHubRemote(remote) {
  const match = remote.trim().match(
    /github\.com(?::|\/)(?<owner>[^/\s]+)\/(?<repo>[^/\s]+?)(?:\.git)?$/,
  );

  if (!match?.groups) return null;

  return {
    owner: match.groups.owner,
    name: match.groups.repo.replace(/\.git$/, ""),
  };
}

async function readGitHubRepository(repoPath) {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", repoPath, "remote", "get-url", "origin"],
      {
        timeout: 3_000,
        maxBuffer: 32_000,
      },
    );

    return parseGitHubRemote(stdout);
  } catch {
    return null;
  }
}

async function readTracker(repoPath) {
  const trackerPath = path.join(repoPath, TRACKER_FILENAME);

  if (!(await exists(trackerPath))) {
    return {
      value: createStarterTracker(repoPath),
      state: "missing",
      errors: [],
    };
  }

  try {
    const value = JSON.parse(await readFile(trackerPath, "utf8"));
    const errors = validateTracker(value);

    return {
      value,
      state: errors.length ? "invalid" : value.reviewed ? "ready" : "needs-review",
      errors,
    };
  } catch (error) {
    return {
      value: createStarterTracker(repoPath),
      state: "invalid",
      errors: [error.message],
    };
  }
}

async function fetchGitHubCounts(repository) {
  if (!repository) {
    return {
      repository: null,
      url: null,
      issuesUrl: null,
      pullRequestsUrl: null,
      openIssues: null,
      openPullRequests: null,
      error: null,
    };
  }

  const query = `query($owner:String!,$name:String!){repository(owner:$owner,name:$name){url issues(states:OPEN){totalCount} pullRequests(states:OPEN){totalCount}}}`;

  try {
    const { stdout } = await execFileAsync(
      "gh",
      [
        "api",
        "graphql",
        "-f",
        `query=${query}`,
        "-F",
        `owner=${repository.owner}`,
        "-F",
        `name=${repository.name}`,
      ],
      {
        timeout: 12_000,
        maxBuffer: 128_000,
        env: {
          ...process.env,
          GH_PAGER: "cat",
        },
      },
    );
    const result = JSON.parse(stdout).data.repository;

    return {
      repository: `${repository.owner}/${repository.name}`,
      url: result.url,
      issuesUrl: `${result.url}/issues`,
      pullRequestsUrl: `${result.url}/pulls`,
      openIssues: result.issues.totalCount,
      openPullRequests: result.pullRequests.totalCount,
      error: null,
    };
  } catch (error) {
    const repositoryUrl = `https://github.com/${repository.owner}/${repository.name}`;

    return {
      repository: `${repository.owner}/${repository.name}`,
      url: repositoryUrl,
      issuesUrl: `${repositoryUrl}/issues`,
      pullRequestsUrl: `${repositoryUrl}/pulls`,
      openIssues: null,
      openPullRequests: null,
      error: error.message,
    };
  }
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

export async function collectProjectStatuses({
  projectsRoot = process.env.PROJECTS_ROOT ?? path.join(os.homedir(), "Projects"),
  includeGitHub = true,
} = {}) {
  const repositoryPaths = await discoverRepositories(projectsRoot);
  const baseProjects = await Promise.all(
    repositoryPaths.map(async (repoPath) => {
      const [tracker, repository] = await Promise.all([
        readTracker(repoPath),
        readGitHubRepository(repoPath),
      ]);

      return {
        name: tracker.value.name,
        path: repoPath,
        relativePath: path.relative(projectsRoot, repoPath),
        status: tracker.value.status,
        trackerState: tracker.state,
        trackerErrors: tracker.errors,
        roadmap: tracker.value.roadmap,
        repository,
      };
    }),
  );

  const projects = await mapWithConcurrency(baseProjects, 5, async (project) => {
    const github = includeGitHub
      ? await fetchGitHubCounts(project.repository)
      : {
          repository: project.repository
            ? `${project.repository.owner}/${project.repository.name}`
            : null,
          url: null,
          issuesUrl: null,
          pullRequestsUrl: null,
          openIssues: null,
          openPullRequests: null,
          error: null,
        };

    const { repository: _repository, ...serializableProject } = project;

    return {
      ...serializableProject,
      github,
    };
  });

  const githubErrors = projects
    .map((project) => project.github.error)
    .filter(Boolean);

  return {
    projectsRoot,
    syncedAt: new Date().toISOString(),
    github: {
      available: githubErrors.length < projects.length,
      error: githubErrors.length ? githubErrors[0] : null,
    },
    projects: projects
      .filter((project) => project.status !== "archived")
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
