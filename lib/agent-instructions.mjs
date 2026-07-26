export const AGENT_INSTRUCTIONS_START =
  "<!-- PROJECT_STATUS_TRACKER_INSTRUCTIONS_START -->";
export const AGENT_INSTRUCTIONS_END =
  "<!-- PROJECT_STATUS_TRACKER_INSTRUCTIONS_END -->";

export const PROJECT_STATUS_AGENT_INSTRUCTIONS = `${AGENT_INSTRUCTIONS_START}
## Project status tracker

- Treat the root \`.project-status.json\` as the canonical portfolio summary for this repository.
- Update it in the same change whenever the project status, roadmap outcome, stage list, or current stage changes.
- Keep \`schemaVersion\` at \`1\`. Keep \`roadmap.currentStage\` as a one-based index into the ordered \`roadmap.stages\` array.
- Preserve stable stage \`id\` values after they are introduced. Change the stage order or roadmap outcome only when the actual roadmap changes.
- When work advances to another stage, update \`roadmap.currentStage\`. When the final stage is finished, set \`status\` to \`complete\` and leave \`currentStage\` pointing at the final stage.
- Use \`status\` values only from \`in-progress\`, \`planned\`, \`paused\`, \`complete\`, or \`archived\`.
- GitHub issue and pull-request counts are derived by the dashboard; never store those counts in the tracker. Use an optional stage \`githubMilestone\` only when that milestone really exists.
- If \`reviewed\` is \`false\`, inspect the repository's authoritative roadmap and current-status documentation, replace the generated placeholder data, and set \`reviewed\` to \`true\`. Do not invent roadmap stages or outcomes when authority is unclear.
${AGENT_INSTRUCTIONS_END}`;

export function upsertProjectStatusAgentInstructions(existingContent) {
  const existing = existingContent ?? "";
  const startIndex = existing.indexOf(AGENT_INSTRUCTIONS_START);
  const endIndex = existing.indexOf(AGENT_INSTRUCTIONS_END);

  if ((startIndex === -1) !== (endIndex === -1)) {
    throw new Error(
      "AGENTS.md contains only one project-status instruction marker; refusing to overwrite it.",
    );
  }

  if (startIndex !== -1) {
    if (endIndex < startIndex) {
      throw new Error(
        "AGENTS.md project-status instruction markers are out of order.",
      );
    }

    const afterEnd = endIndex + AGENT_INSTRUCTIONS_END.length;
    return `${existing.slice(0, startIndex)}${PROJECT_STATUS_AGENT_INSTRUCTIONS}${existing.slice(afterEnd)}`;
  }

  const prefix = existing.trimEnd();

  if (!prefix) {
    return `# Agent instructions\n\n${PROJECT_STATUS_AGENT_INSTRUCTIONS}\n`;
  }

  return `${prefix}\n\n${PROJECT_STATUS_AGENT_INSTRUCTIONS}\n`;
}
