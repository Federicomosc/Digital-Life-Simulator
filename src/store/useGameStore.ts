import { create } from "zustand";
import {
  type CharacterVariableKey,
  type CharacterVariables,
  DEFAULT_CHARACTER_VARIABLES,
  clampMoney,
  clampNormalized,
  clampTurn,
} from "@/data/character";
import { applyEffectBundle, type EffectBundle } from "@/data/effects";

function clampValueForKey(key: CharacterVariableKey, value: number): number {
  if (key === "money") return clampMoney(value);
  if (key === "turn") return clampTurn(value);
  return clampNormalized(value);
}

export type GameStore = {
  /** Istantanea corrente delle variabili del personaggio (fonte di verità). */
  character: CharacterVariables;

  /** Imposta una variabile al valore dato (con clamp per tipo). */
  updateVariable: (key: CharacterVariableKey, value: number) => void;

  /** Avanza il turno di `steps` (default 1), clamp ≥ TURN_MIN. */
  nextTurn: (steps?: number) => void;

  /** Applica un bundle di effetti (es. esito di una scelta). */
  applyEffects: (bundle: EffectBundle) => void;

  /** Ripristina i valori di default (nuova partita / debug). */
  resetCharacter: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  character: { ...DEFAULT_CHARACTER_VARIABLES },

  updateVariable: (key, value) =>
    set((s) => ({
      character: {
        ...s.character,
        [key]: clampValueForKey(key, value),
      },
    })),

  nextTurn: (steps = 1) =>
    set((s) => ({
      character: {
        ...s.character,
        turn: clampTurn(s.character.turn + steps),
      },
    })),

  applyEffects: (bundle) =>
    set((s) => ({
      character: applyEffectBundle(s.character, bundle),
    })),

  resetCharacter: () =>
    set({ character: { ...DEFAULT_CHARACTER_VARIABLES } }),
}));
