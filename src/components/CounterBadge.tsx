import { delta } from "@/data/effects";
import { useGameStore } from "@/store/useGameStore";

export function CounterBadge() {
  const character = useGameStore((s) => s.character);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const updateVariable = useGameStore((s) => s.updateVariable);
  const applyEffects = useGameStore((s) => s.applyEffects);
  const resetCharacter = useGameStore((s) => s.resetCharacter);

  return (
    <div className="flex flex-col items-center gap-4 max-w-md w-full">
      <dl className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-xs text-slate-300 space-y-1">
        <div className="flex justify-between">
          <dt>turn</dt>
          <dd className="text-emerald-400">{character.turn}</dd>
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
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => nextTurn()}
          className="rounded-md bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
        >
          Prossimo turno
        </button>
        <button
          type="button"
          onClick={() => updateVariable("health", 100)}
          className="rounded-md bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
        >
          Salute → 100
        </button>
        <button
          type="button"
          onClick={() => applyEffects([delta("happiness", 2)])}
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white hover:bg-emerald-600"
        >
          +2 felicità (bundle)
        </button>
        <button
          type="button"
          onClick={() => resetCharacter()}
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
