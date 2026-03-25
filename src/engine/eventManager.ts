import type { CharacterVariables } from "@/data/character";
import type {
  EventCondition,
  GameEventDefinition,
  GameEventRequirements,
  StatCondition,
} from "@/data/events";

export type EventCooldownMap = Record<string, number>;
export type CharacterFlags = Record<string, boolean>;

function requirementsSatisfied(params: {
  character: CharacterVariables;
  archetypeId: string;
  flags: CharacterFlags;
  requirements?: GameEventRequirements;
}): boolean {
  const { character, archetypeId, flags, requirements } = params;
  if (!requirements) return true;

  const {
    minHealth,
    maxHealth,
    minMoney,
    archetype,
    flags: requiredFlags,
    minTurn,
    maxTurn,
  } = requirements;

  if (minTurn !== undefined && character.turn < minTurn) return false;
  if (maxTurn !== undefined && character.turn > maxTurn) return false;

  if (minHealth !== undefined && character.health < minHealth) return false;
  if (maxHealth !== undefined && character.health > maxHealth) return false;
  if (minMoney !== undefined && character.money < minMoney) return false;

  if (archetype && archetype.length > 0 && !archetype.includes(archetypeId)) {
    return false;
  }

  if (requiredFlags && requiredFlags.length > 0) {
    for (const f of requiredFlags) {
      if (!flags[f]) return false;
    }
  }

  return true;
}

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
  archetypeId: string;
  flags: CharacterFlags;
  unlockedMilestones: readonly string[];
  cooldowns: EventCooldownMap;
}): GameEventDefinition[] {
  const { catalog, character, archetypeId, flags, unlockedMilestones, cooldowns } =
    params;
  return catalog.filter((eventDef) => {
    if (isInCooldown(eventDef.id, character.turn, eventDef.cooldownTurns, cooldowns)) {
      return false;
    }

    if (
      !requirementsSatisfied({
        character,
        archetypeId,
        flags,
        requirements: eventDef.requirements,
      })
    ) {
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
  archetypeId: string;
  flags: CharacterFlags;
  unlockedMilestones: readonly string[];
  cooldowns: EventCooldownMap;
  fallbackEventId: string;
  rng?: () => number;
}): GameEventDefinition {
  const {
    catalog,
    character,
    archetypeId,
    flags,
    unlockedMilestones,
    cooldowns,
    fallbackEventId,
  } = params;
  const rng = params.rng ?? Math.random;

  const scriptedAtTurn = catalog.filter((e) => {
    const type = e.type ?? "random";
    return type === "scripted" && e.triggerTurn === character.turn;
  });

  const pool = scriptedAtTurn.length > 0 ? scriptedAtTurn : catalog;

  const eligible = getEligibleEvents({
    catalog: pool,
    character,
    archetypeId,
    flags,
    unlockedMilestones,
    cooldowns,
  });

  const picked = pickWeightedEvent(eligible, rng);
  if (picked) return picked;

  const fallback = pool.find((e) => e.id === fallbackEventId) ?? pool[0];
  if (!fallback) {
    throw new Error("Event catalog is empty; at least one event is required.");
  }
  return fallback;
}

