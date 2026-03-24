import type { EventCondition } from "./events";

export type MilestoneDefinition = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly conditions: readonly EventCondition[];
};

export const MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: "career-junior-plus",
    label: "Junior+",
    description: "Hai superato la fase iniziale in carriera.",
    conditions: [{ type: "stat", rule: { stat: "career", op: "gte", value: 25 } }],
  },
  {
    id: "skills-solid",
    label: "Competenze solide",
    description: "Hai costruito una base tecnica affidabile.",
    conditions: [{ type: "stat", rule: { stat: "skills", op: "gte", value: 40 } }],
  },
  {
    id: "social-stable",
    label: "Rete stabile",
    description: "Relazioni abbastanza positive e consistenti.",
    conditions: [{ type: "stat", rule: { stat: "relationships", op: "gte", value: 60 } }],
  },
  {
    id: "career-veteran",
    label: "Veterano",
    description: "Carriera consolidata.",
    conditions: [{ type: "stat", rule: { stat: "career", op: "gte", value: 50 } }],
  },
  {
    id: "skills-expert",
    label: "Esperto",
    description: "Competenze di alto livello.",
    conditions: [{ type: "stat", rule: { stat: "skills", op: "gte", value: 65 } }],
  },
  {
    id: "nest-egg",
    label: "Cuscinetto",
    description: "Hai messo da parte abbastanza risorse.",
    conditions: [{ type: "stat", rule: { stat: "money", op: "gte", value: 75 } }],
  },
  {
    id: "life-balance",
    label: "Equilibrio",
    description: "Vita digitale abbastanza bilanciata.",
    conditions: [
      { type: "stat", rule: { stat: "health", op: "gte", value: 42 } },
      { type: "stat", rule: { stat: "happiness", op: "gte", value: 42 } },
      { type: "stat", rule: { stat: "career", op: "gte", value: 30 } },
    ],
  },
];
