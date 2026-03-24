import { GameDashboard } from "@/components/GameDashboard";

function App() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <a
        href="#main"
        className="absolute -left-[9999px] z-50 rounded-md bg-emerald-700 px-4 py-2 text-sm text-white focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        Vai al contenuto
      </a>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-500/90">
            Fase 3 · Contenuto · Bilanciamento · Rifinitura
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">
            Digital Life Simulator
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Simulatore a turni: eventi da catalogo, condizioni e pesi, effetti immediati
            e ritardati, regole di sistema e progressione. Stato e cronologia persistiti in
            locale con versionamento.
          </p>
        </header>

        <main id="main">
          <GameDashboard />
        </main>

        <footer className="border-t border-slate-800 pt-6 text-center text-xs text-slate-600 sm:text-left">
          Stack: Vite · React · TypeScript · Tailwind · Zustand —{" "}
          <span className="text-slate-500">
            <code className="text-emerald-600/90">/data</code> ·{" "}
            <code className="text-emerald-600/90">/engine</code> ·{" "}
            <code className="text-emerald-600/90">/store</code> ·{" "}
            <code className="text-emerald-600/90">/components</code>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
