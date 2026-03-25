import { useMemo, useState } from "react";
import { ARCHETYPES, type ArchetypeId } from "@/data/archetypes";
import {
  SLOT_COUNT,
  ACTIVE_SLOT_KEY,
  getActiveSlotIndex,
  getSlotStorageKey,
  setActiveArchetype,
  setActiveSlotIndex,
} from "@/store/slotStorage";
import { GameDashboard } from "@/components/GameDashboard";
import { useGameStore } from "@/store/useGameStore";

type SlotSummary = {
  slotIndex: number;
  hasSave: boolean;
  turn?: number;
  archetypeId?: string;
  health?: number;
  happiness?: number;
};

function parsePersistedState(raw: string): unknown {
  try {
    const parsed: unknown = JSON.parse(raw);
    // Zustand persist usually stores { state, version }
    if (parsed && typeof parsed === "object" && "state" in parsed) {
      const obj = parsed as Record<string, unknown>;
      return obj.state;
    }
    return parsed;
  } catch {
    return null;
  }
}

function computeSlotSummaries(): SlotSummary[] {
  const out: SlotSummary[] = [];
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const key = getSlotStorageKey(i);
    const raw = localStorage.getItem(key);
    if (!raw) {
      out.push({ slotIndex: i, hasSave: false });
      continue;
    }
    const state = parsePersistedState(raw);
    const stateObj =
      state && typeof state === "object" ? (state as Record<string, unknown>) : null;
    const character = stateObj?.character && typeof stateObj.character === "object"
      ? (stateObj.character as Record<string, unknown>)
      : null;
    out.push({
      slotIndex: i,
      hasSave: true,
      turn: typeof character?.turn === "number" ? character?.turn : undefined,
      archetypeId:
        typeof stateObj?.archetypeId === "string" ? stateObj.archetypeId : undefined,
      health: typeof character?.health === "number" ? character?.health : undefined,
      happiness:
        typeof character?.happiness === "number" ? character?.happiness : undefined,
    });
  }
  return out;
}

export function LoadScreen() {
  const [screen, setScreen] = useState<"home" | "archetype">("home");
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeId | null>(null);

  const slotSummaries = useMemo(() => computeSlotSummaries(), []);
  // Obbligo di rerender: così se l'utente cancella/carica dal GameDashboard
  // e cambia localStorage, questo componente si aggiorna.
  useGameStore((s) => s.character.turn);

  const activeSlot = getActiveSlotIndex();
  const occupiedSlots = slotSummaries.filter((s) => s.hasSave).length;

  // Se uno slot è già attivo (es. dopo reload da LoadScreen), mostriamo direttamente la partita.
  if (activeSlot !== null) return <GameDashboard />;

  if (screen === "home") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/25 p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-600 text-slate-300">
            ◌
          </div>
          <h1 className="text-center text-4xl font-semibold text-slate-100">
            Digital Life
          </h1>
          <p className="mt-1 text-center text-slate-400">Simulatore di vita</p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-900 hover:bg-white"
              onClick={() => setScreen("archetype")}
            >
              Nuova partita
            </button>
            <button
              type="button"
              disabled={occupiedSlots === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-lg font-semibold text-slate-100 hover:bg-slate-700/20 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                const firstSaved = slotSummaries.find((s) => s.hasSave)?.slotIndex ?? 0;
                setSelectedSlot(firstSaved);
                setActiveSlotIndex(firstSaved);
                window.location.reload();
              }}
            >
              Carica partita
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                {occupiedSlots} slot
              </span>
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-600 px-4 py-3 text-lg font-semibold text-slate-300 hover:bg-slate-700/20"
            >
              Impostazioni
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            v1.0 — progetto accademico
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xl text-slate-400">Passo 1 di 2</p>
          <h1 className="text-5xl font-semibold text-slate-50">Scegli il tuo archetipo</h1>
        </div>
        <button
          type="button"
          onClick={() => setScreen("home")}
          className="text-3xl leading-none text-slate-400 hover:text-slate-200"
          aria-label="Torna alla home"
        >
          …
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {ARCHETYPES.map((a) => (
          <div
            key={a.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedArchetype(a.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelectedArchetype(a.id);
            }}
            className={`cursor-pointer rounded-2xl border px-5 py-4 ${
              selectedArchetype === a.id
                ? "border-blue-500 bg-slate-900/55 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                : "border-slate-600/70 bg-slate-900/35"
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/90 text-slate-900">
              {a.id === "student" ? "◔" : a.id === "worker" ? "▣" : "◍"}
            </div>
            <h3 className="text-3xl font-semibold text-slate-100">{a.label}</h3>
            <p className="mt-1 min-h-[44px] text-sm text-slate-400">{a.description}</p>
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              {[
                ["Competenze", a.initialCharacter.skills],
                ["Denaro", Math.min(100, a.initialCharacter.money)],
                ["Salute", a.initialCharacter.health],
                ["Relazioni", a.initialCharacter.relationships],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between">
                    <span>{label}</span>
                  </div>
                  <div className="h-1.5 rounded bg-slate-700/70">
                    <div
                      className="h-1.5 rounded bg-emerald-400/80"
                      style={{ width: `${Math.max(2, Number(value))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/20 px-4 py-4">
        <p className="text-sm text-slate-400">Slot di salvataggio</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {slotSummaries.map((s) => (
            <button
              key={s.slotIndex}
              type="button"
              onClick={() => setSelectedSlot(s.slotIndex)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                selectedSlot === s.slotIndex
                  ? "border-emerald-500 bg-emerald-900/25 text-emerald-200"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              Slot {s.slotIndex} {s.hasSave ? `· T${s.turn ?? "-"}` : "· Vuoto"}
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!selectedArchetype}
          className="rounded-xl bg-slate-100 px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => {
            if (!selectedArchetype) return;
            setActiveSlotIndex(selectedSlot);
            setActiveArchetype(selectedArchetype);
            localStorage.removeItem(getSlotStorageKey(selectedSlot));
            window.location.reload();
          }}
        >
          Inizia la partita
        </button>
      </div>

      <section className="rounded-2xl border border-slate-700/40 bg-slate-900/10 px-4 py-4">
        <p className="mb-2 text-sm text-slate-400">Utility salvataggi</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/40"
            onClick={() => {
              setActiveSlotIndex(selectedSlot);
              window.location.reload();
            }}
          >
            Carica slot selezionato
          </button>
          <button
            type="button"
            className="rounded-lg border border-rose-900/50 px-3 py-2 text-sm text-rose-200 hover:bg-rose-900/20"
            onClick={() => {
              for (let i = 0; i < SLOT_COUNT; i += 1) {
                localStorage.removeItem(getSlotStorageKey(i));
              }
              localStorage.removeItem(ACTIVE_SLOT_KEY);
              window.location.reload();
            }}
          >
            Cancella tutti i salvataggi
          </button>
        </div>
      </section>
    </div>
  );
}

