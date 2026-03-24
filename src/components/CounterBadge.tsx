import { useAppStore } from "@/store/useAppStore";

export function CounterBadge() {
  const count = useAppStore((s) => s.count);
  const increment = useAppStore((s) => s.increment);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 font-mono text-sm text-slate-300">
        Contatore store: <span className="text-emerald-400">{count}</span>
      </div>
      <button
        type="button"
        onClick={() => increment()}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Incrementa (Zustand)
      </button>
    </div>
  );
}
