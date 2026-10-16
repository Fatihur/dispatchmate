// 4 tick sudut L-shape untuk panel. Pakai di dalam container `relative`.
export default function CornerTicks() {
  const base = "pointer-events-none absolute z-10 h-3 w-3 border-lime/70";
  return (
    <>
      <span className={`${base} left-1.5 top-1.5 border-l-2 border-t-2`} />
      <span className={`${base} right-1.5 top-1.5 border-r-2 border-t-2`} />
      <span className={`${base} bottom-1.5 left-1.5 border-b-2 border-l-2`} />
      <span className={`${base} bottom-1.5 right-1.5 border-b-2 border-r-2`} />
    </>
  );
}
