/**
 * Variabili di stato del personaggio: tipi, chiavi e vincoli numerici.
 */

/** Statistiche su scala normalizzata 0–100 (inclusi). */
export const NORMALIZED_STAT_MIN = 0;
export const NORMALIZED_STAT_MAX = 100;

/** Denaro: intero non negativo (unità di gioco). */
export const MONEY_MIN = 0;

/**
 * Turno corrente: intero ≥ 1 (primo turno di gioco = 1).
 */
export const TURN_MIN = 1;

/**
 * Chiavi delle variabili esposte dal modello personaggio.
 * Ordine stabile utile per serializzazione o UI.
 */
export const CHARACTER_VARIABLE_KEYS = [
  "health",
  "happiness",
  "money",
  "career",
  "relationships",
  "skills",
  "turn",
] as const;

export type CharacterVariableKey = (typeof CHARACTER_VARIABLE_KEYS)[number];

/** Sottoinsieme con sola metrica normalizzata 0–100. */
export type NormalizedCharacterVariableKey = Exclude<
  CharacterVariableKey,
  "money" | "turn"
>;

export function isNormalizedCharacterVariableKey(
  key: CharacterVariableKey,
): key is NormalizedCharacterVariableKey {
  return key !== "money" && key !== "turn";
}

/**
 * Istantanea delle variabili del personaggio.
 * Salute, felicità, carriera, relazioni e competenze sono 0–100.
 * Denaro e turno seguono i vincoli dedicati.
 */
export interface CharacterVariables {
  readonly health: number;
  readonly happiness: number;
  readonly money: number;
  readonly career: number;
  readonly relationships: number;
  readonly skills: number;
  readonly turn: number;
}

export function clampNormalized(value: number): number {
  if (value < NORMALIZED_STAT_MIN) return NORMALIZED_STAT_MIN;
  if (value > NORMALIZED_STAT_MAX) return NORMALIZED_STAT_MAX;
  return value;
}

export function clampMoney(value: number): number {
  if (value < MONEY_MIN) return MONEY_MIN;
  return Math.floor(value);
}

export function clampTurn(value: number): number {
  const t = Math.floor(value);
  return t < TURN_MIN ? TURN_MIN : t;
}

/**
 * Valori iniziali di default per una nuova partita / personaggio.
 */
export const DEFAULT_CHARACTER_VARIABLES: CharacterVariables = {
  health: NORMALIZED_STAT_MAX,
  happiness: 50,
  money: 0,
  career: 10,
  relationships: 50,
  skills: 10,
  turn: TURN_MIN,
} as const;
