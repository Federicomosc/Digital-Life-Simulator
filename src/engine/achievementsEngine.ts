import type { AchievementDefinition, AchievementCheckParams } from "@/data/achievements";

export function evaluateAchievements(params: {
  readonly achievements: readonly AchievementDefinition[];
  readonly alreadyUnlocked: readonly string[];
  readonly state: Omit<AchievementCheckParams, "effectHistory"> & {
    readonly effectHistory: readonly {
      source: string;
      effects: readonly { target: string; op: string; value: number }[];
    }[];
  };
}): { readonly newlyUnlocked: string[]; readonly definitions: readonly AchievementDefinition[] } {
  const unlockedSet = new Set(params.alreadyUnlocked);
  const newlyUnlocked: string[] = [];
  const definitions: AchievementDefinition[] = [];

  for (const a of params.achievements) {
    if (unlockedSet.has(a.id)) continue;
    const ok = a.check(params.state);
    if (ok) {
      unlockedSet.add(a.id);
      newlyUnlocked.push(a.id);
      definitions.push(a);
    }
  }

  return { newlyUnlocked, definitions };
}

