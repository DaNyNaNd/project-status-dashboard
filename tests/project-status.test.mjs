import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createStarterTracker,
  discoverRepositories,
  validateTracker,
} from "../lib/project-status.mjs";

test("starter trackers are valid and explicitly unreviewed", () => {
  const tracker = createStarterTracker("/tmp/example-project");

  assert.equal(tracker.reviewed, false);
  assert.equal(tracker.roadmap.currentStage, 1);
  assert.deepEqual(validateTracker(tracker), []);
});

test("starter tracker names preserve common project acronyms", () => {
  assert.equal(
    createStarterTracker("/tmp/ai-tech-radar").name,
    "AI Tech Radar",
  );
  assert.equal(
    createStarterTracker("/tmp/redspur/app").name,
    "Redspur App",
  );
  assert.equal(
    createStarterTracker("/tmp/mergerisk-action").name,
    "MergeRisk Action",
  );
});

test("tracker validation rejects a stage pointer outside the roadmap", () => {
  const tracker = createStarterTracker("/tmp/example-project");
  tracker.roadmap.currentStage = 2;

  assert.match(
    validateTracker(tracker).join("\n"),
    /must point to an existing stage/,
  );
});

test("repository discovery finds nested repositories without descending into them", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "project-status-"));
  const repository = path.join(root, "company", "project");
  await mkdir(path.join(repository, ".git"), { recursive: true });
  await writeFile(path.join(repository, ".git", "config"), "");
  await mkdir(path.join(repository, "nested"), { recursive: true });
  await mkdir(path.join(root, "node_modules", "ignored", ".git"), {
    recursive: true,
  });

  assert.deepEqual(await discoverRepositories(root), [repository]);
});

test("repository discovery excludes configured portfolio paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "project-status-"));
  const excluded = path.join(root, "skills");
  const included = path.join(root, "personal", "active-project");

  await Promise.all(
    [excluded, included].map(async (repository) => {
      await mkdir(path.join(repository, ".git"), { recursive: true });
      await writeFile(path.join(repository, ".git", "config"), "");
    }),
  );

  assert.deepEqual(await discoverRepositories(root), [included]);
});
