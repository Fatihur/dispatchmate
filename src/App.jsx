import { useState } from "react";
import DispatchBoard from "./components/DispatchBoard.jsx";
import DelayLogger from "./components/DelayLogger.jsx";

const TABS = [
  { id: "board", label: "Dispatch Board" },
  { id: "delays", label: "Delay Logger" },
];

export default function App() {
  const [tab, setTab] = useState("board");

  return (
    <div className="min-h-screen bg-ink font-sans text-white">
      {/* header */}
      <header className="border-b border-line bg-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime font-mono text-lg font-black text-black">
            D
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">
              Dispatch<span className="text-lime">Mate</span>
            </h1>
            <p className="text-[11px] text-mute">
              Tools bantu dispatcher tambang — monitoring armada & pencatatan
              delay
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-mute sm:flex">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-lime" />
            Shift{" "}
            {(() => {
              const h = new Date().getHours();
              return h >= 6 && h < 14
                ? "Pagi"
                : h >= 14 && h < 22
                  ? "Siang"
                  : "Malam";
            })()}
          </div>
        </div>
        {/* tab nav */}
        <nav className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                tab === t.id
                  ? "bg-ink text-lime"
                  : "text-mute hover:text-white"
              }`}
              style={
                tab === t.id
                  ? { boxShadow: "inset 0 2px 0 #E9F40B" }
                  : undefined
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === "board" ? <DispatchBoard /> : <DelayLogger />}
      </main>

      <footer className="border-t border-line py-4 text-center text-xs text-mute">
        DispatchMate — tools bantu operasional dispatcher. Data tersimpan di
        database Supabase.
      </footer>
    </div>
  );
}
