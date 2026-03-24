import { delta } from "./effects";
import type { GameEventDefinition } from "./events";

export const EVENT_CATALOG: readonly GameEventDefinition[] = [
  {
    id: "starter-shift",
    title: "Turno Extra",
    description: "Ti propongono un turno extra dopo lavoro.",
    weight: 8,
    cooldownTurns: 1,
    choices: [
      {
        id: "accept-shift",
        label: "Accetta",
        immediate: [delta("money", 12), delta("happiness", -3), delta("career", 1)],
      },
      {
        id: "decline-shift",
        label: "Rifiuta",
        immediate: [delta("happiness", 2), delta("money", -2)],
      },
    ],
  },
  {
    id: "study-night",
    title: "Studio Serale",
    description: "Puoi seguire un mini-corso online stasera.",
    weight: 7,
    cooldownTurns: 1,
    choices: [
      {
        id: "study",
        label: "Studia",
        immediate: [delta("skills", 4), delta("happiness", -1), delta("money", -4)],
      },
      {
        id: "skip",
        label: "Salta",
        immediate: [delta("happiness", 1)],
      },
    ],
  },
  {
    id: "gym-routine",
    title: "Routine in Palestra",
    description: "Hai energia per allenarti in modo serio.",
    weight: 6,
    cooldownTurns: 2,
    choices: [
      {
        id: "train-hard",
        label: "Allenati duro",
        immediate: [delta("health", 6), delta("happiness", -2), delta("money", -3)],
        delayed: [{ delayTurns: 2, bundle: [delta("happiness", 3)] }],
      },
      {
        id: "light-walk",
        label: "Passeggiata leggera",
        immediate: [delta("health", 2), delta("happiness", 1)],
      },
    ],
  },
  {
    id: "networking-aperitivo",
    title: "Aperitivo di Networking",
    description: "Un amico ti invita a un evento professionale.",
    weight: 5,
    cooldownTurns: 2,
    choices: [
      {
        id: "go-networking",
        label: "Partecipa",
        immediate: [delta("relationships", 4), delta("career", 1), delta("money", -5)],
        scaled: [{ target: "money", base: 3, scaleBy: "skills", factor: 0.08 }],
      },
      {
        id: "stay-home",
        label: "Resta a casa",
        immediate: [delta("happiness", 2), delta("relationships", -1)],
      },
    ],
  },
  {
    id: "promotion-track",
    title: "Progetto ad Alta Visibilita",
    description: "Ti propongono un progetto complesso con alta esposizione.",
    weight: 4,
    cooldownTurns: 3,
    conditions: [
      { type: "stat", rule: { stat: "career", op: "gte", value: 25 } },
      { type: "stat", rule: { stat: "skills", op: "gte", value: 25 } },
    ],
    choices: [
      {
        id: "take-project",
        label: "Accetta la sfida",
        immediate: [delta("career", 6), delta("money", 15), delta("health", -4)],
      },
      {
        id: "decline-project",
        label: "Rifiuta",
        immediate: [delta("happiness", 2), delta("career", -2)],
      },
    ],
  },
  {
    id: "relationship-conflict",
    title: "Conflitto Personale",
    description: "Una tensione relazionale richiede attenzione immediata.",
    weight: 5,
    cooldownTurns: 2,
    conditions: [{ type: "stat", rule: { stat: "relationships", op: "lt", value: 40 } }],
    choices: [
      {
        id: "talk-openly",
        label: "Parla apertamente",
        immediate: [delta("relationships", 5), delta("happiness", -1)],
      },
      {
        id: "avoid-topic",
        label: "Evita il tema",
        immediate: [delta("relationships", -4), delta("happiness", -2)],
        delayed: [{ delayTurns: 1, bundle: [delta("happiness", -2)] }],
      },
    ],
  },
  {
    id: "health-warning",
    title: "Segnale di Affaticamento",
    description: "Ti senti scarico e poco concentrato.",
    weight: 4,
    cooldownTurns: 2,
    conditions: [{ type: "stat", rule: { stat: "health", op: "lt", value: 45 } }],
    choices: [
      {
        id: "rest-day",
        label: "Prenditi una pausa",
        immediate: [delta("health", 8), delta("money", -4)],
      },
      {
        id: "push-through",
        label: "Ignora e continua",
        immediate: [delta("money", 8), delta("health", -5), delta("happiness", -2)],
      },
    ],
  },
  {
    id: "mentor-opportunity",
    title: "Mentor Esperto",
    description: "Un professionista senior offre un confronto.",
    weight: 3,
    cooldownTurns: 3,
    conditions: [
      { type: "stat", rule: { stat: "skills", op: "gte", value: 40 } },
      { type: "milestone", milestoneId: "career-junior-plus" },
    ],
    choices: [
      {
        id: "accept-mentoring",
        label: "Accetta mentoring",
        immediate: [delta("skills", 5), delta("career", 3), delta("money", -6)],
      },
      {
        id: "decline-mentoring",
        label: "Non ora",
        immediate: [delta("happiness", 1)],
      },
    ],
  },
  {
    id: "financial-pressure",
    title: "Spesa Inattesa",
    description: "Arriva una spesa improvvisa da coprire.",
    weight: 5,
    cooldownTurns: 2,
    choices: [
      {
        id: "pay-now",
        label: "Paga subito",
        immediate: [delta("money", -10), delta("happiness", -1)],
      },
      {
        id: "delay-payment",
        label: "Rimanda",
        immediate: [delta("money", -3), delta("happiness", -3)],
        delayed: [{ delayTurns: 2, bundle: [delta("money", -8)] }],
      },
    ],
  },
  {
    id: "breakthrough",
    title: "Breakthrough Professionale",
    description: "Combinazione perfetta: puoi fare un salto importante.",
    weight: 2,
    cooldownTurns: 4,
    conditions: [
      { type: "stat", rule: { stat: "skills", op: "gte", value: 60 } },
      { type: "stat", rule: { stat: "career", op: "gte", value: 55 } },
      { type: "milestone", milestoneId: "skills-solid" },
    ],
    choices: [
      {
        id: "go-all-in",
        label: "Dai tutto",
        immediate: [delta("career", 10), delta("money", 20), delta("health", -6)],
      },
      {
        id: "play-safe",
        label: "Mantieni equilibrio",
        immediate: [delta("career", 4), delta("happiness", 2)],
      },
    ],
  },
  {
    id: "weekend-social",
    title: "Weekend con Amici",
    description: "Occasione per staccare e ricaricarti.",
    weight: 6,
    cooldownTurns: 1,
    choices: [
      {
        id: "join-friends",
        label: "Esci con amici",
        immediate: [delta("happiness", 4), delta("relationships", 3), delta("money", -5)],
      },
      {
        id: "solo-weekend",
        label: "Weekend tranquillo",
        immediate: [delta("health", 3), delta("happiness", 1)],
      },
    ],
  },
];

