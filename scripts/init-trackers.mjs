import { access, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createStarterTracker,
  discoverRepositories,
  TRACKER_FILENAME,
} from "../lib/project-status.mjs";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const shouldRefresh = args.has("--refresh-unreviewed");
const projectsRoot =
  process.env.PROJECTS_ROOT ?? path.join(os.homedir(), "Projects");
const repositories = await discoverRepositories(projectsRoot);
const pending = [];
const refreshed = [];

for (const repoPath of repositories) {
  const trackerPath = path.join(repoPath, TRACKER_FILENAME);

  try {
    await access(trackerPath);

    if (shouldRefresh) {
      const tracker = JSON.parse(await readFile(trackerPath, "utf8"));
      const preferredName = createStarterTracker(repoPath).name;

      if (tracker.reviewed === false && tracker.name !== preferredName) {
        await writeFile(
          trackerPath,
          `${JSON.stringify({ ...tracker, name: preferredName }, null, 2)}\n`,
        );
        refreshed.push(trackerPath);
      }
    }
  } catch {
    pending.push({ repoPath, trackerPath });
  }
}

if (shouldWrite) {
  for (const entry of pending) {
    await writeFile(
      entry.trackerPath,
      `${JSON.stringify(createStarterTracker(entry.repoPath), null, 2)}\n`,
      { flag: "wx" },
    );
  }
}

const mode = shouldWrite ? "Initialized" : "Would initialize";
console.log(`${mode} ${pending.length} tracker(s) under ${projectsRoot}.`);
if (shouldRefresh) {
  console.log(`Refreshed ${refreshed.length} unreviewed tracker name(s).`);
}

if (!shouldWrite && pending.length > 0) {
  console.log("Run `npm run trackers:init` to create the missing tracker files.");
}
