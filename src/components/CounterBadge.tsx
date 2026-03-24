import { EVENT_CATALOG } from "@/data/events.seed";
import { useGameStore } from "@/store/useGameStore";

export function CounterBadge() {
  const character = useGameStore((s) => s.character);
  const resetCharacter = useGameStore((s) => s.resetCharacter);
  const pendingEffects = useGameStore((s) => s.pendingEffects);
  const choose = useGameStore((s) => s.choose);
  const currentEventId = useGameStore((s) => s.currentEventId);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const effectHistory = useGameStore((s) => s.effectHistory);
  const unlockedMilestones = useGameStore((s) => s.unlockedMilestones);

  const event = EVENT_CATALOG.find((e) => e.id === currentEventId) ?? EVENT_CATALOG[0];
  const lastEvent = eventHistory[eventHistory.length - 1];

  return (
    <section className="w-full max-w-3xl space-y-4">
      <header className="rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-emerald-300">
          Dashboard Diagnostica
        </p>
        <p className="mt-1 text-2xl font-bold text-emerald-400">
          Turno {character.turn}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Salute" value={character.health} rangeType="normalized" />
        <StatCard label="Felicita" value={character.happiness} rangeType="normalized" />
        <StatCard label="Denaro" value={character.money} />
        <StatCard label="Effetti in coda" value={pendingEffects.length} />
      </div>

      <dl className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-xs text-slate-300 space-y-1">
        <DebugRow label="career" value={character.career} />
        <DebugRow label="relationships" value={character.relationships} />
        <DebugRow label="skills" value={character.skills} />
      </dl>

      <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-4">
        <h2 className="text-lg font-semibold text-slate-100">{event.title}</h2>
        <p className="mt-1 text-sm text-slate-400">{event.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              className="rounded-md bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-4">
        <h3 className="text-sm font-semibold text-slate-200">Progressione</h3>
        <p className="mt-1 text-xs text-slate-400">
          Milestone sbloccate: {unlockedMilestones.length}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {unlockedMilestones.map((id) => (
            <span
              key={id}
              className="rounded-full border border-emerald-700 bg-emerald-900/30 px-2 py-1 text-xs text-emerald-300"
            >
              {id}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Storico eventi</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {eventHistory.slice(-8).reverse().map((e) => (
              <li key={`${e.turn}-${e.eventId}-${e.choiceId}`}>
                T{e.turn} · {e.eventId} · scelta `{e.choiceId}`
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Storico effetti</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {effectHistory.slice(-8).reverse().map((e, i) => (
              <li key={`${e.turn}-${e.source}-${i}`}>
                T{e.turn} · {e.source} · {e.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Store Snapshot (debug)
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">
{JSON.stringify(
  {
    character,
    currentEventId,
    pendingEffects,
    lastEvent,
    unlockedMilestones,
  },
  null,
  2,
)}
        </pre>
      </div>

      <button
        type="button"
        onClick={() => resetCharacter()}
        className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 w-full"
      >
        Reset
      </button>
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  rangeType?: "normalized";
};

function StatCard({ label, value, rangeType }: StatCardProps) {
  const tone =
    rangeType === "normalized"
      ? value < 30
        ? "text-rose-300"
        : value < 60
          ? "text-amber-300"
          : "text-emerald-300"
      : "text-slate-100";
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

type DebugRowProps = {
  label: string;
  value: number;
};

function DebugRow({ label, value }: DebugRowProps) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
