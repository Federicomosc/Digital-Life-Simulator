import { create } from "zustand";
import { type CharacterVariableKey, type CharacterVariables, DEFAULT_CHARACTER_VARIABLES } from "@/data/character";
import { type EffectBundle } from "@/data/effects";
import {
  type DelayedEffect,
  applyDueDelayedEffects,
  applyEffectsToCharacter,
  clampVariableForKey,
  nextTurnValue,
} from "@/engine/variableManager";
import {
  getHardcodedEvent,
  resolveHardcodedChoice,
  type ChoiceId,
} from "@/engine/coreLoop";

export type GameStore = {
  /** Istantanea corrente delle variabili del personaggio (fonte di verità). */
  character: CharacterVariables;

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

export const useGameStore = create<GameStore>((set) => ({
  character: { ...DEFAULT_CHARACTER_VARIABLES },
  pendingEffects: [],

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
      const withNewTurn: CharacterVariables = { ...s.character, turn: newTurn };
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
      // 1) Lettura stato -> presentazione evento hardcoded (validazione scelta).
      const event = getHardcodedEvent(s.character);
      const isValidChoice = event.choices.some((c) => c.id === choiceId);
      if (!isValidChoice) return s;

      // 2) Risoluzione scelta -> effetti immediati e ritardati (rispetto al turno corrente).
      const outcome = resolveHardcodedChoice(choiceId);

      const immediateCharacter = applyEffectsToCharacter(
        s.character,
        outcome.immediate,
      );

      const newTurn = nextTurnValue(s.character.turn, 1);

      const delayed = outcome.delayed ?? [];
      const scheduled: DelayedEffect[] = delayed.map((d) => ({
        executeTurn: nextTurnValue(s.character.turn, d.delayTurns),
        bundle: d.bundle,
      }));

      // 3) Avanzamento turno -> applica anche tutto ciò che è "scaduto" (<= newTurn).
      const withNewTurn: CharacterVariables = { ...immediateCharacter, turn: newTurn };
      const applied = applyDueDelayedEffects({
        character: withNewTurn,
        pendingEffects: [...s.pendingEffects, ...scheduled],
        currentTurn: newTurn,
      });

      return {
        character: applied.character,
        pendingEffects: applied.pendingEffects,
      };
    }),

  resetCharacter: () =>
    set({ character: { ...DEFAULT_CHARACTER_VARIABLES }, pendingEffects: [] }),
}));
