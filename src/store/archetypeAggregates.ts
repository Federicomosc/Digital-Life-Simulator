import type { ArchetypeId } from "@/data/archetypes";
import type { PlayerStats } from "@/data/history";

type StatKey = keyof PlayerStats;

type ArchetypeAggregate = {
  readonly count: number;
  readonly totals: Record<StatKey, number>;
};

type AggregatesByArchetype = Record<ArchetypeId, ArchetypeAggregate>;

const STORAGE_KEY = "digital-life-simulator-archetype-aggregates-v1";

function defaultAggregate(): ArchetypeAggregate {
  return {
    count: 0,
    totals: {
      health: 0,
      happiness: 0,
      money: 0,
      career: 0,
      relationships: 0,
      skills: 0,
    },
  };
}

function defaultAll(): AggregatesByArchetype {
  return {
    student: defaultAggregate(),
    worker: defaultAggregate(),
    artist: defaultAggregate(),
  };
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function readArchetypeAggregates(): AggregatesByArchetype {
  if (typeof localStorage === "undefined") return defaultAll();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultAll();

  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return defaultAll();

  // Validazione “leggera”: se manca qualcosa, usiamo default.
  const out = defaultAll();
  const obj = parsed as Partial<Record<ArchetypeId, Partial<ArchetypeAggregate>>>;

  for (const archetypeId of Object.keys(out) as ArchetypeId[]) {
    const incoming = obj[archetypeId];
    if (!incoming) continue;
    const count = Number(incoming.count);
    if (!Number.isFinite(count)) continue;
    out[archetypeId] = {
      count,
      totals: {
        ...out[archetypeId].totals,
        ...(incoming.totals ?? {}),
      } as Record<StatKey, number>,
    };
  }

  return out;
}

export function updateArchetypeAggregates(params: {
  readonly archetypeId: ArchetypeId;
  readonly finalStats: PlayerStats;
}): void {
  if (typeof localStorage === "undefined") return;

  const aggregates = readArchetypeAggregates();
  const a = aggregates[params.archetypeId];
  const nextCount = a.count + 1;

  aggregates[params.archetypeId] = {
    count: nextCount,
    totals: {
      health: a.totals.health + params.finalStats.health,
      happiness: a.totals.happiness + params.finalStats.happiness,
      money: a.totals.money + params.finalStats.money,
      career: a.totals.career + params.finalStats.career,
      relationships: a.totals.relationships + params.finalStats.relationships,
      skills: a.totals.skills + params.finalStats.skills,
    },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(aggregates));
}

export function getArchetypeAverageStats(archetypeId: ArchetypeId): PlayerStats | null {
  const aggregates = readArchetypeAggregates();
  const a = aggregates[archetypeId];
  if (a.count <= 0) return null;

  const avg = {
    health: a.totals.health / a.count,
    happiness: a.totals.happiness / a.count,
    money: a.totals.money / a.count,
    career: a.totals.career / a.count,
    relationships: a.totals.relationships / a.count,
    skills: a.totals.skills / a.count,
  };

  return avg;
}

