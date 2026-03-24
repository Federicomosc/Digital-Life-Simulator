import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type CharacterVariableKey,
  type CharacterVariables,
  DEFAULT_CHARACTER_VARIABLES,
} from "@/data/character";
import { EVENT_CATALOG } from "@/data/events.seed";
import { type EffectBundle } from "@/data/effects";
import type { DelayedEffectDefinition } from "@/data/events";
import {
  type DelayedEffect,
  applyDueDelayedEffects,
  applyEffectsToCharacter,
  clampVariableForKey,
  nextTurnValue,
} from "@/engine/variableManager";
import {
  resolveChoiceFromEvent,
  type ChoiceId,
} from "@/engine/coreLoop";
import { applyEndTurnRules } from "@/engine/systemRules";
import { selectNextEvent, type EventCooldownMap } from "@/engine/eventManager";
import { computeUnlockedMilestones } from "@/engine/progressionManager";

const STORAGE_VERSION = 2;
const FALLBACK_EVENT_ID = "starter-shift";
const MAX_HISTORY = 40;

type EventHistoryEntry = {
  readonly turn: number;
  readonly eventId: string;
  readonly choiceId: string;
};

type EffectHistoryEntry = {
  readonly turn: number;
  readonly source: "choice-immediate" | "choice-delayed" | "system-rule";
  readonly description: string;
  readonly effects: EffectBundle;
};

type PersistedStateV2 = {
  character: CharacterVariables;
  pendingEffects: DelayedEffect[];
  currentEventId: string;
  eventCooldowns: EventCooldownMap;
  eventHistory: EventHistoryEntry[];
  effectHistory: EffectHistoryEntry[];
  unlockedMilestones: string[];
};

type PersistedStateV1 = {
  character: CharacterVariables;
  pendingEffects: DelayedEffect[];
};

export type GameStore = {
  /** Istantanea corrente delle variabili del personaggio (fonte di verità). */
  character: CharacterVariables;
  currentEventId: string;
  eventCooldowns: EventCooldownMap;
  eventHistory: EventHistoryEntry[];
  effectHistory: EffectHistoryEntry[];
  unlockedMilestones: string[];

  /** Imposta una variabile al valore dato (con clamp per tipo). */
  updateVariable: (key: CharacterVariableKey, value: number) => void;

  /** Avanza il turno di `steps` (default 1), clamp ≥ TURN_MIN. */
  nextTurn: (steps?: number) => void;

  /** Applica un bundle di effetti (es. esito di una scelta). */
  applyEffects: (bundle: EffectBundle) => void;

  /** Pianifica l'applicazione di un bundle su un turno futuro. */
  scheduleEffects: (bundle: EffectBundle, delayTurns?: number) => void;

  /** Coda interna di effetti ritardati (da applicare quando il turno raggiunge `executeTurn`). */
  pendingEffects: DelayedEffect[];

  /** Gestisce il core loop: risolve la scelta, applica effetti, e poi avanza il turno. */
  choose: (choiceId: ChoiceId) => void;

  /** Ripristina i valori di default (nuova partita / debug). */
  resetCharacter: () => void;
};

function appendHistory<T>(list: T[], item: T): T[] {
  return [...list, item].slice(-MAX_HISTORY);
}

function mapDelayedEffects(
  delayed: readonly DelayedEffectDefinition[],
  fromTurn: number,
): DelayedEffect[] {
  return delayed.map((d) => ({
    executeTurn: nextTurnValue(fromTurn, d.delayTurns),
    bundle: d.bundle,
  }));
}

function getEventById(eventId: string) {
  return EVENT_CATALOG.find((e) => e.id === eventId) ?? null;
}

function pickNextEventId(params: {
  character: CharacterVariables;
  unlockedMilestones: readonly string[];
  eventCooldowns: EventCooldownMap;
}): string {
  return selectNextEvent({
    catalog: EVENT_CATALOG,
    character: params.character,
    unlockedMilestones: params.unlockedMilestones,
    cooldowns: params.eventCooldowns,
    fallbackEventId: FALLBACK_EVENT_ID,
  }).id;
}

function buildInitialState(): Pick<
  GameStore,
  | "character"
  | "pendingEffects"
  | "currentEventId"
  | "eventCooldowns"
  | "eventHistory"
  | "effectHistory"
  | "unlockedMilestones"
> {
  const unlockedMilestones = computeUnlockedMilestones({
    character: DEFAULT_CHARACTER_VARIABLES,
    unlockedMilestones: [],
  });
  const currentEventId = pickNextEventId({
    character: DEFAULT_CHARACTER_VARIABLES,
    unlockedMilestones,
    eventCooldowns: {},
  });
  return {
    character: { ...DEFAULT_CHARACTER_VARIABLES },
    pendingEffects: [],
    currentEventId,
    eventCooldowns: {},
    eventHistory: [],
    effectHistory: [],
    unlockedMilestones,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...buildInitialState(),

      updateVariable: (key, value) =>
        set((s) => ({
          character: {
            ...s.character,
            [key]: clampVariableForKey(key, value),
          },
        })),

      nextTurn: (steps = 1) =>
        set((s) => {
          // Calcola il nuovo turno e poi applica gli effetti ritardati “scaduti”.
          const newTurn = nextTurnValue(s.character.turn, steps);
          const withNewTurn: CharacterVariables = {
            ...s.character,
            turn: newTurn,
          };
          const applied = applyDueDelayedEffects({
            character: withNewTurn,
            pendingEffects: s.pendingEffects,
            currentTurn: newTurn,
          });

          return {
            character: applied.character,
            pendingEffects: applied.pendingEffects,
          };
        }),

      applyEffects: (bundle) =>
        set((s) => ({
          character: applyEffectsToCharacter(s.character, bundle),
        })),

      scheduleEffects: (bundle, delayTurns = 1) =>
        set((s) => {
          const delay = Math.max(0, Math.floor(delayTurns));
          const executeTurn = nextTurnValue(s.character.turn, delay);

          // Nota: non assumiamo nulla sull'ordine di applicazione quando executeTurn coincide,
          // ma manteniamo stabilmente l'ordine di insertion.
          const pendingEffects = [
            ...s.pendingEffects,
            {
              executeTurn,
              bundle,
            } satisfies DelayedEffect,
          ];

          return { pendingEffects };
        }),

      choose: (choiceId) =>
        set((s) => {
          const currentEvent = getEventById(s.currentEventId);
          if (!currentEvent) return s;

          const outcome = resolveChoiceFromEvent({
            eventDef: currentEvent,
            choiceId,
            character: s.character,
            unlockedMilestones: s.unlockedMilestones,
          });
          if (!outcome) return s;

          const immediateCharacter = applyEffectsToCharacter(
            s.character,
            outcome.immediate,
          );
          const delayedEffects = mapDelayedEffects(outcome.delayed, s.character.turn);

          const newTurn = nextTurnValue(s.character.turn, 1);
          const withNewTurn: CharacterVariables = {
            ...immediateCharacter,
            turn: newTurn,
          };

          const withDelayed = applyDueDelayedEffects({
            character: withNewTurn,
            pendingEffects: [...s.pendingEffects, ...delayedEffects],
            currentTurn: newTurn,
          });

          const rulesResult = applyEndTurnRules(withDelayed.character);
          const characterAfterRules = rulesResult.character;

          const unlockedMilestones = computeUnlockedMilestones({
            character: characterAfterRules,
            unlockedMilestones: s.unlockedMilestones,
          });

          const eventCooldowns: EventCooldownMap = {
            ...s.eventCooldowns,
            [currentEvent.id]: newTurn,
          };

          const nextEventId = pickNextEventId({
            character: characterAfterRules,
            unlockedMilestones,
            eventCooldowns,
          });

          let effectHistory = appendHistory(s.effectHistory, {
            turn: newTurn,
            source: "choice-immediate",
            description: `${currentEvent.id}/${choiceId}`,
            effects: outcome.immediate,
          });

          if (delayedEffects.length > 0) {
            for (const delayed of delayedEffects) {
              effectHistory = appendHistory(effectHistory, {
                turn: delayed.executeTurn,
                source: "choice-delayed",
                description: `${currentEvent.id}/${choiceId}`,
                effects: delayed.bundle,
              });
            }
          }

          for (const rule of rulesResult.appliedRules) {
            effectHistory = appendHistory(effectHistory, {
              turn: newTurn,
              source: "system-rule",
              description: rule.reason,
              effects: rule.bundle,
            });
          }

          const eventHistory = appendHistory(s.eventHistory, {
            turn: newTurn,
            eventId: currentEvent.id,
            choiceId,
          });

          return {
            character: characterAfterRules,
            pendingEffects: withDelayed.pendingEffects,
            currentEventId: nextEventId,
            eventCooldowns,
            eventHistory,
            effectHistory,
            unlockedMilestones,
          };
        }),

      resetCharacter: () =>
        set(() => buildInitialState()),
    }),
    {
      name: "digital-life-simulator-game",
      version: STORAGE_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        const current = persistedState as Partial<PersistedStateV2> &
          Partial<PersistedStateV1>;

        if (version < 2) {
          const seed = buildInitialState();
          const character = current.character ?? seed.character;
          const pendingEffects = current.pendingEffects ?? seed.pendingEffects;
          const unlockedMilestones = computeUnlockedMilestones({
            character,
            unlockedMilestones: [],
          });
          const currentEventId = pickNextEventId({
            character,
            unlockedMilestones,
            eventCooldowns: {},
          });
          const upgraded: PersistedStateV2 = {
            character,
            pendingEffects,
            currentEventId,
            eventCooldowns: {},
            eventHistory: [],
            effectHistory: [],
            unlockedMilestones,
          };
          return upgraded;
        }

        const seed = buildInitialState();
        return {
          character: current.character ?? seed.character,
          pendingEffects: current.pendingEffects ?? seed.pendingEffects,
          currentEventId: current.currentEventId ?? seed.currentEventId,
          eventCooldowns: current.eventCooldowns ?? seed.eventCooldowns,
          eventHistory: current.eventHistory ?? seed.eventHistory,
          effectHistory: current.effectHistory ?? seed.effectHistory,
          unlockedMilestones: current.unlockedMilestones ?? seed.unlockedMilestones,
        } satisfies PersistedStateV2;
      },
      partialize: (state) => ({
        character: state.character,
        pendingEffects: state.pendingEffects,
        currentEventId: state.currentEventId,
        eventCooldowns: state.eventCooldowns,
        eventHistory: state.eventHistory,
        effectHistory: state.effectHistory,
        unlockedMilestones: state.unlockedMilestones,
      }),
    },
  ),
);
