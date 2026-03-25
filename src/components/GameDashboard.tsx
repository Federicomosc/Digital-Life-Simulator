import { useEffect, useMemo, useRef, useState } from "react";
import { EVENT_CATALOG } from "@/data/events.seed";
import { MILESTONES } from "@/data/progression";
import { useGameStore } from "@/store/useGameStore";
import { HistoryCharts } from "@/components/HistoryCharts";
import type { EventChoiceDefinition } from "@/data/events";
import type { EffectBundle } from "@/data/effects";
import { ACHIEVEMENTS } from "@/data/achievements";
import { ARCHETYPES } from "@/data/archetypes";

function formatVarLabel(key: string): string {
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

function summarizeBundle(bundle: EffectBundle): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of bundle) {
    if (e.op !== "add") continue;
    out[e.target] = (out[e.target] ?? 0) + e.value;
  }
  return out;
}

function summarizeChoicePreview(choice: EventChoiceDefinition): { lines: string[] } {
  const immediateAdds = summarizeBundle(choice.immediate);
  const lines: string[] = [];

  for (const [key, amount] of Object.entries(immediateAdds)) {
    const sign = amount >= 0 ? "+" : "";
    lines.push(`${sign}${amount} ${formatVarLabel(key)}`);
  }

  if (choice.delayed && choice.delayed.length > 0) {
    const delayedAdds = summarizeBundle(choice.delayed[0].bundle);
    const first = Object.entries(delayedAdds)[0];
    if (first) {
      const [key, amount] = first;
      const sign = amount >= 0 ? "+" : "";
      lines.push(
        `Ritardato (${choice.delayed[0].delayTurns}t): ${sign}${amount} ${formatVarLabel(key)}`,
      );
    }
  }

  return { lines };
}

function tagToClass(tag: string): string {
  const t = tag.toLowerCase();
  if (t.includes("career") || t.includes("lavor")) return "border-cyan-700 bg-cyan-950/30 text-cyan-200";
  if (t.includes("health") || t.includes("salut")) return "border-rose-700 bg-rose-950/30 text-rose-200";
  if (t.includes("social") || t.includes("sociale") || t.includes("relat")) return "border-fuchsia-700 bg-fuchsia-950/30 text-fuchsia-200";
  if (t.includes("finance") || t.includes("money") || t.includes("denar")) return "border-amber-700 bg-amber-950/30 text-amber-200";
  if (t.includes("skill") || t.includes("compet")) return "border-emerald-700 bg-emerald-950/30 text-emerald-200";
  return "border-slate-700 bg-slate-900/30 text-slate-200";
}

function milestoneLabel(id: string): string {
  return MILESTONES.find((m) => m.id === id)?.label ?? id;
}

export function GameDashboard() {
  const character = useGameStore((s) => s.character);
  const archetypeId = useGameStore((s) => s.archetypeId);
  const resetCharacter = useGameStore((s) => s.resetCharacter);
  const clearSave = useGameStore((s) => s.clearSave);
  const pendingEffects = useGameStore((s) => s.pendingEffects);
  const choose = useGameStore((s) => s.choose);
  const currentEventId = useGameStore((s) => s.currentEventId);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const unlockedMilestones = useGameStore((s) => s.unlockedMilestones);
  const history = useGameStore((s) => s.history);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const finalText = useGameStore((s) => s.finalText);
  const finalId = useGameStore((s) => s.finalId);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const lastActionMessage = useGameStore((s) => s.lastActionMessage);
  const [mode, setMode] = useState<"game" | "dashboard" | "achievements">("game");

  const liveRef = useRef<HTMLDivElement>(null);
  const event = EVENT_CATALOG.find((e) => e.id === currentEventId) ?? EVENT_CATALOG[0];
  const archetypeLabel = ARCHETYPES.find((a) => a.id === archetypeId)?.label ?? archetypeId;
  const previousSnapshot = history.length >= 2 ? history[history.length - 2] : null;
  const deltas = {
    health: character.health - (previousSnapshot?.stats.health ?? character.health),
    happiness:
      character.happiness - (previousSnapshot?.stats.happiness ?? character.happiness),
    career: character.career - (previousSnapshot?.stats.career ?? character.career),
    money: character.money - (previousSnapshot?.stats.money ?? character.money),
    relationships:
      character.relationships -
      (previousSnapshot?.stats.relationships ?? character.relationships),
  };

  const eventTags = useMemo(() => event.tags ?? [], [event.tags]);

  useEffect(() => {
    if (lastActionMessage && liveRef.current) {
      liveRef.current.focus();
    }
  }, [lastActionMessage]);

  if (gamePhase === "ended") {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-8">
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100/90 text-2xl text-emerald-700">
            ☆
          </div>
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-slate-400">
            Finale sbloccato
          </p>
          <h2 className="mt-2 text-4xl font-semibold text-slate-100">{finalId ?? "Finale"}</h2>
          <p className="mx-auto mt-4 max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-slate-300">
            {finalText ?? ""}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5 text-left">
              <h3 className="text-xl font-semibold text-slate-100">Statistiche finali</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  ["Salute", character.health],
                  ["Felicità", character.happiness],
                  ["Carriera", character.career],
                  ["Denaro", character.money],
                  ["Relazioni", character.relationships],
                ].map(([label, value]) => (
                  <li key={label as string} className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className={Number(value) >= 60 ? "text-emerald-300" : "text-rose-300"}>
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5 text-left">
              <h3 className="text-xl font-semibold text-slate-100">Achievement sbloccati</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {unlockedAchievements.length === 0 ? (
                  <span className="text-sm text-slate-500">Nessuno sbloccato</span>
                ) : (
                  unlockedAchievements.map((id) => (
                    <span key={id} className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-sm text-slate-200">
                      {ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id}
                    </span>
                  ))
                )}
              </div>
              <p className="mt-4 text-sm text-slate-400">
                {unlockedAchievements.length}/{ACHIEVEMENTS.length} totali
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => resetCharacter()}
              className="rounded-xl border border-slate-600 px-6 py-3 text-lg font-semibold text-slate-100 hover:bg-slate-800/50"
            >
              Rigioca stesso archetipo
            </button>
            <button
              type="button"
              onClick={() => clearSave()}
              className="rounded-xl bg-slate-100 px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-white"
            >
              Nuova partita
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-8" aria-label="Pannello di gioco">
      <div
        ref={liveRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only outline-none"
      >
        {lastActionMessage ?? ""}
      </div>

      <header className="sticky top-3 z-30 rounded-2xl border border-slate-700/60 bg-slate-900/90 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-300">
            Turno <span className="text-xl font-semibold text-slate-100">{character.turn}</span> / 30
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {[
              ["Salute", character.health],
              ["Felicità", character.happiness],
              ["Carriera", character.career],
              ["Denaro", character.money],
              ["Relazioni", character.relationships],
            ].map(([label, value]) => (
              <span key={label as string} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-300">
                {label}: <strong className="text-slate-100">{value}</strong>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("game")}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === "game" ? "bg-slate-100 text-slate-900" : "border border-slate-600 text-slate-200"}`}
            >
              Gioco
            </button>
            <button
              type="button"
              onClick={() => setMode("dashboard")}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === "dashboard" ? "bg-slate-100 text-slate-900" : "border border-slate-600 text-slate-200"}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setMode("achievements")}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === "achievements" ? "bg-slate-100 text-slate-900" : "border border-slate-600 text-slate-200"}`}
            >
              Achievements
            </button>
          </div>
        </div>
      </header>

      {mode === "game" ? (
        <section className="space-y-4">
          <article key={event.id} className="card-switch rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
            <div className="mb-3 flex items-center gap-2">
              {(eventTags[0] ?? "Evento") && (
                <span className={`rounded-full border px-2 py-1 text-xs ${tagToClass(eventTags[0] ?? "evento")}`}>
                  {eventTags[0] ?? "Evento"}
                </span>
              )}
              <span className="text-sm text-slate-500">Evento #{eventHistory.length + 1}</span>
            </div>
            <h2 className="text-3xl font-semibold text-slate-100">{event.title}</h2>
            <p className="mt-3 text-xl leading-relaxed text-slate-300">{event.description}</p>
          </article>

          <div className="space-y-2">
            {event.choices.map((choice) => {
              const preview = summarizeChoicePreview(choice);
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => choose(choice.id)}
                  className="flex w-full items-start justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900/35 px-4 py-4 text-left transition hover:border-slate-500"
                >
                  <span className="text-xl font-semibold text-slate-100">{choice.label}</span>
                  <span className="text-sm text-right">
                    {preview.lines.length > 0
                      ? preview.lines.slice(0, 3).map((line) => (
                        <span
                          key={line}
                          className={`block ${line.includes("-") ? "text-rose-300" : "text-emerald-300"}`}
                        >
                          {line}
                        </span>
                      ))
                      : <span className="text-slate-500">Nessun delta</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {mode === "dashboard" ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              ["Salute", character.health, deltas.health],
              ["Felicità", character.happiness, deltas.happiness],
              ["Carriera", character.career, deltas.career],
              ["Denaro", character.money, deltas.money],
              ["Relazioni", character.relationships, deltas.relationships],
            ].map(([label, value, d]) => (
              <div key={label as string} className="rounded-xl border border-slate-700 bg-slate-900/35 px-4 py-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-3xl font-semibold text-slate-100">{value}</p>
                <p className={`text-sm ${Number(d) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {Number(d) >= 0 ? "+" : ""}{d}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/35 p-4">
            <p className="mb-3 text-sm text-slate-400">
              Turno {character.turn} — Archetipo: {archetypeLabel}
            </p>
            <HistoryCharts history={history} character={character} archetypeId={archetypeId} />
          </div>
        </section>
      ) : null}

      {mode === "achievements" ? (
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/35 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-semibold text-slate-100">Achievements</h2>
              <p className="text-lg text-slate-400">
                {unlockedAchievements.length} / {ACHIEVEMENTS.length} sbloccati
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300">
              {Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded bg-slate-700">
            <div
              className="h-1.5 rounded bg-slate-100"
              style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>

          <div className="mt-6 space-y-2">
            {ACHIEVEMENTS.map((a) => {
              const isUnlocked = unlockedAchievements.includes(a.id);
              return (
                <div key={a.id} className="rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xl font-semibold ${isUnlocked ? "text-slate-100" : "text-slate-500"}`}>
                        {isUnlocked ? a.label : a.secret ? "???" : a.label}
                      </p>
                      <p className="text-sm text-slate-400">
                        {isUnlocked
                          ? a.description
                          : a.secret
                            ? "Achievement segreto"
                            : a.description}
                      </p>
                    </div>
                    <span className={`text-xs ${isUnlocked ? "text-emerald-300" : "text-slate-500"}`}>
                      {isUnlocked ? "Sbloccato" : "Bloccato"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Milestone</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {unlockedMilestones.map((id) => (
              <li key={id}>
                <span className="inline-flex max-w-full rounded-full border border-emerald-600/50 bg-emerald-950/50 px-3 py-1 text-xs text-emerald-200">
                  {milestoneLabel(id)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Cronologia eventi</h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-400">
            {eventHistory.length === 0 ? (
              <li className="text-slate-600">Nessuna scelta ancora.</li>
            ) : (
              eventHistory
                .slice(-12)
                .reverse()
                .map((e) => (
                  <li key={`${e.turn}-${e.eventId}-${e.choiceId}`} className="border-b border-slate-800/80 py-1">
                    Turno {e.turn} · {e.eventId} · {e.choiceId}
                  </li>
                ))
            )}
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => resetCharacter()}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Rigioca
        </button>
        <button
          type="button"
          onClick={() => clearSave()}
          className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-950/50"
        >
          Esci alla home
        </button>
        <span className="ml-auto text-sm text-slate-500">
          {pendingEffects.length} effetti in coda
        </span>
      </div>
    </div>
  );
}
