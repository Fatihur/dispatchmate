import { AREAS, SEVERITIES, maxSeverity } from "../data/pitroad.js";
import SectionHeader from "./SectionHeader.jsx";

// Geometri skematis 6 zona (viewBox 800x500). BUKAN posisi GPS.
const ZONES = [
  { id: "PIT_A", x: 20, y: 20, w: 230, h: 140 },
  { id: "PIT_B", x: 270, y: 20, w: 230, h: 140 },
  { id: "ROM_PAD", x: 520, y: 20, w: 240, h: 140 },
  { id: "RAMP_UTAMA", x: 20, y: 180, w: 740, h: 64, road: true },
  { id: "PIT_C", x: 20, y: 264, w: 360, h: 150 },
  { id: "DISPOSAL", x: 400, y: 264, w: 360, h: 150 },
];

export default function PitMap({ hazards, onSelectArea }) {
  const openByArea = {};
  for (const h of hazards) {
    if (h.status === "resolved") continue;
    (openByArea[h.area] = openByArea[h.area] || []).push(h);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SectionHeader index="01" title="Peta Pit" className="flex-1" />
        <span className="rounded border border-yellow-500/50 bg-yellow-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-yellow-300">
          Peta skematis — bukan posisi GPS
        </span>
      </div>

      <div className="rounded-xl border border-line bg-panel p-4">
        <svg viewBox="0 0 800 500" className="h-auto w-full" role="img" aria-label="Peta skematis area tambang">
          {/* dotted grid latar */}
          <defs>
            <pattern id="pitdots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#1a222c" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="800" height="500" fill="url(#pitdots)" opacity="0.6" />

          {ZONES.map((z) => {
            const list = openByArea[z.id] || [];
            const worst = maxSeverity(list.map((h) => h.severity));
            const worstColor = worst ? SEVERITIES[worst].color : null;
            const cx = z.x + z.w / 2;
            const cy = z.y + z.h / 2;
            const bx = z.x + z.w - 26;
            const by = z.y + 22;
            return (
              <g
                key={z.id}
                onClick={() => onSelectArea(z.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`${AREAS[z.id].label}: ${list.length} hazard terbuka`}
              >
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx={z.road ? 10 : 6}
                  fill={worstColor ? `${worstColor}14` : "#10141A"}
                  stroke={worstColor || "#232B36"}
                  strokeWidth={worstColor ? 2 : 1.5}
                  className="transition-all hover:stroke-lime"
                />
                {z.road && (
                  <line
                    x1={z.x + 16}
                    y1={cy}
                    x2={z.x + z.w - 16}
                    y2={cy}
                    stroke="#8A94A3"
                    strokeWidth="2"
                    strokeDasharray="14 10"
                    opacity="0.7"
                  />
                )}
                <text
                  x={z.road ? z.x + 18 : cx}
                  y={z.road ? cy - 12 : cy - 4}
                  textAnchor={z.road ? "start" : "middle"}
                  fill="#F2F4F7"
                  fontSize="15"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="2"
                >
                  {AREAS[z.id].label.toUpperCase()}
                </text>
                <text
                  x={z.road ? z.x + 18 : cx}
                  y={z.road ? cy + 22 : cy + 18}
                  textAnchor={z.road ? "start" : "middle"}
                  fill="#8A94A3"
                  fontSize="11"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="1"
                >
                  {list.length === 0 ? "AMAN" : `${list.length} HAZARD TERBUKA`}
                </text>
                {/* badge jumlah */}
                <circle
                  cx={bx}
                  cy={by}
                  r="15"
                  fill={worstColor || "transparent"}
                  stroke={worstColor || "#3a4450"}
                  strokeWidth="1.5"
                />
                <text
                  x={bx}
                  y={by + 5}
                  textAnchor="middle"
                  fill={worstColor ? "#0B0E11" : "#8A94A3"}
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {list.length}
                </text>
              </g>
            );
          })}
        </svg>

        {/* legenda */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Legenda severity:</span>
          {Object.entries(SEVERITIES).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 font-mono text-[11px] text-mute">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: v.color }} />
              {v.label}
            </span>
          ))}
          <span className="ml-auto font-mono text-[10px] text-mute">Klik zona untuk memfilter Papan Hazard</span>
        </div>
      </div>
    </div>
  );
}
