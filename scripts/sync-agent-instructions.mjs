import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { upsertProjectStatusAgentInstructions } from "../lib/agent-instructions.mjs";
import { discoverRepositories } from "../lib/project-status.mjs";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const projectsRoot =
  process.env.PROJECTS_ROOT ?? path.join(os.homedir(), "Projects");
const repositories = await discoverRepositories(projectsRoot);
const changes = [];
const errors = [];

for (const repoPath of repositories) {
  const agentsPath = path.join(repoPath, "AGENTS.md");
  let existing = "";
  let exists = true;

  try {
    existing = await readFile(agentsPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      exists = false;
    } else {
      errors.push({ agentsPath, message: error.message });
      continue;
    }
  }

  try {
    const updated = upsertProjectStatusAgentInstructions(existing);

    if (updated !== existing) {
      changes.push({
        agentsPath,
        action: exists ? "updated" : "created",
        updated,
      });
    }
  } catch (error) {
    errors.push({ agentsPath, message: error.message });
  }
}

if (shouldWrite) {
  for (const change of changes) {
    await writeFile(change.agentsPath, change.updated);
  }
}

const created = changes.filter((change) => change.action === "created").length;
const updated = changes.filter((change) => change.action === "updated").length;
const mode = shouldWrite ? "Applied" : "Would apply";

console.log(
  `${mode} project-status instructions across ${changes.length} repository AGENTS.md file(s): ${created} create, ${updated} update.`,
);
console.log(
  `${repositories.length - changes.length - errors.length} already current.`,
);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`${error.agentsPath}: ${error.message}`);
  }
  process.exitCode = 1;
}

if (!shouldWrite && changes.length > 0) {
  console.log("Run `npm run agents:sync` to apply these changes.");
}
