import type { FinalDefinition, FinalScoreParams, FinalTextParams } from "@/data/finals";
import { FINALS } from "@/data/finals";

export function selectFinal(params: {
  character: FinalScoreParams["character"];
  archetypeId: FinalScoreParams["archetypeId"];
  flags: FinalScoreParams["flags"];
  history: FinalScoreParams["history"];
  unlockedMilestonesCount: number;
}): { id: string; label: string; text: string } {
  let best: FinalDefinition | null = null;
  let bestScore = -Infinity;
  for (const f of FINALS) {
    const score = f.score({
      character: params.character,
      archetypeId: params.archetypeId,
      flags: params.flags,
      history: params.history,
    });
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }

  const final = best ?? FINALS[0];
  const text = final.buildText({
    character: params.character,
    archetypeId: params.archetypeId,
    flags: params.flags,
    unlockedMilestonesCount: params.unlockedMilestonesCount,
  } as FinalTextParams);

  return { id: final.id, label: final.label, text };
}

