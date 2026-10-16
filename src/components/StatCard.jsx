export default function StatCard({ label, value, unit, accent }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-mute">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className="font-mono text-3xl font-bold"
          style={accent ? { color: "#E9F40B" } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-mute">{unit}</span>}
      </div>
    </div>
  );
}
