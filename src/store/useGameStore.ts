import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistStorage, StorageValue } from "zustand/middleware/persist";
import { updateArchetypeAggregates } from "@/store/archetypeAggregates";
import {
  type CharacterVariableKey,
  type CharacterVariables,
} from "@/data/character";
import type { ArchetypeId } from "@/data/archetypes";
import { getArchetypeDefinition } from "@/data/archetypes";
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
import {
  selectNextEvent,
  type CharacterFlags,
  type EventCooldownMap,
} from "@/engine/eventManager";
import { computeUnlockedMilestones } from "@/engine/progressionManager";
import type { TurnSnapshot, PlayerStats } from "@/data/history";
import { ACHIEVEMENTS } from "@/data/achievements";
import { evaluateAchievements } from "@/engine/achievementsEngine";
import { selectFinal } from "@/engine/finalsEngine";
import {
  getActiveSlotStorageKey,
  ACTIVE_ARCHETYPE_KEY,
  ACTIVE_SLOT_KEY,
} from "@/store/slotStorage";

const STORAGE_VERSION = 5;
const FALLBACK_EVENT_ID = "starter-shift";
const MAX_HISTORY = 40;
const BASE_PERSIST_NAME = "digital-life-simulator-game";
const MAX_TURN_SNAPSHOTS = 500;
const MAX_GAME_TURNS = 30;

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

type PersistedStateV3 = {
  character: CharacterVariables;
  pendingEffects: DelayedEffect[];
  archetypeId: ArchetypeId;
  flags: CharacterFlags;
  currentEventId: string;
  eventCooldowns: EventCooldownMap;
  eventHistory: EventHistoryEntry[];
  effectHistory: EffectHistoryEntry[];
  unlockedMilestones: string[];
  saveVersion: number;
  history: TurnSnapshot[];
  gamePhase: "playing" | "ended";
  finalId: string | null;
  finalText: string | null;
  unlockedAchievements: string[];
};

type PersistedStateV1 = {
  character: CharacterVariables;
  pendingEffects: DelayedEffect[];
};

export type GameStore = {
  /** Istantanea corrente delle variabili del personaggio (fonte di verità). */
  character: CharacterVariables;
  archetypeId: ArchetypeId;
  flags: CharacterFlags;
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

  /** Rimuove il salvataggio LocalStorage e resetta la partita. */
  clearSave: () => void;

  /** Ultima azione (feedback accessibile; non persistito). */
  lastActionMessage: string | null;

  /** Versione “in-game” salvata nello stato (non solo quella del middleware). */
  saveVersion: number;

  /** Snapshot dello stato di gioco a fine turno (per grafici e analisi). */
  history: TurnSnapshot[];

  gamePhase: "playing" | "ended";
  finalId: string | null;
  finalText: string | null;

  unlockedAchievements: string[];
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
  archetypeId: ArchetypeId;
  flags: CharacterFlags;
}): string {
  return selectNextEvent({
    catalog: EVENT_CATALOG,
    character: params.character,
    unlockedMilestones: params.unlockedMilestones,
    cooldowns: params.eventCooldowns,
    fallbackEventId: FALLBACK_EVENT_ID,
    archetypeId: params.archetypeId,
    flags: params.flags,
  }).id;
}

function buildInitialState(): Pick<
  GameStore,
  | "character"
  | "pendingEffects"
  | "archetypeId"
  | "flags"
  | "currentEventId"
  | "eventCooldowns"
  | "eventHistory"
  | "effectHistory"
  | "unlockedMilestones"
  | "saveVersion"
  | "history"
  | "gamePhase"
  | "finalId"
  | "finalText"
  | "unlockedAchievements"
> {
  let archetypeId: ArchetypeId = "worker";
  try {
    const raw = localStorage.getItem(ACTIVE_ARCHETYPE_KEY) as ArchetypeId | null;
    if (raw === "student" || raw === "worker" || raw === "artist") {
      archetypeId = raw;
    }
  } catch {
    /* ignore */
  }
  const flags: CharacterFlags = {};
  const character = getArchetypeDefinition(archetypeId).initialCharacter;

  const unlockedMilestones = computeUnlockedMilestones({
    character,
    unlockedMilestones: [],
  });

  const currentEventId = pickNextEventId({
    character,
    unlockedMilestones,
    eventCooldowns: {},
    archetypeId,
    flags,
  });
  return {
    character: { ...character },
    pendingEffects: [],
    archetypeId,
    flags,
    currentEventId,
    eventCooldowns: {},
    eventHistory: [],
    effectHistory: [],
    unlockedMilestones,
    saveVersion: STORAGE_VERSION,
    history: [],
    gamePhase: "playing",
    finalId: null,
    finalText: null,
    unlockedAchievements: [],
  };
}

function statsFromCharacter(character: CharacterVariables): PlayerStats {
  return {
    health: character.health,
    happiness: character.happiness,
    money: character.money,
    career: character.career,
    relationships: character.relationships,
    skills: character.skills,
  };
}

function appendHistorySnapshot(
  list: TurnSnapshot[],
  item: TurnSnapshot,
): TurnSnapshot[] {
  return [...list, item].slice(-MAX_TURN_SNAPSHOTS);
}

const slotPersistStorage: PersistStorage<PersistedStateV3, void> = {
  getItem: (_name: string) => {
    void _name;
    const key = getActiveSlotStorageKey();
    if (!key) return null;

    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<PersistedStateV3>;
    } catch {
      return null;
    }
  },
  setItem: (_name: string, value: StorageValue<PersistedStateV3>) => {
    void _name;
    const key = getActiveSlotStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (_name: string) => {
    void _name;
    const key = getActiveSlotStorageKey();
    if (!key) return;
    localStorage.removeItem(key);
  },
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...buildInitialState(),
      lastActionMessage: null,

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
          if (s.gamePhase === "ended") return s;

          const currentEvent = getEventById(s.currentEventId);
          if (!currentEvent) return s;

          const choiceDef = currentEvent.choices.find((c) => c.id === choiceId);
          if (!choiceDef) return s;

          const outcome = resolveChoiceFromEvent({
            eventDef: currentEvent,
            choiceId,
            character: s.character,
            unlockedMilestones: s.unlockedMilestones,
          });
          if (!outcome) return s;

          // 2) Applica le variazioni permanenti di stato narrativo (flags) dalla scelta.
          const nextFlags: CharacterFlags = { ...s.flags };
          if (choiceDef.setsFlags) {
            for (const f of choiceDef.setsFlags) nextFlags[f] = true;
          }
          if (choiceDef.removesFlags) {
            for (const f of choiceDef.removesFlags) delete nextFlags[f];
          }

          const choiceLabel =
            currentEvent.choices.find((c) => c.id === choiceId)?.label ?? choiceId;

          const immediateCharacter = applyEffectsToCharacter(
            s.character,
            outcome.immediate,
          );
          const delayedEffects = mapDelayedEffects(outcome.delayed, s.character.turn);

          const timeCost = Math.max(1, Math.floor(choiceDef.timeCost ?? 1));
          const choiceIndex = currentEvent.choices.findIndex(
            (c) => c.id === choiceId,
          );

          let turn = s.character.turn;
          let character = immediateCharacter;
          let pendingEffects = [...s.pendingEffects, ...delayedEffects];
          let unlockedMilestones = s.unlockedMilestones;
          let history = s.history;
          let unlockedAchievements = s.unlockedAchievements;
          let gamePhase: "playing" | "ended" = s.gamePhase;
          let finalId: string | null = s.finalId;
          let finalText: string | null = s.finalText;

          let newlyUnlockedAchievementIds: string[] = [];

          // Effect history (immediate e delayed) registrata a fine scelta.
          let effectHistory: EffectHistoryEntry[] = appendHistory(
            s.effectHistory,
            {
            turn: turn + timeCost,
            source: "choice-immediate" as const,
            description: `${currentEvent.id}/${choiceId}`,
            effects: outcome.immediate,
            },
          );

          if (delayedEffects.length > 0) {
            for (const delayed of delayedEffects) {
              effectHistory = appendHistory(effectHistory, {
                turn: delayed.executeTurn,
                source: "choice-delayed" as const,
                description: `${currentEvent.id}/${choiceId}`,
                effects: delayed.bundle,
              });
            }
          }

          for (let step = 0; step < timeCost; step += 1) {
            turn = nextTurnValue(turn, 1);
            character = { ...character, turn };

            const withDelayed = applyDueDelayedEffects({
              character,
              pendingEffects,
              currentTurn: turn,
            });

            pendingEffects = withDelayed.pendingEffects;

            const rulesResult = applyEndTurnRules(withDelayed.character);
            character = rulesResult.character;

            // System rule history per ogni fine turno.
            for (const rule of rulesResult.appliedRules) {
              effectHistory = appendHistory(effectHistory, {
                turn,
                source: "system-rule" as const,
                description: rule.reason,
                effects: rule.bundle,
              });
            }

            unlockedMilestones = computeUnlockedMilestones({
              character,
              unlockedMilestones,
            });

            history = appendHistorySnapshot(history, {
              turn,
              stats: statsFromCharacter(character),
              eventId: currentEvent.id,
              choiceIndex: choiceIndex < 0 ? 0 : choiceIndex,
            });

            const mappedEffectHistory = effectHistory.map((e) => ({
              source: e.source,
              effects: e.effects.map((eff) => ({
                target: eff.target,
                op: eff.op,
                value: eff.value,
              })),
            }));

            const achievementResult = evaluateAchievements({
              achievements: ACHIEVEMENTS,
              alreadyUnlocked: unlockedAchievements,
              state: {
                character,
                archetypeId: s.archetypeId,
                flags: nextFlags,
                turn,
                history,
                effectHistory: mappedEffectHistory,
              },
            });

            if (achievementResult.newlyUnlocked.length > 0) {
              unlockedAchievements = [
                ...unlockedAchievements,
                ...achievementResult.newlyUnlocked,
              ];
              newlyUnlockedAchievementIds = [
                ...newlyUnlockedAchievementIds,
                ...achievementResult.newlyUnlocked,
              ];
            }

            // Condizione epilogo: termina la partita a un limite di turni o se il personaggio si “rompe”.
            if (turn >= MAX_GAME_TURNS || character.health <= 0) {
              gamePhase = "ended";
              const final = selectFinal({
                character,
                archetypeId: s.archetypeId,
                flags: nextFlags,
                history,
                unlockedMilestonesCount: unlockedMilestones.length,
              });
              finalId = final.id;
              finalText = final.text;

              // Aggiorna le medie globali “per archetipo” (usate dalla dashboard).
              updateArchetypeAggregates({
                archetypeId: s.archetypeId,
                finalStats: statsFromCharacter(character),
              });
              break;
            }
          }

          const eventCooldowns: EventCooldownMap = {
            ...s.eventCooldowns,
            [currentEvent.id]: turn,
          };

          // Event selection solo se la partita continua.
          const nextEventId =
            gamePhase === "ended"
              ? s.currentEventId
              : choiceDef.nextEventId ??
                pickNextEventId({
                  character,
                  unlockedMilestones,
                  eventCooldowns,
                  flags: nextFlags,
                  archetypeId: s.archetypeId,
                });

          const eventHistory = appendHistory(s.eventHistory, {
            turn,
            eventId: currentEvent.id,
            choiceId,
          });

          return {
            character,
            archetypeId: s.archetypeId,
            flags: nextFlags,
            pendingEffects,
            currentEventId: nextEventId,
            eventCooldowns,
            eventHistory,
            effectHistory,
            unlockedMilestones,
            history,
            gamePhase,
            finalId,
            finalText,
            unlockedAchievements,
            lastActionMessage:
              gamePhase === "ended"
                ? `Finale sbloccato: ${finalId ?? "—"}.`
                : `Turno ${turn}: scelta «${choiceLabel}». Prossimo evento in arrivo.${
                    newlyUnlockedAchievementIds.length > 0
                      ? ` Achievement: ${newlyUnlockedAchievementIds.join(", ")}.`
                      : ""
                  }`,
          };
        }),

      resetCharacter: () =>
        set(() => ({ ...buildInitialState(), lastActionMessage: null })),

      clearSave: () => {
        try {
          const activeKey = getActiveSlotStorageKey();
          if (activeKey) localStorage.removeItem(activeKey);
          localStorage.removeItem(ACTIVE_SLOT_KEY);
        } catch {
          /* storage non disponibile */
        }
        set(() => ({ ...buildInitialState(), lastActionMessage: null }));
      },
    }),
    {
      name: BASE_PERSIST_NAME,
      version: STORAGE_VERSION,
      storage: slotPersistStorage,
      migrate: (persistedState: unknown, _version: number) => {
        void _version;
        const current = persistedState as Partial<PersistedStateV3> &
          Partial<PersistedStateV1>;
        const seed = buildInitialState();
        return {
          character: current.character ?? seed.character,
          pendingEffects: current.pendingEffects ?? seed.pendingEffects,
          archetypeId: (current as Partial<PersistedStateV3>).archetypeId ?? seed.archetypeId,
          flags: (current as Partial<PersistedStateV3>).flags ?? seed.flags,
          currentEventId: current.currentEventId ?? seed.currentEventId,
          eventCooldowns: current.eventCooldowns ?? seed.eventCooldowns,
          eventHistory: current.eventHistory ?? seed.eventHistory,
          effectHistory: current.effectHistory ?? seed.effectHistory,
          unlockedMilestones:
            current.unlockedMilestones ?? seed.unlockedMilestones,
          saveVersion: current.saveVersion ?? seed.saveVersion,
          history: (current as Partial<PersistedStateV3>).history ?? seed.history,
          gamePhase:
            (current as Partial<PersistedStateV3>).gamePhase ?? "playing",
          finalId: (current as Partial<PersistedStateV3>).finalId ?? null,
          finalText: (current as Partial<PersistedStateV3>).finalText ?? null,
          unlockedAchievements:
            (current as Partial<PersistedStateV3>).unlockedAchievements ??
            seed.unlockedAchievements,
        } satisfies PersistedStateV3;
      },
      partialize: (state) => ({
        character: state.character,
        pendingEffects: state.pendingEffects,
        archetypeId: state.archetypeId,
        flags: state.flags,
        currentEventId: state.currentEventId,
        eventCooldowns: state.eventCooldowns,
        eventHistory: state.eventHistory,
        effectHistory: state.effectHistory,
        unlockedMilestones: state.unlockedMilestones,
        saveVersion: state.saveVersion,
        history: state.history,
        gamePhase: state.gamePhase,
        finalId: state.finalId,
        finalText: state.finalText,
        unlockedAchievements: state.unlockedAchievements,
      }),
    },
  ),
);
