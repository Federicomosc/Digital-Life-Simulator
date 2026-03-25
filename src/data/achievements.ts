import type { CharacterVariables } from "./character";
import type { TurnSnapshot } from "./history";

export type CharacterFlags = Record<string, boolean>;

export type AchievementFamily = "stat" | "behavioral" | "narrative" | "secret";

export type AchievementDefinition = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly family: AchievementFamily;
  readonly secret?: boolean;
  readonly check: (params: AchievementCheckParams) => boolean;
};

export type AchievementCheckParams = {
  readonly character: CharacterVariables;
  readonly archetypeId: string;
  readonly flags: CharacterFlags;
  readonly turn: number;
  readonly history: readonly TurnSnapshot[];
  readonly choiceIndex?: number;
  readonly effectHistory: readonly {
    source: string;
    effects: readonly { target: string; op: string; value: number }[];
  }[];
};

function countCareerNegativeChoiceImmediate(effectHistory: AchievementCheckParams["effectHistory"]): number {
  let c = 0;
  for (const entry of effectHistory) {
    if (entry.source !== "choice-immediate") continue;
    for (const eff of entry.effects) {
      if (eff.target === "career" && eff.op === "add" && eff.value < 0) {
        c += 1;
        break;
      }
    }
  }
  return c;
}

function countDelayedScheduled(effectHistory: AchievementCheckParams["effectHistory"]): number {
  let c = 0;
  for (const entry of effectHistory) {
    if (entry.source === "choice-delayed") c += 1;
  }
  return c;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "h100",
    label: "Serenità Totale",
    description: "Raggiungi felicità 100.",
    family: "stat",
    check: ({ character }) => character.happiness >= 100,
  },
  {
    id: "health100",
    label: "Indistruttibile",
    description: "Raggiungi salute 100.",
    family: "stat",
    check: ({ character }) => character.health >= 100,
  },
  {
    id: "skills80",
    label: "Maestro",
    description: "Competenze 80+.",
    family: "stat",
    check: ({ character }) => character.skills >= 80,
  },
  {
    id: "rich",
    label: "Fondo Ricco",
    description: "Accumula denaro 150+.",
    family: "stat",
    check: ({ character }) => character.money >= 150,
  },
  {
    id: "bonds80",
    label: "Legami Forti",
    description: "Relazioni 80+.",
    family: "stat",
    check: ({ character }) => character.relationships >= 80,
  },
  {
    id: "refuse_career_3",
    label: "Dubbio Professionale",
    description: "Rifiuta (negativamente) la carriera 3 volte.",
    family: "behavioral",
    check: (p) => countCareerNegativeChoiceImmediate(p.effectHistory) >= 3,
  },
  {
    id: "delayed_3",
    label: "Pianificatore",
    description: "Attiva almeno 3 effetti ritardati.",
    family: "behavioral",
    check: (p) => countDelayedScheduled(p.effectHistory) >= 3,
  },
  {
    id: "partner_story",
    label: "Storia di Cuore",
    description: "Attiva un percorso con partner (has_partner).",
    family: "narrative",
    check: (p) => p.flags.has_partner === true,
  },
  {
    id: "fired_rebound",
    label: "Ripartenza",
    description: "Dopo fired_from_job, ritrova stabilità emotiva (felicità >= 45).",
    family: "narrative",
    check: (p) => p.flags.fired_from_job === true && p.character.happiness >= 45,
  },
  {
    id: "balance_turn_15",
    label: "Equilibrio Lungo",
    description: "Dopo 15 turni, resta bilanciato (salute e felicità > 40).",
    family: "behavioral",
    check: (p) => p.turn >= 15 && p.character.health >= 40 && p.character.happiness >= 40,
  },

  // Secret achievements
  {
    id: "heart_adventurer",
    label: "Avventuriero del Cuore",
    description: "Con partner attivo, felicità 70+.",
    family: "secret",
    secret: true,
    check: (p) => p.flags.has_partner === true && p.character.happiness >= 70,
  },
  {
    id: "phoenix",
    label: "Phoenix del Lavoro",
    description: "Dopo fired_from_job, salute 70+.",
    family: "secret",
    secret: true,
    check: (p) => p.flags.fired_from_job === true && p.character.health >= 70,
  },
  {
    id: "craft_and_bonds",
    label: "Arte e Relazioni",
    description: "Artista con competenze 70+ e relazioni 60+.",
    family: "secret",
    secret: true,
    check: (p) =>
      p.archetypeId === "artist" && p.character.skills >= 70 && p.character.relationships >= 60,
  },
  {
    id: "quiet_genius",
    label: "Genio Silenzioso",
    description: "Competenze 85+ e relazioni sotto 35.",
    family: "secret",
    secret: true,
    check: (p) => p.character.skills >= 85 && p.character.relationships < 35,
  },
];

