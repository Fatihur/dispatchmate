// Semua waktu tampil dalam WITA (Asia/Makassar).
export const WITA_TZ = "Asia/Makassar";
const WITA_OFFSET = "+08:00";

/** "16 Okt 2026, 17.59" */
export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: WITA_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "16 Okt 2026" */
export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    timeZone: WITA_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Durasi ms → "2 jam 15 mnt" / "45 mnt" / "30 dtk" */
export function fmtDuration(ms) {
  if (ms == null || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} jam ${m} mnt`;
  if (m > 0) return `${m} mnt`;
  return `${s} dtk`;
}

/**
 * Nilai untuk <input type="datetime-local"> dari sebuah instant (ISO),
 * dinyatakan sebagai waktu dinding WITA ("YYYY-MM-DDTHH:MM").
 */
export function toWitaInputValue(iso) {
  const d = iso ? new Date(iso) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WITA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Nilai datetime-local ("YYYY-MM-DDTHH:MM") → ISO instant,
 * diinterpretasikan sebagai waktu WITA.
 */
export function fromWitaInputValue(str) {
  if (!str) return null;
  return new Date(`${str}:00${WITA_OFFSET}`).toISOString();
}

/** Sekarang + n menit, sebagai nilai datetime-local WITA. */
export function witaInputPlusMinutes(n) {
  return toWitaInputValue(new Date(Date.now() + n * 60000).toISOString());
}
