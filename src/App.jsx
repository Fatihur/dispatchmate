import { useEffect, useState } from "react";
import HazardBoard from "./components/HazardBoard.jsx";
import ClosureBoard from "./components/ClosureBoard.jsx";
import PitMapView from "./components/PitMap.jsx";
import Analytics from "./components/Analytics.jsx";
import { fetchHazards } from "./services/hazards.js";

const TABS = [
  { id: "hazards", label: "Papan Hazard" },
  { id: "closures", label: "Penutupan Jalan" },
  { id: "map", label: "Peta Pit" },
  { id: "analytics", label: "Analitik" },
];

function currentShift() {
  const h = new Date().getHours();
  return h >= 6 && h < 14 ? "Pagi" : h >= 14 && h < 22 ? "Siang" : "Malam";
}

export default function App() {
  const [tab, setTab] = useState("hazards");
  const [now, setNow] = useState(() => new Date());
  const [areaFilter, setAreaFilter] = useState(null);
  const [mapHazards, setMapHazards] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // data ringan untuk Peta Pit (di-refresh tiap buka tab peta)
  useEffect(() => {
    if (tab !== "map") return;
    fetchHazards().then(setMapHazards).catch(() => {});
  }, [tab ]);

  const shift = currentShift();
  const clock = now.toLocaleTimeString("id-ID", {
    hour12: false,
    timeZone: "Asia/Makassar",
  });

  const selectArea = (area) => {
    setAreaFilter(area);
    setTab("hazards");
  };

  return (
    <div className="min-h-screen bg-ink font-sans text-text">
      <div aria-hidden className="bg-dotted-grid pointer-events-none fixed inset-0" />

      <div className="relative">
        <header className="border-b border-line bg-panel/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-lime font-display text-sm font-extrabold text-black">
              PR
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] font-extrabold tracking-tight">
                PITROAD
              </div>
              <div className="mt-1 hidden font-mono text-[9px] tracking-[0.22em] text-mute sm:block">
                ROAD OPS CONSOLE
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="hidden font-mono text-sm font-bold text-text md:inline">
                {clock}
              </span>
              <span className="hidden rounded-full border border-line bg-panel2 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-mute sm:inline">
                SHIFT {shift.toUpperCase()}
              </span>
              <div className="flex max-w-[46vw] overflow-x-auto rounded-lg border border-line bg-panel2 p-0.5 sm:max-w-none">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors sm:px-3 ${
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

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          {tab === "hazards" && (
            <HazardBoard
              areaFilter={areaFilter}
              onClearAreaFilter={() => setAreaFilter(null)}
            />
          )}
          {tab === "closures" && <ClosureBoard />}
          {tab === "map" && <PitMapView hazards={mapHazards} onSelectArea={selectArea} />}
          {tab === "analytics" && <Analytics />}
        </main>

        <footer className="border-t border-line py-3 text-center font-mono text-[10px] tracking-[0.2em] text-mute">
          PITROAD v1.0 · SUPABASE CONNECTED · SHIFT {shift.toUpperCase()}
        </footer>
      </div>
    </div>
  );
}
