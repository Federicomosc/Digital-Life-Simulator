type StatBarProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
};

export function StatBar({ label, value, min = 0, max = 100 }: StatBarProps) {
  const pct = max > min ? Math.round(((value - min) / (max - min)) * 100) : 0;
  const clamped = Math.max(0, Math.min(100, pct));

  let barClass = "bg-emerald-500";
  if (value < 30) barClass = "bg-rose-500";
  else if (value < 55) barClass = "bg-amber-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-200">{value}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={`${label}: ${value} su ${max}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${barClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
