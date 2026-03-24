import type { CharacterVariableKey } from "./character";
import type { EffectBundle } from "./effects";

export type ConditionOperator = "gte" | "lte" | "gt" | "lt" | "eq" | "neq";

export type StatCondition = {
  readonly stat: CharacterVariableKey;
  readonly op: ConditionOperator;
  readonly value: number;
};

export type EventCondition =
  | { readonly type: "stat"; readonly rule: StatCondition }
  | { readonly type: "milestone"; readonly milestoneId: string };

export type ScaledEffectDefinition = {
  readonly target: CharacterVariableKey;
  readonly base: number;
  readonly scaleBy: CharacterVariableKey;
  readonly factor: number;
};

export type ConditionalEffectDefinition = {
  readonly when: EventCondition;
  readonly bundle: EffectBundle;
};

export type DelayedEffectDefinition = {
  readonly delayTurns: number;
  readonly bundle: EffectBundle;
};

export type EventChoiceDefinition = {
  readonly id: string;
  readonly label: string;
  readonly immediate: EffectBundle;
  readonly delayed?: readonly DelayedEffectDefinition[];
  readonly conditional?: readonly ConditionalEffectDefinition[];
  readonly scaled?: readonly ScaledEffectDefinition[];
};

export type GameEventDefinition = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tags?: readonly string[];
  readonly weight: number;
  readonly cooldownTurns: number;
  readonly conditions?: readonly EventCondition[];
  readonly choices: readonly EventChoiceDefinition[];
};

