import { delta, type EffectBundle } from "@/data/effects";
import type { CharacterVariables } from "@/data/character";
import { applyEffectsToCharacter } from "./variableManager";

export type SystemRuleResult = {
  readonly bundle: EffectBundle;
  readonly reason: string;
};

export function evaluateEndTurnRules(
  character: CharacterVariables,
): readonly SystemRuleResult[] {
  const out: SystemRuleResult[] = [];

  if (character.happiness < 30) {
    out.push({
      reason: "Bassa felicita riduce performance lavorativa.",
      bundle: [delta("career", -1)],
    });
  }

  if (character.skills >= 60) {
    out.push({
      reason: "Skill alte migliorano i guadagni.",
      bundle: [delta("money", 3)],
    });
  }

  if (character.relationships < 35) {
    out.push({
      reason: "Relazioni fragili impattano il benessere.",
      bundle: [delta("happiness", -1)],
    });
  }

  return out;
}

export function applyEndTurnRules(character: CharacterVariables): {
  character: CharacterVariables;
  appliedRules: readonly SystemRuleResult[];
} {
  const rules = evaluateEndTurnRules(character);
  const nextCharacter = rules.reduce((acc, rule) => {
    return applyEffectsToCharacter(acc, rule.bundle);
  }, character);
  return { character: nextCharacter, appliedRules: rules };
}

