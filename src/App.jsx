import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowsClockwise,
  Check,
  GithubLogo,
  WarningCircle,
} from "@phosphor-icons/react";
import { DEMO_RESPONSE } from "./demo-data.js";

const GROUP_ORDER = ["in-progress", "planned", "needs-review", "paused", "complete"];

const GROUP_LABELS = {
  "in-progress": "In progress",
  planned: "Planned",
  "needs-review": "Needs setup",
  paused: "Paused",
  complete: "Complete",
};

const FILTER_LABELS = {
  all: "All projects",
  "in-progress": "In progress",
  planned: "Planned",
  "needs-review": "Needs setup",
  paused: "Paused",
  complete: "Complete",
};

function formatSyncTime(value) {
  if (!value) return "Not synced";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StageTrack({ project }) {
  if (project.trackerState !== "ready") {
    return (
      <div className="stage-cell stage-cell--needs-review">
        <span className="stage-label">Needs roadmap setup</span>
        <div className="setup-track" aria-hidden="true" />
      </div>
    );
  }

  const { currentStage, stages } = project.roadmap;

  return (
    <div className="stage-cell">
      <span className="stage-label">
        Stage {currentStage} of {stages.length}
      </span>
      <ol className="stage-track" aria-label={`${project.name} roadmap progress`}>
        {stages.map((stage, index) => {
          const stageNumber = index + 1;
          const state =
            stageNumber < currentStage
              ? "complete"
              : stageNumber === currentStage
                ? "current"
                : "upcoming";

          return (
            <li
              className={`stage-segment stage-segment--${state}`}
              key={stage.id}
              title={`${stageNumber}. ${stage.title}`}
              aria-label={`${stage.title}: ${state}`}
            >
              {state === "complete" ? (
                <Check className="stage-check" size={20} weight="bold" aria-hidden="true" />
              ) : (
                stageNumber
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function GitHubCount({ href, label, value }) {
  const content = (
    <>
      <span className="github-count__label">{label}</span>
      <span className="github-count__value">
        {Number.isInteger(value) ? value : "—"}
      </span>
    </>
  );

  return href ? (
    <a className="github-count" href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <span className="github-count">{content}</span>
  );
}

function ProjectRow({ project }) {
  return (
    <article className="project-row">
      <div className="project-summary">
        <h2>{project.name}</h2>
        <p>{project.roadmap.outcome}</p>
      </div>

      <StageTrack project={project} />

      <div className="github-counts" aria-label={`${project.name} GitHub activity`}>
        <GitHubCount
          href={project.github.issuesUrl}
          label="Issues"
          value={project.github.openIssues}
        />
        <GitHubCount
          href={project.github.pullRequestsUrl}
          label="PRs"
          value={project.github.openPullRequests}
        />
      </div>
    </article>
  );
}

function ProjectGroup({ status, projects }) {
  return (
    <section
      className={`project-group project-group--${status}`}
      aria-labelledby={`group-${status}`}
    >
      <header className="group-header">
        <h2 id={`group-${status}`}>
          {GROUP_LABELS[status]} <span>({projects.length})</span>
        </h2>
      </header>
      {projects.map((project) => (
        <ProjectRow project={project} key={project.path} />
      ))}
    </section>
  );
}

export function App() {
  const demoMode = useMemo(
    () => new URLSearchParams(window.location.search).has("demo"),
    [],
  );
  const [response, setResponse] = useState(demoMode ? DEMO_RESPONSE : null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(!demoMode);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(
    async ({ refresh = false } = {}) => {
      if (demoMode) {
        setSyncing(true);
        window.setTimeout(() => {
          setResponse({
            ...DEMO_RESPONSE,
            syncedAt: new Date().toISOString(),
          });
          setSyncing(false);
        }, 650);
        return;
      }

      refresh ? setSyncing(true) : setLoading(true);
      setError("");

      try {
        const result = await fetch(refresh ? "/api/projects?refresh=1" : "/api/projects", {
          cache: "no-store",
        });

        if (!result.ok) {
          throw new Error(`Project status request failed (${result.status})`);
        }

        setResponse(await result.json());
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [demoMode],
  );

  useEffect(() => {
    if (!demoMode) loadProjects();
  }, [demoMode, loadProjects]);

  const groupedProjects = useMemo(() => {
    const groups = new Map(GROUP_ORDER.map((status) => [status, []]));

    for (const project of response?.projects ?? []) {
      const group =
        project.trackerState === "ready" ? project.status : "needs-review";

      if (filter === "all" || filter === group) {
        (groups.get(group) ?? groups.get("needs-review")).push(project);
      }
    }

    return GROUP_ORDER.map((status) => ({
      status,
      projects: groups.get(status),
    })).filter(({ projects }) => projects.length > 0);
  }, [filter, response]);

  const totalProjects = response?.projects.length ?? 0;

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>Project roadmap</h1>
          <p>Last synced: {formatSyncTime(response?.syncedAt)}</p>
        </div>

        <div className="page-actions">
          <label className="filter-control">
            <span className="sr-only">Filter projects</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter projects"
            >
              {Object.entries(FILTER_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                  {value === "all" && totalProjects ? ` (${totalProjects})` : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            className="sync-button"
            type="button"
            onClick={() => loadProjects({ refresh: true })}
            disabled={syncing}
          >
            <ArrowsClockwise
              size={21}
              weight="bold"
              className={syncing ? "is-spinning" : ""}
              aria-hidden="true"
            />
            {syncing ? "Syncing…" : "Sync GitHub"}
          </button>
        </div>
      </header>

      {response?.github.error ? (
        <div className="notice" role="status">
          <GithubLogo size={19} weight="fill" aria-hidden="true" />
          Some GitHub counts are unavailable. Available counts and roadmap data are still current.
        </div>
      ) : null}

      {error ? (
        <div className="error-state" role="alert">
          <WarningCircle size={22} weight="fill" aria-hidden="true" />
          <div>
            <strong>Couldn’t load local projects.</strong>
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => loadProjects()}>
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="loading-state" role="status">
          <ArrowsClockwise size={22} className="is-spinning" aria-hidden="true" />
          Reading project roadmaps…
        </div>
      ) : null}

      {!loading && !error && groupedProjects.length === 0 ? (
        <div className="empty-state">
          <strong>No projects match this filter.</strong>
          <button type="button" onClick={() => setFilter("all")}>
            Show all projects
          </button>
        </div>
      ) : null}

      <div className="project-list">
        {groupedProjects.map(({ status, projects }) => (
          <ProjectGroup status={status} projects={projects} key={status} />
        ))}
      </div>

      <footer className="page-footer">
        <span>{response?.projectsRoot ?? "~/Projects"}</span>
        <span>{totalProjects} repositories tracked</span>
      </footer>
    </main>
  );
}
