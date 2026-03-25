import { describe, expect, it } from "vitest";
import { selectFinal } from "@/engine/finalsEngine";
import type { CharacterVariables } from "@/data/character";

describe("finalsEngine", () => {
  it("selectFinal picks the best-scoring final", () => {
    const character: CharacterVariables = {
      health: 60,
      happiness: 50,
      money: 40,
      career: 90,
      relationships: 20,
      skills: 40,
      turn: 10,
    };

    const result = selectFinal({
      character,
      archetypeId: "worker",
      flags: {},
      history: [],
      unlockedMilestonesCount: 3,
    });

    expect(result.id).toBe("career_solo");
    expect(result.text).toContain("Carriera");
  });
});

