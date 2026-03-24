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
    label: "Competenze Solide",
    description: "Hai costruito una base tecnica affidabile.",
    conditions: [{ type: "stat", rule: { stat: "skills", op: "gte", value: 40 } }],
  },
  {
    id: "social-stable",
    label: "Rete Sociale Stabile",
    description: "Relazioni abbastanza positive e consistenti.",
    conditions: [{ type: "stat", rule: { stat: "relationships", op: "gte", value: 60 } }],
  },
];

