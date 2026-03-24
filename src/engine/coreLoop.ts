import type { CharacterVariables } from "@/data/character";
import { delta, type EffectBundle } from "@/data/effects";

export type ChoiceId = "study" | "train" | "rest";

export type GameChoice = {
  readonly id: ChoiceId;
  readonly label: string;
};

export type GameEvent = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly choices: readonly GameChoice[];
};

export function getHardcodedEvent(character: CharacterVariables): GameEvent {
  // Evento totalmente hardcoded, ma dipende dal turno solo per rendere visibile il loop.
  if (character.turn <= 1) {
    return {
      id: "event-1",
      title: "Primo giorno",
      description:
        "Scegli come impiegare la giornata. Le variabili cambieranno e poi si avanza il turno.",
      choices: [
        { id: "study", label: "Studia (carriera + soldi)" },
        { id: "train", label: "Allenati (salute adesso, felicità dopo)" },
        { id: "rest", label: "Riposa (felicità e salute, carriera giù)" },
      ],
    };
  }

  return {
    id: "event-others",
    title: "Giornata in corso",
    description:
      "Stesso meccanismo: evento -> scelta -> effetti -> avanzamento turno.",
    choices: [
      { id: "study", label: "Studia (carriera + soldi)" },
      { id: "train", label: "Allenati (salute adesso, felicità dopo)" },
      { id: "rest", label: "Riposa (felicità e salute, carriera giù)" },
    ],
  };
}

export function resolveHardcodedChoice(choiceId: ChoiceId): {
  readonly immediate: EffectBundle;
  readonly delayed?: readonly { readonly bundle: EffectBundle; readonly delayTurns: number }[];
} {
  switch (choiceId) {
    case "study":
      return {
        immediate: [
          delta("money", 10),
          delta("career", 2),
          delta("happiness", -1),
        ],
      };
    case "train":
      return {
        immediate: [
          delta("health", 5),
          delta("happiness", -2),
          delta("money", -3),
        ],
        delayed: [
          {
            bundle: [delta("happiness", 2)],
            // Nel core loop la scelta include già l'avanzamento turno:
            // con delayTurns=2 l'effetto diventa visibile al giocatore su un ciclo successivo.
            delayTurns: 2,
          },
        ],
      };
    case "rest":
      return {
        immediate: [
          delta("happiness", 4),
          delta("health", 3),
          delta("career", -1),
          delta("money", -2),
        ],
      };
    default: {
      const _exhaustive: never = choiceId;
      return _exhaustive;
    }
  }
}

