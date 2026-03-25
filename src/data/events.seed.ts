import { delta } from "./effects";
import type { EffectBundle } from "./effects";
import type { GameEventDefinition } from "./events";
import type { CharacterVariableKey } from "./character";
import type { ArchetypeId } from "./archetypes";

const BASE_EVENT_CATALOG: readonly GameEventDefinition[] = [
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
        immediate: [delta("money", 10), delta("happiness", -2), delta("career", 1)],
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
        timeCost: 2,
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
        timeCost: 2,
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
        timeCost: 1,
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
        timeCost: 2,
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
        timeCost: 1,
        immediate: [delta("relationships", 5), delta("happiness", -1)],
      },
      {
        id: "avoid-topic",
        label: "Evita il tema",
        timeCost: 1,
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
        timeCost: 1,
        immediate: [delta("health", 8), delta("money", -4)],
      },
      {
        id: "push-through",
        label: "Ignora e continua",
        timeCost: 2,
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
        timeCost: 2,
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
        immediate: [delta("money", -8), delta("happiness", -1)],
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
    weight: 3,
    cooldownTurns: 3,
    conditions: [
      { type: "stat", rule: { stat: "skills", op: "gte", value: 58 } },
      { type: "stat", rule: { stat: "career", op: "gte", value: 52 } },
      { type: "milestone", milestoneId: "skills-solid" },
    ],
    choices: [
      {
        id: "go-all-in",
        label: "Dai tutto",
        immediate: [delta("career", 8), delta("money", 18), delta("health", -5)],
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
  {
    id: "burnout-check",
    title: "Segnali di Burnout",
    description:
      "Stai spingendo forte in carriera ma il carico emotivo si fa sentire.",
    tags: ["stress", "late"],
    weight: 4,
    cooldownTurns: 3,
    conditions: [
      { type: "stat", rule: { stat: "career", op: "gte", value: 38 } },
      { type: "stat", rule: { stat: "happiness", op: "lte", value: 38 } },
    ],
    choices: [
      {
        id: "scale-back",
        label: "Riduci il ritmo",
        immediate: [delta("career", -2), delta("happiness", 5), delta("health", 3)],
      },
      {
        id: "push-on",
        label: "Continua così",
        immediate: [delta("career", 2), delta("happiness", -3), delta("health", -3)],
        delayed: [{ delayTurns: 2, bundle: [delta("health", -2)] }],
      },
    ],
  },
  {
    id: "side-hustle",
    title: "Progetto Collaterale",
    description: "Potresti monetizzare un hobby o una piccola idea.",
    weight: 5,
    cooldownTurns: 2,
    conditions: [{ type: "stat", rule: { stat: "skills", op: "gte", value: 28 } }],
    choices: [
      {
        id: "launch",
        label: "Lancia il progetto",
        immediate: [delta("money", 8), delta("happiness", -2), delta("skills", 2)],
        delayed: [{ delayTurns: 1, bundle: [delta("money", 5)] }],
      },
      {
        id: "pass",
        label: "Non è il momento",
        immediate: [delta("happiness", 1)],
      },
    ],
  },
  {
    id: "family-dinner",
    title: "Cena in Famiglia",
    description: "Ti invitano a passare una serata insieme.",
    weight: 6,
    cooldownTurns: 2,
    conditions: [{ type: "stat", rule: { stat: "turn", op: "gte", value: 5 } }],
    choices: [
      {
        id: "go-dinner",
        label: "Ci vado",
        immediate: [delta("relationships", 4), delta("happiness", 3), delta("money", -6)],
      },
      {
        id: "skip-dinner",
        label: "Declina educatamente",
        immediate: [delta("relationships", -2), delta("career", 1)],
      },
    ],
  },
  {
    id: "work-from-home",
    title: "Smart Working",
    description: "Puoi lavorare da casa per qualche giorno.",
    weight: 7,
    cooldownTurns: 1,
    choices: [
      {
        id: "wfh-focus",
        label: "Focus totale",
        immediate: [delta("skills", 3), delta("happiness", 1), delta("relationships", -1)],
      },
      {
        id: "wfh-relax",
        label: "Approfitta per rilassarti",
        immediate: [delta("health", 4), delta("happiness", 2), delta("career", -1)],
      },
    ],
  },
  {
    id: "peer-comparison",
    title: "Confronto con i Par",
    description: "Vedi i successi altrui e ti chiedi se stai andando abbastanza forte.",
    weight: 4,
    cooldownTurns: 2,
    conditions: [{ type: "stat", rule: { stat: "relationships", op: "lt", value: 48 } }],
    choices: [
      {
        id: "reach-out",
        label: "Scrivi a qualcuno",
        immediate: [delta("relationships", 3), delta("happiness", -1)],
      },
      {
        id: "double-down",
        label: "Ti sproni a fare di più",
        immediate: [delta("career", 2), delta("happiness", -3)],
      },
    ],
  },
  {
    id: "certification-course",
    title: "Corso di Certificazione",
    description: "Un percorso costoso ma utile per il curriculum.",
    weight: 4,
    cooldownTurns: 3,
    conditions: [{ type: "stat", rule: { stat: "money", op: "gte", value: 25 } }],
    choices: [
      {
        id: "enroll",
        label: "Iscriviti",
        immediate: [delta("money", -22), delta("skills", 6), delta("career", 2)],
      },
      {
        id: "later",
        label: "Rimanda",
        immediate: [delta("happiness", -1)],
      },
    ],
  },
  {
    id: "serendipity",
    title: "Piccola Occasione",
    description: "Qualcosa di inatteso ti sorride.",
    tags: ["luck"],
    weight: 2,
    cooldownTurns: 4,
    choices: [
      {
        id: "take-it",
        label: "Cogli l'occasione",
        immediate: [delta("money", 6), delta("happiness", 2)],
      },
      {
        id: "ignore",
        label: "Lascia perdere",
        immediate: [delta("happiness", -1)],
      },
    ],
  },
  {
    id: "leadership-draft",
    title: "Bozza di Leadership",
    description: "Ti chiedono di coordinare un piccolo team.",
    weight: 3,
    cooldownTurns: 3,
    conditions: [
      { type: "milestone", milestoneId: "career-veteran" },
      { type: "stat", rule: { stat: "relationships", op: "gte", value: 45 } },
    ],
    choices: [
      {
        id: "accept-lead",
        label: "Accetti il ruolo",
        immediate: [delta("career", 5), delta("money", 10), delta("happiness", -2)],
      },
      {
        id: "defer-lead",
        label: "Chiedi tempo",
        immediate: [delta("happiness", 2), delta("career", -1)],
      },
    ],
  },
  {
    id: "wellness-retreat",
    title: "Weekend Benessere",
    description: "Una proposta per recuperare energia.",
    weight: 3,
    cooldownTurns: 3,
    conditions: [
      { type: "stat", rule: { stat: "health", op: "lt", value: 52 } },
      { type: "stat", rule: { stat: "money", op: "gte", value: 30 } },
    ],
    choices: [
      {
        id: "book-retreat",
        label: "Prenota",
        immediate: [delta("money", -28), delta("health", 10), delta("happiness", 4)],
      },
      {
        id: "diy-rest",
        label: "Riposo fai-da-te",
        immediate: [delta("health", 4), delta("money", -5)],
      },
    ],
  },
  {
    id: "investment-tip",
    title: "Suggerimento Finanziario",
    description:
      "Un collega parla di un'opportunità con rischio e possibile guadagno.",
    weight: 3,
    cooldownTurns: 3,
    conditions: [{ type: "stat", rule: { stat: "money", op: "gte", value: 40 } }],
    choices: [
      {
        id: "invest-safe",
        label: "Investi poco",
        immediate: [delta("money", -4), delta("happiness", 1)],
      },
      {
        id: "invest-risk",
        label: "Tenti la sorte",
        immediate: [delta("money", -20), delta("happiness", -2)],
        delayed: [
          {
            delayTurns: 2,
            bundle: [delta("money", 18)],
          },
        ],
      },
      {
        id: "pass-invest",
        label: "Non ti interessa",
        immediate: [delta("happiness", 1)],
      },
    ],
  },
];

function effectsAdd(pairs: Array<[CharacterVariableKey, number]>): EffectBundle {
  return pairs.map(([target, value]) => delta(target, value));
}

const EXTRA_EVENT_CATALOG: GameEventDefinition[] = [];

// --- Connettori narrativi (flags) ---
EXTRA_EVENT_CATALOG.push(
  {
    id: "partner-meeting",
    title: "Incontro di Persona",
    description: "Una conversazione inattesa accende qualcosa.",
    tags: ["social", "career"],
    weight: 6,
    cooldownTurns: 3,
    choices: [
      {
        id: "chat",
        label: "Continua a parlare",
        immediate: effectsAdd([
          ["happiness", 3],
          ["relationships", 6],
        ]),
        setsFlags: ["has_partner"],
        nextEventId: "partner-afterglow",
      },
      {
        id: "keep-distance",
        label: "Mantieni distanza",
        immediate: effectsAdd([
          ["happiness", 1],
          ["relationships", -1],
        ]),
      },
    ],
  },
  {
    id: "partner-afterglow",
    title: "Un piccolo passo",
    description: "La relazione cresce, ma richiede attenzione.",
    tags: ["social"],
    weight: 5,
    cooldownTurns: 2,
    requirements: { flags: ["has_partner"] },
    choices: [
      {
        id: "be-there",
        label: "Cerca di esserci",
        immediate: effectsAdd([
          ["happiness", 2],
          ["relationships", 4],
        ]),
      },
      {
        id: "overwork",
        label: "Rimani troppo sul lavoro",
        immediate: effectsAdd([
          ["career", 1],
          ["happiness", -2],
          ["relationships", -2],
        ]),
        delayed: [{ delayTurns: 1, bundle: effectsAdd([["happiness", -1]]) }],
      },
    ],
  },
);

EXTRA_EVENT_CATALOG.push({
  id: "midseason-review",
  title: "Revisione di Metà Stagione (scripted)",
  description: "Un punto di controllo: cosa hai costruito finora?",
  tags: ["career"],
  type: "scripted",
  triggerTurn: 12,
  weight: 4,
  cooldownTurns: 999,
  choices: [
    {
      id: "double-down",
      label: "Raddoppia",
      immediate: effectsAdd([
        ["career", 6],
        ["money", 8],
        ["happiness", -2],
      ]),
    },
    {
      id: "stabilize",
      label: "Stabilizza e migliora",
      immediate: effectsAdd([
        ["skills", 4],
        ["happiness", 2],
        ["relationships", 1],
      ]),
    },
  ],
});

// --- Eventi “job related” che dipendono da flag fired_from_job ---
EXTRA_EVENT_CATALOG.push({
  id: "burnout-risk",
  title: "Rischio di Burnout",
  description: "Pressione e stanchezza aumentano: potresti perdere il posto.",
  tags: ["career", "health"],
  weight: 7,
  cooldownTurns: 3,
  requirements: { archetype: ["worker"] },
  choices: [
    {
      id: "slow-down",
      label: "Rallenta",
      immediate: effectsAdd([
        ["health", 8],
        ["happiness", 2],
        ["career", -2],
      ]),
    },
    {
      id: "push-until",
      label: "Spingi fino a crollare",
      immediate: effectsAdd([
        ["career", 3],
        ["happiness", -3],
        ["health", -10],
      ]),
      delayed: [
        { delayTurns: 2, bundle: effectsAdd([["money", -10]]) },
      ],
      setsFlags: ["fired_from_job"],
    },
  ],
});

EXTRA_EVENT_CATALOG.push({
  id: "job-search-week",
  title: "Settimana di Ricerca Lavoro",
  description: "Ricominci da zero: aggiornare competenze e rete è essenziale.",
  tags: ["career", "social", "finance"],
  weight: 6,
  cooldownTurns: 3,
  requirements: { archetype: ["worker"], flags: ["fired_from_job"] },
  choices: [
    {
      id: "network",
      label: "Puntare sulla rete",
      immediate: effectsAdd([
        ["relationships", 6],
        ["skills", 2],
        ["happiness", 1],
      ]),
      delayed: [{ delayTurns: 2, bundle: effectsAdd([["money", 14]]) }],
    },
    {
      id: "apply-many",
      label: "Candidati ovunque",
      immediate: effectsAdd([
        ["career", -1],
        ["happiness", -1],
        ["money", 3],
      ]),
    },
  ],
});

// --- Pool generico di eventi per rigiocabilità (archetype gated) ---
// Crea rapidamente eventi additivi con piccole differenze per rendere le partite diverse.
const ARCS: ArchetypeId[] = ["student", "worker", "artist"];
for (const arc of ARCS) {
  for (let n = 1; n <= 12; n += 1) {
    const id = `${arc}-arc-event-${n}`;
    const title =
      arc === "student"
        ? `Giornata di Studio #${n}`
        : arc === "worker"
          ? `Giornata Lavorativa #${n}`
          : `Ritmo Creativo #${n}`;
    const desc =
      arc === "student"
        ? "Preparazione, piccoli progressi e qualche imprevisto."
        : arc === "worker"
          ? "Compiti, pressione e opportunità quotidiane."
          : "Ispirazione, richieste e gesti che contano.";

    const immediate = arc === "student"
      ? effectsAdd([
          ["skills", 2 + (n % 3)],
          ["happiness", 1 - (n % 4)],
          ["money", -2],
        ])
      : arc === "worker"
        ? effectsAdd([
            ["career", 2 + (n % 3)],
            ["money", 4 + (n % 4)],
            ["happiness", 0 - (n % 3)],
          ])
        : effectsAdd([
            ["relationships", 2 + (n % 4)],
            ["happiness", 2 + (n % 3) - 2],
            ["career", 1],
          ]);

    const delayed =
      n % 2 === 0
        ? [{ delayTurns: 2, bundle: effectsAdd([["happiness", 2 - (n % 5)]]) }]
        : undefined;

    EXTRA_EVENT_CATALOG.push({
      id,
      title,
      description: desc,
      tags:
        arc === "student"
          ? ["career", "health", "skills"]
          : arc === "worker"
            ? ["career", "finance", "health"]
            : ["social", "career"],
      type: "random",
      weight: 4 + (n % 3),
      cooldownTurns: 2 + (n % 3),
      requirements: { archetype: [arc] },
      choices: [
        {
          id: `${id}-opt-a`,
          label: "Approccio diretto",
          immediate,
          delayed,
        },
        {
          id: `${id}-opt-b`,
          label: "Approccio prudente",
          immediate: effectsAdd([
            ["happiness", 2],
            ["health", 2 - (n % 2)],
          ]),
        },
      ],
    });
  }
}

export const EVENT_CATALOG: readonly GameEventDefinition[] = [
  ...BASE_EVENT_CATALOG,
  ...EXTRA_EVENT_CATALOG,
];

