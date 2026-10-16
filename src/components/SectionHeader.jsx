// Pola header section global: index mono + judul display + rule horizontal.
export default function SectionHeader({ index, title, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="font-mono text-[11px] font-bold text-lime">
        {index}
      </span>
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-text">
        {title}
      </h2>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
