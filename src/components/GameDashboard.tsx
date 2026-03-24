import { useEffect, useRef } from "react";
import { EVENT_CATALOG } from "@/data/events.seed";
import { MILESTONES } from "@/data/progression";
import { useGameStore } from "@/store/useGameStore";
import { StatBar } from "@/components/StatBar";

function milestoneLabel(id: string): string {
  return MILESTONES.find((m) => m.id === id)?.label ?? id;
}

export function GameDashboard() {
  const character = useGameStore((s) => s.character);
  const resetCharacter = useGameStore((s) => s.resetCharacter);
  const clearSave = useGameStore((s) => s.clearSave);
  const pendingEffects = useGameStore((s) => s.pendingEffects);
  const choose = useGameStore((s) => s.choose);
  const currentEventId = useGameStore((s) => s.currentEventId);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const effectHistory = useGameStore((s) => s.effectHistory);
  const unlockedMilestones = useGameStore((s) => s.unlockedMilestones);
  const lastActionMessage = useGameStore((s) => s.lastActionMessage);

  const liveRef = useRef<HTMLDivElement>(null);
  const event = EVENT_CATALOG.find((e) => e.id === currentEventId) ?? EVENT_CATALOG[0];
  const lastEvent = eventHistory[eventHistory.length - 1];

  useEffect(() => {
    if (lastActionMessage && liveRef.current) {
      liveRef.current.focus();
    }
  }, [lastActionMessage]);

  return (
    <div className="w-full max-w-3xl space-y-6" aria-label="Pannello di gioco">
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

      <header className="rounded-xl border border-emerald-900/60 bg-gradient-to-br from-emerald-950/40 to-slate-950 px-5 py-4 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/90">
          Partita in corso
        </p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight text-emerald-300">
            Turno {character.turn}
          </p>
          <p className="text-sm text-slate-500">
            {pendingEffects.length === 0
              ? "Nessun effetto in coda"
              : pendingEffects.length === 1
                ? "1 effetto in coda"
                : `${pendingEffects.length} effetti in coda`}
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-slate-300">Stato</h2>
        <div className="mt-4 space-y-4">
          <StatBar label="Salute" value={character.health} />
          <StatBar label="Felicità" value={character.happiness} />
          <StatBar label="Carriera" value={character.career} />
          <StatBar label="Relazioni" value={character.relationships} />
          <StatBar label="Competenze" value={character.skills} />
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Denaro</span>
              <span className="tabular-nums text-lg font-semibold text-slate-100">
                {character.money}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border-2 border-slate-700 bg-slate-950 px-5 py-5 shadow-xl">
        <p className="text-xs font-medium text-slate-500">Evento</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-50">{event.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{event.description}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              className="min-h-[44px] flex-1 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:flex-none"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-200">Progressione</h3>
        <p className="mt-1 text-xs text-slate-500">
          {unlockedMilestones.length} di {MILESTONES.length} traguardi
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {unlockedMilestones.map((id) => (
            <li key={id}>
              <span
                className="inline-flex max-w-full rounded-full border border-emerald-600/50 bg-emerald-950/50 px-3 py-1 text-xs text-emerald-200"
                title={MILESTONES.find((m) => m.id === id)?.description}
              >
                {milestoneLabel(id)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
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
                    Turno {e.turn} · {e.eventId}
                    <span className="text-slate-500"> · </span>
                    {e.choiceId}
                  </li>
                ))
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Cronologia effetti</h3>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-400">
            {effectHistory.length === 0 ? (
              <li className="text-slate-600">Nessun effetto registrato.</li>
            ) : (
              effectHistory
                .slice(-12)
                .reverse()
                .map((e, i) => (
                  <li key={`${e.turn}-${e.source}-${i}`} className="border-b border-slate-800/80 py-1">
                    T{e.turn} · {e.source}
                    <span className="block truncate text-slate-500">{e.description}</span>
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>

      <details className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-400">
          Debug: snapshot store
        </summary>
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-400">
          {JSON.stringify(
            { character, currentEventId, pendingEffects, lastEvent, unlockedMilestones },
            null,
            2,
          )}
        </pre>
      </details>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => resetCharacter()}
          className="rounded-lg border border-slate-600 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          Nuova partita (reset stato)
        </button>
        <button
          type="button"
          onClick={() => clearSave()}
          className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 hover:bg-rose-950/50"
        >
          Cancella salvataggio locale
        </button>
      </div>
    </div>
  );
}
