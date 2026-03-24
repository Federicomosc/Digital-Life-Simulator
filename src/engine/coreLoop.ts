import type { CharacterVariables } from "@/data/character";
import { delta, type EffectBundle } from "@/data/effects";
import type {
  DelayedEffectDefinition,
  EventChoiceDefinition,
  EventCondition,
  GameEventDefinition,
  ScaledEffectDefinition,
} from "@/data/events";
import { evaluateEventCondition } from "./eventManager";

export type ChoiceId = string;

export type ResolvedChoiceOutcome = {
  readonly immediate: EffectBundle;
  readonly delayed: readonly DelayedEffectDefinition[];
  readonly debugNotes: readonly string[];
};

function applyScaledEffects(
  character: CharacterVariables,
  scaled: readonly ScaledEffectDefinition[] | undefined,
): EffectBundle {
  if (!scaled || scaled.length === 0) return [];
  return scaled.map((s) => {
    const multiplier = character[s.scaleBy] / 100;
    const amount = Math.round(s.base + s.factor * 100 * multiplier);
    return delta(s.target, amount);
  });
}

function applyConditionalEffects(params: {
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
  conditional: readonly { when: EventCondition; bundle: EffectBundle }[] | undefined;
  debugNotes: string[];
}): EffectBundle {
  const { character, unlockedMilestones, conditional, debugNotes } = params;
  if (!conditional || conditional.length === 0) return [];

  const bundles: EffectBundle[] = [];
  for (const c of conditional) {
    const ok = evaluateEventCondition({
      character,
      unlockedMilestones,
      condition: c.when,
    });
    if (ok) {
      bundles.push(c.bundle);
      debugNotes.push("Conditional effect applied.");
    }
  }
  return bundles.flat();
}

export function getEventChoice(
  eventDef: GameEventDefinition,
  choiceId: ChoiceId,
): EventChoiceDefinition | null {
  return eventDef.choices.find((c) => c.id === choiceId) ?? null;
}

export function resolveChoiceFromEvent(params: {
  eventDef: GameEventDefinition;
  choiceId: ChoiceId;
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
}): ResolvedChoiceOutcome | null {
  const { eventDef, choiceId, character, unlockedMilestones } = params;
  const choice = getEventChoice(eventDef, choiceId);
  if (!choice) return null;

  const debugNotes: string[] = [];
  const scaledBundle = applyScaledEffects(character, choice.scaled);
  if (scaledBundle.length > 0) debugNotes.push("Scaled effect applied.");

  const conditionalBundle = applyConditionalEffects({
    character,
    unlockedMilestones,
    conditional: choice.conditional,
    debugNotes,
  });

  return {
    immediate: [...choice.immediate, ...scaledBundle, ...conditionalBundle],
    delayed: choice.delayed ?? [],
    debugNotes,
  };
}

