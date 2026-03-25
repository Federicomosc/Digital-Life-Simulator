import type { CharacterVariables } from "./character";

export type PlayerStats = Omit<CharacterVariables, "turn">;

export type TurnSnapshot = {
  readonly turn: number;
  readonly stats: PlayerStats;
  readonly eventId: string;
  readonly choiceIndex: number;
};

