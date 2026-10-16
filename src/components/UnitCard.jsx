import {
  STATUS_META,
  TYPE_LABELS,
  MANUAL_STATUS_ORDER,
} from "../data/delayCodes.js";

export default function UnitCard({
  unit,
  shovels,
  onAssign,
  onStatusChange,
  simOn,
}) {
  const meta = STATUS_META[unit.status] || STATUS_META.standby;
  const isTruck = unit.type === "haul_truck";

  const cycleStatus = () => {
    const idx = MANUAL_STATUS_ORDER.indexOf(unit.status);
    const next =
      MANUAL_STATUS_ORDER[(idx + 1) % MANUAL_STATUS_ORDER.length];
    onStatusChange(unit.code, next);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel py-3 pl-5 pr-4 transition-colors hover:border-mute">
      {/* tick status kiri */}
      <span
        aria-hidden
        className="absolute bottom-3 left-0 top-3 w-[2px] rounded-full"
        style={{ background: meta.color }}
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-lg font-bold leading-tight text-text">
            {unit.code}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
            {TYPE_LABELS[unit.type] || unit.type}
          </div>
        </div>
        <button
          onClick={cycleStatus}
          disabled={simOn}
          title={
            simOn
              ? "Matikan simulasi untuk ubah status manual"
              : "Klik untuk ganti status"
          }
          className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            color: meta.color,
            background: meta.bg,
            border: `1px solid ${meta.color}55`,
          }}
        >
          {meta.label}
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {isTruck ? (
          <label className="flex w-full items-center gap-2 text-xs text-mute">
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider">
              Shovel
            </span>
            <select
              value={unit.assigned_to || ""}
              onChange={(e) => onAssign(unit.code, e.target.value || null)}
              className="w-full rounded-md border border-line bg-panel2 px-2 py-1.5 font-mono text-xs text-text outline-none focus:border-lime"
            >
              <option value="">— tidak ditugaskan —</option>
              {shovels.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="font-mono text-[11px] text-mute">
            {unit.assigned_to
              ? `Melayani: ${unit.assigned_to}`
              : "Belum ada penugasan"}
          </span>
        )}
      </div>
    </div>
  );
}
