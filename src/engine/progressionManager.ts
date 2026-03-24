import type { CharacterVariables } from "@/data/character";
import { MILESTONES, type MilestoneDefinition } from "@/data/progression";
import { evaluateEventCondition } from "./eventManager";

function isMilestoneReached(
  character: CharacterVariables,
  unlockedMilestones: readonly string[],
  milestone: MilestoneDefinition,
): boolean {
  return milestone.conditions.every((condition) =>
    evaluateEventCondition({
      character,
      unlockedMilestones,
      condition,
    }),
  );
}

export function computeUnlockedMilestones(params: {
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
}): string[] {
  const out = new Set(params.unlockedMilestones);
  for (const m of MILESTONES) {
    if (!out.has(m.id) && isMilestoneReached(params.character, [...out], m)) {
      out.add(m.id);
    }
  }
  return [...out];
}

