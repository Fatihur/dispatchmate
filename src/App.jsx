import { useEffect, useState } from "react";
import DispatchBoard from "./components/DispatchBoard.jsx";
import DelayLogger from "./components/DelayLogger.jsx";

const TABS = [
  { id: "board", label: "Dispatch Board" },
  { id: "delays", label: "Delay Logger" },
];

function currentShift() {
  const h = new Date().getHours();
  return h >= 6 && h < 14 ? "Pagi" : h >= 14 && h < 22 ? "Siang" : "Malam";
}

export default function App() {
  const [tab, setTab] = useState("board");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const shift = currentShift();
  const clock = now.toLocaleTimeString("id-ID", {
    hour12: false,
    timeZone: "Asia/Makassar",
  });

  return (
    <div className="min-h-screen bg-ink font-sans text-text">
      {/* dotted grid backdrop */}
      <div
        aria-hidden
        className="bg-dotted-grid pointer-events-none fixed inset-0"
      />

      <div className="relative">
        {/* command bar */}
        <header className="border-b border-line bg-panel/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-lime font-display text-sm font-extrabold text-black">
              DM
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] font-extrabold tracking-tight">
                DISPATCHMATE
              </div>
              <div className="mt-1 hidden font-mono text-[9px] tracking-[0.22em] text-mute sm:block">
                MINE OPS CONSOLE
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="hidden font-mono text-sm font-bold text-text md:inline">
                {clock}
              </span>
              <span className="hidden rounded-full border border-line bg-panel2 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-mute sm:inline">
                SHIFT {shift.toUpperCase()}
              </span>
              {/* segmented tab switcher */}
              <div className="flex rounded-lg border border-line bg-panel2 p-0.5">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                      tab === t.id
                        ? "bg-lime text-black"
                        : "text-mute hover:text-text"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          {tab === "board" ? <DispatchBoard /> : <DelayLogger />}
        </main>

        <footer className="border-t border-line py-3 text-center font-mono text-[10px] tracking-[0.2em] text-mute">
          DISPATCHMATE v1.1 · SUPABASE CONNECTED · SHIFT {shift.toUpperCase()}
        </footer>
      </div>
    </div>
  );
}
