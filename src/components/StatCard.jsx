// Readout taktis: dirender di dalam satu panel bersama (lihat DispatchBoard).
export default function StatCard({ index, label, value, unit, accent }) {
  return (
    <div className="bg-panel p-4">
      <div className="font-mono text-[10px] font-medium text-mute">
        {index}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`font-mono text-4xl font-bold ${
            accent ? "text-lime" : "text-text"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
