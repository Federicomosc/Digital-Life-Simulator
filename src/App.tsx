import { CounterBadge } from "@/components/CounterBadge";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Digital Life Simulator
      </h1>
      <p className="text-slate-400 text-center max-w-md">
        Vite · React · TypeScript · Tailwind · Zustand — struttura{" "}
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
