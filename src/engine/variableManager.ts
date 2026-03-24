import {
  type CharacterVariableKey,
  type CharacterVariables,
  clampMoney,
  clampNormalized,
  clampTurn,
  isNormalizedCharacterVariableKey,
} from "@/data/character";
import { applyEffectBundle, type EffectBundle } from "@/data/effects";

export type DelayedEffect = {
  /** Turno in cui il bundle deve essere applicato (inclusivo). */
  readonly executeTurn: number;
  readonly bundle: EffectBundle;
};

export function clampVariableForKey(
  key: CharacterVariableKey,
  value: number,
): number {
  if (key === "money") return clampMoney(value);
  if (key === "turn") return clampTurn(value);
  if (isNormalizedCharacterVariableKey(key)) return clampNormalized(value);
  const _exhaustive: never = key;
  return _exhaustive;
}

export function applyEffectsToCharacter(
  character: CharacterVariables,
  bundle: EffectBundle,
): CharacterVariables {
  return applyEffectBundle(character, bundle);
}

export function nextTurnValue(currentTurn: number, steps = 1): number {
  return clampTurn(currentTurn + steps);
}

export function applyDueDelayedEffects(params: {
  character: CharacterVariables;
  pendingEffects: readonly DelayedEffect[];
  currentTurn: number;
}): { character: CharacterVariables; pendingEffects: DelayedEffect[] } {
  const { character, pendingEffects, currentTurn } = params;

  // Applica tutto ciò che è “scaduto” (<= currentTurn), supportando passi > 1.
  const due = pendingEffects.filter((e) => e.executeTurn <= currentTurn);
  const remaining = pendingEffects.filter((e) => e.executeTurn > currentTurn);

  const nextCharacter = due.reduce((acc, e) => {
    return applyEffectsToCharacter(acc, e.bundle);
  }, character);

  return { character: nextCharacter, pendingEffects: remaining };
}

