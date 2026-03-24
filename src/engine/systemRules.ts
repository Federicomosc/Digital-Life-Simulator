import { delta, type EffectBundle } from "@/data/effects";
import type { CharacterVariables } from "@/data/character";
import { applyEffectsToCharacter } from "./variableManager";

export type SystemRuleResult = {
  readonly bundle: EffectBundle;
  readonly reason: string;
};

/**
 * Regole di fine turno (Fase 3: bilanciamento più morbido, sinergie leggere).
 */
export function evaluateEndTurnRules(
  character: CharacterVariables,
): readonly SystemRuleResult[] {
  const out: SystemRuleResult[] = [];

  if (character.happiness < 28) {
    out.push({
      reason: "Stress emotivo: rallenti leggermente in carriera.",
      bundle: [delta("career", -1)],
    });
  }

  if (character.happiness >= 65) {
    out.push({
      reason: "Buon umore: collaborazione più facile.",
      bundle: [delta("relationships", 1)],
    });
  }

  if (character.skills >= 55) {
    out.push({
      reason: "Competenze solide: piccoli extra da opportunità.",
      bundle: [delta("money", 2)],
    });
  }

  if (character.relationships < 34) {
    out.push({
      reason: "Relazioni in affanno: peso sul morale.",
      bundle: [delta("happiness", -1)],
    });
  }

  if (character.career >= 45 && character.health < 40) {
    out.push({
      reason: "Carriera intensa con salute bassa: rischio affaticamento.",
      bundle: [delta("happiness", -1), delta("health", -1)],
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
