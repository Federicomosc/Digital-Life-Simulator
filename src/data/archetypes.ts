import type { CharacterVariables } from "./character";

export type ArchetypeId = "student" | "worker" | "artist";

export type ArchetypeDefinition = {
  readonly id: ArchetypeId;
  readonly label: string;
  readonly description: string;
  readonly initialCharacter: CharacterVariables;
};

export const ARCHETYPES: readonly ArchetypeDefinition[] = [
  {
    id: "student",
    label: "Studente",
    description: "Studia, accumula competenze e cerca opportunità sul lungo periodo.",
    initialCharacter: {
      health: 82,
      happiness: 55,
      money: 10,
      career: 12,
      relationships: 52,
      skills: 35,
      turn: 1,
    },
  },
  {
    id: "worker",
    label: "Lavoratore",
    description: "Spinge sulla carriera: guadagni rapidi, ma stress più frequente.",
    initialCharacter: {
      health: 72,
      happiness: 46,
      money: 22,
      career: 28,
      relationships: 45,
      skills: 20,
      turn: 1,
    },
  },
  {
    id: "artist",
    label: "Artista",
    description: "Cerca slanci emotivi: relazioni forti e creatività, con oscillazioni.",
    initialCharacter: {
      health: 78,
      happiness: 62,
      money: 6,
      career: 16,
      relationships: 58,
      skills: 44,
      turn: 1,
    },
  },
] as const;

export function getArchetypeDefinition(
  archetypeId: ArchetypeId,
): ArchetypeDefinition {
  return ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];
}

