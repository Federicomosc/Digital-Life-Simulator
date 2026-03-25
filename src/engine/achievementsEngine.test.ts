import { describe, expect, it } from "vitest";
import { evaluateAchievements } from "@/engine/achievementsEngine";
import { ACHIEVEMENTS } from "@/data/achievements";
import type { CharacterVariables } from "@/data/character";

describe("achievementsEngine", () => {
  it("unlocks happiness 100 when condition is met", () => {
    const character: CharacterVariables = {
      health: 50,
      happiness: 100,
      money: 10,
      career: 10,
      relationships: 20,
      skills: 30,
      turn: 1,
    };

    const result = evaluateAchievements({
      achievements: ACHIEVEMENTS,
      alreadyUnlocked: [],
      state: {
        character,
        archetypeId: "worker",
        flags: {},
        turn: character.turn,
        history: [],
        effectHistory: [],
      },
    });

    expect(result.newlyUnlocked).toContain("h100");
    expect(result.newlyUnlocked).not.toContain("health100");
  });
});

