import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_INSTRUCTIONS_END,
  AGENT_INSTRUCTIONS_START,
  PROJECT_STATUS_AGENT_INSTRUCTIONS,
  upsertProjectStatusAgentInstructions,
} from "../lib/agent-instructions.mjs";

test("creates a complete AGENTS.md when none exists", () => {
  const result = upsertProjectStatusAgentInstructions("");

  assert.match(result, /^# Agent instructions/);
  assert.match(result, /Treat the root `\.project-status\.json`/);
  assert.equal(result.match(/PROJECT_STATUS_TRACKER_INSTRUCTIONS_START/g)?.length, 1);
  assert.equal(result.match(/PROJECT_STATUS_TRACKER_INSTRUCTIONS_END/g)?.length, 1);
});

test("appends the managed block without changing existing instructions", () => {
  const existing = "# Existing rules\n\n- Preserve this exactly.\n";
  const result = upsertProjectStatusAgentInstructions(existing);

  assert.ok(result.startsWith(existing.trimEnd()));
  assert.match(result, /Preserve this exactly\./);
  assert.ok(result.endsWith(`${AGENT_INSTRUCTIONS_END}\n`));
});

test("refreshes an existing managed block idempotently", () => {
  const stale = `${AGENT_INSTRUCTIONS_START}\nOld instructions\n${AGENT_INSTRUCTIONS_END}`;
  const existing = `# Existing rules\n\n${stale}\n`;
  const refreshed = upsertProjectStatusAgentInstructions(existing);

  assert.match(refreshed, /Treat the root `\.project-status\.json`/);
  assert.doesNotMatch(refreshed, /Old instructions/);
  assert.equal(
    upsertProjectStatusAgentInstructions(refreshed),
    refreshed,
  );
  assert.match(refreshed, new RegExp(PROJECT_STATUS_AGENT_INSTRUCTIONS.slice(0, 30)));
});

test("refuses a partially marked managed block", () => {
  assert.throws(
    () =>
      upsertProjectStatusAgentInstructions(
        `# Existing\n\n${AGENT_INSTRUCTIONS_START}\nIncomplete`,
      ),
    /only one project-status instruction marker/,
  );
});
