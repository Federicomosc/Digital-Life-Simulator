/**
 * Modelli di dominio, tipi condivisi, costanti dati.
 */

export type EntityId = string;

export {
  CHARACTER_VARIABLE_KEYS,
  DEFAULT_CHARACTER_VARIABLES,
  MONEY_MIN,
  NORMALIZED_STAT_MAX,
  NORMALIZED_STAT_MIN,
  TURN_MIN,
  clampMoney,
  clampNormalized,
  clampTurn,
  isNormalizedCharacterVariableKey,
  type CharacterVariableKey,
  type CharacterVariables,
  type NormalizedCharacterVariableKey,
} from "./character";

export {
  applyEffectBundle,
  delta,
  deltas,
  type EffectBundle,
  type EffectOperation,
  type NumericStatEffect,
} from "./effects";
