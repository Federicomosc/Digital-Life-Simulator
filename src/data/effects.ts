import {
  type CharacterVariableKey,
  type CharacterVariables,
  clampMoney,
  clampNormalized,
  clampTurn,
  isNormalizedCharacterVariableKey,
} from "./character";

/**
 * Operazione numerica su una variabile del personaggio.
 * - `add`: somma algebrica (es. +10 salute, -5 felicità).
 * - `set`: assegnazione assoluta (poi clamp in base al tipo di variabile).
 * - `multiply`: moltiplicatore (es. 1.1 = +10%, 0.9 = -10%).
 */
export type EffectOperation = "add" | "set" | "multiply";

/**
 * Singolo effetto: modifica una variabile con un'operazione e un valore numerico.
 */
export interface NumericStatEffect {
  readonly target: CharacterVariableKey;
  readonly op: EffectOperation;
  /** Per `add`/`set`: incremento o nuovo valore. Per `multiply`: fattore moltiplicativo. */
  readonly value: number;
}

/**
 * Insieme ordinato di effetti (es. esito di una scelta che tocca più variabili).
 * L'ordine conta quando si combinano più operazioni sulla stessa variabile.
 */
export type EffectBundle = readonly NumericStatEffect[];

function applyOne(
  state: CharacterVariables,
  effect: NumericStatEffect,
): CharacterVariables {
  const { target, op, value } = effect;
  const current = state[target];

  let next: number;
  switch (op) {
    case "add":
      next = current + value;
      break;
    case "set":
      next = value;
      break;
    case "multiply":
      next = current * value;
      break;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }

  if (target === "money") {
    next = clampMoney(next);
  } else if (target === "turn") {
    next = clampTurn(next);
  } else if (isNormalizedCharacterVariableKey(target)) {
    next = clampNormalized(next);
  }

  return { ...state, [target]: next };
}

/**
 * Applica una sequenza di effetti allo stato, con clamp per variabile.
 */
export function applyEffectBundle(
  state: CharacterVariables,
  bundle: EffectBundle,
): CharacterVariables {
  return bundle.reduce(applyOne, state);
}

/** Costruisce un effetto additivo (caso più comune per le scelte). */
export function delta(
  target: CharacterVariableKey,
  amount: number,
): NumericStatEffect {
  return { target, op: "add", value: amount };
}

/** Più delta in un bundle. */
export function deltas(
  pairs: ReadonlyArray<readonly [CharacterVariableKey, number]>,
): EffectBundle {
  return pairs.map(([target, amount]) => delta(target, amount));
}
