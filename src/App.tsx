import { CounterBadge } from "@/components/CounterBadge";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Digital Life Simulator
      </h1>
      <p className="text-slate-400 text-center max-w-2xl">
        Dashboard minimale per debug realtime dello store (variabili + turno
        corrente) con core loop hardcoded: evento, scelta, risoluzione effetti,
        avanzamento turno.
      </p>
      <p className="text-slate-500 text-center max-w-2xl text-sm">
        Stack: Vite · React · TypeScript · Tailwind · Zustand — struttura{" "}
        <code className="text-emerald-400">/components</code>,{" "}
        <code className="text-emerald-400">/store</code>,{" "}
        <code className="text-emerald-400">/engine</code>,{" "}
        <code className="text-emerald-400">/data</code>.
      </p>
      <CounterBadge />
    </div>
  );
}

export default App;
