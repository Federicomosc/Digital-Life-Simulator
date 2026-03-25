import type { CharacterVariables } from "./character";
import type { CharacterFlags } from "./achievements";
import type { ArchetypeId } from "./archetypes";
import type { TurnSnapshot } from "./history";
import { getArchetypeDefinition } from "./archetypes";

export type FinalDefinition = {
  readonly id: string;
  readonly label: string;
  readonly score: (params: FinalScoreParams) => number;
  readonly buildText: (params: FinalTextParams) => string;
};

export type FinalScoreParams = {
  readonly character: CharacterVariables;
  readonly archetypeId: ArchetypeId;
  readonly flags: CharacterFlags;
  readonly history: readonly TurnSnapshot[];
};

export type FinalTextParams = {
  readonly character: CharacterVariables;
  readonly archetypeId: ArchetypeId;
  readonly flags: CharacterFlags;
  readonly unlockedMilestonesCount: number;
};

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function activeFlagList(flags: CharacterFlags): string[] {
  return Object.keys(flags).filter((k) => flags[k]);
}

export const FINALS: readonly FinalDefinition[] = [
  {
    id: "career_solo",
    label: "Carriera brillante ma solitaria",
    score: ({ character }) => {
      let s = 0;
      s += character.career >= 80 ? 50 : character.career >= 60 ? 25 : 0;
      s += character.relationships < 30 ? 25 : character.relationships < 45 ? 10 : 0;
      s += character.happiness < 55 ? 10 : 0;
      return s;
    },
    buildText: ({ character, archetypeId, flags, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      const flagsList = activeFlagList(flags);
      return `Finale: ${a} raggiunge traguardi professionali importanti, ma la vita sociale resta ai margini.
Carriera: ${character.career}. Relazioni: ${character.relationships}. Felicità: ${character.happiness}.
Milestone sbloccate: ${unlockedMilestonesCount}.
Flag attivi: ${flagsList.length ? flagsList.join(", ") : "nessuno"}.`;
    },
  },
  {
    id: "serene_balance",
    label: "Vita serena e bilanciata",
    score: ({ character }) => {
      const stats = [
        character.health,
        character.happiness,
        character.career,
        character.relationships,
        character.skills,
        Math.min(100, character.money),
      ];
      const balanced = stats.every((v) => inRange(v, 45, 70));
      return balanced ? 70 : 20;
    },
    buildText: ({ character, archetypeId, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      return `Finale: ${a} ha tenuto il ritmo con equilibrio.
Salute: ${character.health}, Felicità: ${character.happiness}, Carriera: ${character.career}.
Milestone sbloccate: ${unlockedMilestonesCount}.
Un passo alla volta, senza estremi.`;
    },
  },
  {
    id: "artist_recognized",
    label: "Artista riconosciuto",
    score: ({ character, archetypeId }) => {
      let s = 0;
      if (archetypeId === "artist") s += 35;
      s += character.skills >= 70 ? 40 : character.skills >= 55 ? 20 : 0;
      s += character.relationships >= 60 ? 25 : 0;
      return s;
    },
    buildText: ({ character, archetypeId, flags, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      const flagsList = activeFlagList(flags);
      return `Finale: ${a} viene percepito come una presenza stabile e riconoscibile.
Competenze: ${character.skills}. Relazioni: ${character.relationships}. Felicità: ${character.happiness}.
Milestone sbloccate: ${unlockedMilestonesCount}.
Flag: ${flagsList.length ? flagsList.join(", ") : "—"}.`;
    },
  },
  {
    id: "burnout_restarting",
    label: "Burnout e ripartenza",
    score: ({ character, flags }) => {
      let s = 0;
      s += flags.fired_from_job ? 45 : 0;
      s += character.happiness >= 40 ? 15 : 0;
      s += character.health < 45 ? 20 : 0;
      s += character.career < 50 ? 10 : 0;
      return s;
    },
    buildText: ({ character, flags, archetypeId, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      return `Finale: ${a} ha attraversato un momento duro e ora riparte.
Salute: ${character.health}, Felicità: ${character.happiness}, Denaro: ${character.money}.
Milestone sbloccate: ${unlockedMilestonesCount}.
Flag chiave: ${flags.fired_from_job ? "fired_from_job" : "—"}.`;
    },
  },
  {
    id: "social_success",
    label: "Relazioni che reggono tutto",
    score: ({ character }) => {
      let s = 0;
      s += character.relationships >= 80 ? 50 : character.relationships >= 60 ? 25 : 0;
      s += character.happiness >= 60 ? 30 : character.happiness >= 45 ? 10 : 0;
      return s;
    },
    buildText: ({ character, archetypeId, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      return `Finale: ${a} costruisce una rete solida.
Relazioni: ${character.relationships}. Felicità: ${character.happiness}. Carriera: ${character.career}.
Milestone sbloccate: ${unlockedMilestonesCount}.`;
    },
  },
  {
    id: "rich_and_skillful",
    label: "Ricchezza e competenza",
    score: ({ character }) => {
      let s = 0;
      s += character.money >= 150 ? 45 : character.money >= 90 ? 25 : 0;
      s += character.skills >= 70 ? 35 : 10;
      s += character.career >= 55 ? 15 : 0;
      return s;
    },
    buildText: ({ character, archetypeId, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      return `Finale: ${a} ha trasformato strategia in risorse.
Denaro: ${character.money}. Competenze: ${character.skills}. Carriera: ${character.career}.
Milestone sbloccate: ${unlockedMilestonesCount}.`;
    },
  },
  {
    id: "partner_story",
    label: "Una storia che cambia il ritmo",
    score: ({ character, flags }) => {
      let s = 0;
      s += flags.has_partner ? 45 : 0;
      s += character.relationships >= 60 ? 25 : 0;
      s += character.happiness >= 45 ? 15 : 0;
      return s;
    },
    buildText: ({ character, flags, archetypeId, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      const flagsList = activeFlagList(flags);
      return `Finale: ${a} trova un nuovo equilibrio grazie a una relazione significativa.
Relazioni: ${character.relationships}. Felicità: ${character.happiness}.
Milestone sbloccate: ${unlockedMilestonesCount}.
Flag: ${flagsList.length ? flagsList.join(", ") : "—"}.`;
    },
  },
  {
    id: "late_growth",
    label: "Crescita tardiva (ma vera)",
    score: ({ character }) => {
      let s = 0;
      s += character.turn >= 25 ? 30 : 0;
      s += character.skills >= 60 ? 25 : 0;
      s += character.happiness >= 50 ? 20 : 0;
      s += character.career >= 45 ? 10 : 0;
      return s;
    },
    buildText: ({ character, archetypeId, unlockedMilestonesCount }) => {
      const a = getArchetypeDefinition(archetypeId).label;
      return `Finale: ${a} non ha spinto sempre, ma ha scelto di crescere davvero quando contava.
Turno finale: ${character.turn}. Felicità: ${character.happiness}. Competenze: ${character.skills}.
Milestone sbloccate: ${unlockedMilestonesCount}.`;
    },
  },
];

