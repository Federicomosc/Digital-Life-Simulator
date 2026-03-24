import type { CharacterVariables } from "@/data/character";
import type { GameEventDefinition, EventCondition, StatCondition } from "@/data/events";

export type EventCooldownMap = Record<string, number>;

export function evaluateStatCondition(
  character: CharacterVariables,
  rule: StatCondition,
): boolean {
  const left = character[rule.stat];
  const right = rule.value;
  switch (rule.op) {
    case "gte":
      return left >= right;
    case "lte":
      return left <= right;
    case "gt":
      return left > right;
    case "lt":
      return left < right;
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    default: {
      const _exhaustive: never = rule.op;
      return _exhaustive;
    }
  }
}

export function evaluateEventCondition(params: {
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
  condition: EventCondition;
}): boolean {
  const { character, unlockedMilestones, condition } = params;
  if (condition.type === "stat") {
    return evaluateStatCondition(character, condition.rule);
  }
  if (condition.type === "milestone") {
    return unlockedMilestones.includes(condition.milestoneId);
  }
  const _exhaustive: never = condition;
  return _exhaustive;
}

function isInCooldown(eventId: string, currentTurn: number, cooldownTurns: number, map: EventCooldownMap): boolean {
  const lastTurn = map[eventId];
  if (lastTurn === undefined) return false;
  return currentTurn - lastTurn < cooldownTurns;
}

export function getEligibleEvents(params: {
  catalog: readonly GameEventDefinition[];
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
  cooldowns: EventCooldownMap;
}): GameEventDefinition[] {
  const { catalog, character, unlockedMilestones, cooldowns } = params;
  return catalog.filter((eventDef) => {
    if (isInCooldown(eventDef.id, character.turn, eventDef.cooldownTurns, cooldowns)) {
      return false;
    }

    const conditions = eventDef.conditions ?? [];
    return conditions.every((condition) =>
      evaluateEventCondition({ character, unlockedMilestones, condition }),
    );
  });
}

export function pickWeightedEvent(
  events: readonly GameEventDefinition[],
  rng: () => number,
): GameEventDefinition | null {
  if (events.length === 0) return null;
  const totalWeight = events.reduce((acc, e) => acc + Math.max(0, e.weight), 0);
  if (totalWeight <= 0) return events[0] ?? null;

  let roll = rng() * totalWeight;
  for (const eventDef of events) {
    roll -= Math.max(0, eventDef.weight);
    if (roll <= 0) return eventDef;
  }
  return events[events.length - 1] ?? null;
}

export function selectNextEvent(params: {
  catalog: readonly GameEventDefinition[];
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
  cooldowns: EventCooldownMap;
  fallbackEventId: string;
  rng?: () => number;
}): GameEventDefinition {
  const { catalog, character, unlockedMilestones, cooldowns, fallbackEventId } = params;
  const rng = params.rng ?? Math.random;
  const eligible = getEligibleEvents({
    catalog,
    character,
    unlockedMilestones,
    cooldowns,
  });

  const picked = pickWeightedEvent(eligible, rng);
  if (picked) return picked;

  const fallback = catalog.find((e) => e.id === fallbackEventId) ?? catalog[0];
  if (!fallback) {
    throw new Error("Event catalog is empty; at least one event is required.");
  }
  return fallback;
}

