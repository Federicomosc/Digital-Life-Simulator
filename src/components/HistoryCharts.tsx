import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TurnSnapshot } from "@/data/history";
import type { CharacterVariables } from "@/data/character";
import type { ArchetypeId } from "@/data/archetypes";
import { getArchetypeAverageStats } from "@/store/archetypeAggregates";

type StatKey = keyof Omit<CharacterVariables, "turn">;

const ALL_STAT_KEYS: StatKey[] = [
  "health",
  "happiness",
  "money",
  "career",
  "relationships",
  "skills",
];

function clampForRadar(key: StatKey, value: number): number {
  if (key === "money") return Math.max(0, Math.min(100, Math.floor(value)));
  return Math.max(0, Math.min(100, Math.floor(value)));
}

function statLabel(key: StatKey): string {
  switch (key) {
    case "health":
      return "Salute";
    case "happiness":
      return "Felicità";
    case "money":
      return "Denaro";
    case "career":
      return "Carriera";
    case "relationships":
      return "Relazioni";
    case "skills":
      return "Competenze";
    default:
      return key;
  }
}

function statLabelShort(key: StatKey): string {
  switch (key) {
    case "health":
      return "Salute";
    case "happiness":
      return "Felicità";
    case "money":
      return "Denaro";
    case "career":
      return "Carriera";
    case "relationships":
      return "Relazioni";
    case "skills":
      return "Skill";
    default:
      return key;
  }
}

function statColor(key: StatKey): string {
  switch (key) {
    case "health":
      return "#f87171";
    case "happiness":
      return "#34d399";
    case "money":
      return "#fbbf24";
    case "career":
      return "#38bdf8";
    case "relationships":
      return "#a78bfa";
    case "skills":
      return "#10b981";
    default:
      return "#94a3b8";
  }
}

export function HistoryCharts(params: {
  history: readonly TurnSnapshot[];
  character: CharacterVariables;
  archetypeId: ArchetypeId;
}) {
  const { history, character, archetypeId } = params;

  const [selectedStats, setSelectedStats] = useState<StatKey[]>([
    "health",
    "happiness",
    "career",
  ]);

  const last = history.length > 0 ? history[history.length - 1] : null;
  const profileStats = useMemo(() => {
    const base = last?.stats ?? {
      health: character.health,
      happiness: character.happiness,
      money: character.money,
      career: character.career,
      relationships: character.relationships,
      skills: character.skills,
    };

    const keys: StatKey[] = [
      "health",
      "happiness",
      "career",
      "relationships",
      "skills",
      "money",
    ];

    return keys.map((k) => ({
      key: k,
      label: statLabelShort(k),
      value: clampForRadar(k, base[k]),
      color: statColor(k),
    }));
  }, [character, last]);

  const lineData = useMemo(() => {
    if (history.length === 0) return [];
    return history
      .map((snap) => ({
        turn: snap.turn,
        ...snap.stats,
      }))
      .sort((a, b) => a.turn - b.turn);
  }, [history]);

  const trendByStat = useMemo(() => {
    const out: Partial<Record<StatKey, "up" | "flat" | "down">> = {};
    if (history.length < 2) return out;

    const take = history.slice(-5);
    for (const key of selectedStats) {
      const first = take[0]?.stats[key];
      const lastV = take[take.length - 1]?.stats[key];
      if (first === undefined || lastV === undefined) continue;
      const diff = lastV - first;
      if (Math.abs(diff) < 1) out[key] = "flat";
      else if (diff > 0) out[key] = "up";
      else out[key] = "down";
    }
    return out;
  }, [history, selectedStats]);

  const avgStats = useMemo(() => {
    const globalAvg = getArchetypeAverageStats(archetypeId);
    if (globalAvg) return globalAvg;

    // Fallback: se è la prima partita di quell’archetipo, usiamo la media del run corrente.
    if (history.length === 0) {
      return {
        health: character.health,
        happiness: character.happiness,
        money: character.money,
        career: character.career,
        relationships: character.relationships,
        skills: character.skills,
      };
    }
    const sum = ALL_STAT_KEYS.reduce((acc, k) => {
      acc[k] = 0;
      return acc;
    }, {} as Record<StatKey, number>);

    for (const snap of history) {
      for (const k of ALL_STAT_KEYS) {
        sum[k] += snap.stats[k];
      }
    }
    const n = history.length;
    return Object.fromEntries(
      ALL_STAT_KEYS.map((k) => [k, sum[k] / n]),
    ) as Record<StatKey, number>;
  }, [archetypeId, character, history]);

  const barData = useMemo(() => {
    const current = last?.stats ?? character;
    const keys: StatKey[] = ["health", "happiness", "career", "relationships", "skills"];
    return keys.map((k) => ({
      key: k,
      stat: statLabel(k),
      current: current[k],
      average: avgStats[k],
      delta: current[k] - avgStats[k],
      color: statColor(k),
    }));
  }, [avgStats, character, last]);

  if (history.length === 0) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-200">Storia</h3>
        <p className="mt-2 text-sm text-slate-500">
          Le statistiche inizieranno a comparire dopo le prime scelte.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-200">Storia e profilo</h3>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Traccia:</span>
            {ALL_STAT_KEYS.map((k) => {
              const active = selectedStats.includes(k);
              const t = trendByStat[k];
              return (
                <label
                  key={k}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1 text-xs ${
                    active
                      ? "border-emerald-600 bg-emerald-950/20 text-emerald-200"
                      : "border-slate-800 bg-slate-900/20 text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {
                      setSelectedStats((prev) => {
                        if (prev.includes(k)) return prev.filter((x) => x !== k);
                        return [...prev, k];
                      });
                    }}
                  />
                  <span>
                    {statLabel(k)}
                    {t ? (
                      <span className="ml-2 text-[11px] text-slate-400">
                        {t === "up" ? "↗" : t === "down" ? "↘" : "→"}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="turn" />
                <YAxis />
                <Tooltip />
                {selectedStats.map((k) => (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={k === "health"
                      ? "#f87171"
                      : k === "happiness"
                        ? "#34d399"
                        : k === "money"
                          ? "#fbbf24"
                          : k === "career"
                            ? "#38bdf8"
                            : k === "relationships"
                              ? "#a78bfa"
                              : "#10b981"}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mx-auto h-80 w-full max-w-sm">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">
                  Profilo attuale
                </h4>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Distribuzione bilanciata o sbilanciata.
              </p>
              <div className="mt-3 grid flex-1 grid-cols-2 gap-2.5">
                {profileStats.map((s) => (
                  <div
                    key={s.key}
                    className="rounded-lg border border-slate-800 bg-slate-950/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-300">{s.label}</span>
                      <span className="text-xs tabular-nums text-slate-200">
                        {s.value}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full rounded bg-slate-900">
                      <div
                        className="h-2.5 rounded"
                        style={{ width: `${s.value}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto h-80 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950/30 p-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Confronto con media archetipo
            </h4>
            <div className="mt-3 space-y-3">
              {barData.map((row) => (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{row.stat}</span>
                    <span className="tabular-nums text-slate-400">
                      Tu: {Math.round(row.current)} · Media: {Math.round(row.average)}
                      <span
                        className={`ml-1 ${row.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                      >
                        ({row.delta >= 0 ? "+" : ""}
                        {Math.round(row.delta)})
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded bg-slate-900">
                    <div
                      className="h-2.5 rounded opacity-40"
                      style={{ width: `${Math.max(0, Math.min(100, row.average))}%`, backgroundColor: "#94a3b8" }}
                    />
                  </div>
                  <div className="mt-1 h-2.5 rounded bg-slate-900">
                    <div
                      className="h-2.5 rounded"
                      style={{ width: `${Math.max(0, Math.min(100, row.current))}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

