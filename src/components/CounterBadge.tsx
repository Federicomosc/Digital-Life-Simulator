import { getHardcodedEvent } from "@/engine/coreLoop";
import { useGameStore } from "@/store/useGameStore";

export function CounterBadge() {
  const character = useGameStore((s) => s.character);
  const resetCharacter = useGameStore((s) => s.resetCharacter);
  const pendingCount = useGameStore((s) => s.pendingEffects.length);
  const choose = useGameStore((s) => s.choose);
  const event = getHardcodedEvent(character);

  return (
    <div className="flex flex-col items-center gap-4 max-w-md w-full">
      <dl className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-xs text-slate-300 space-y-1">
        <div className="flex justify-between">
          <dt>turn</dt>
          <dd className="text-emerald-400">{character.turn}</dd>
        </div>
        <div className="flex justify-between">
          <dt>pendingEffects</dt>
          <dd>{pendingCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt>health</dt>
          <dd>{character.health}</dd>
        </div>
        <div className="flex justify-between">
          <dt>happiness</dt>
          <dd>{character.happiness}</dd>
        </div>
        <div className="flex justify-between">
          <dt>money</dt>
          <dd>{character.money}</dd>
        </div>
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

      <button
        type="button"
        onClick={() => resetCharacter()}
        className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 w-full"
      >
        Reset
      </button>
    </div>
  );
}
