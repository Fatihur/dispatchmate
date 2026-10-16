// Konstanta domain PitRoad: label Indonesia + warna.

export const AREAS = {
  PIT_A: { label: "Pit A" },
  PIT_B: { label: "Pit B" },
  PIT_C: { label: "Pit C" },
  RAMP_UTAMA: { label: "Ramp Utama" },
  DISPOSAL: { label: "Disposal" },
  ROM_PAD: { label: "ROM Pad" },
};
export const AREA_LIST = Object.keys(AREAS);

export const HAZARD_TYPES = {
  lubang: { label: "Lubang / pothole", color: "#F59E0B" },
  debu: { label: "Debu berlebih", color: "#A16207" },
  licin: { label: "Jalan licin", color: "#38BDF8" },
  batu_jatuh: { label: "Batu jatuh / rockfall", color: "#EF4444" },
  genangan: { label: "Genangan air", color: "#0EA5E9" },
  blind_spot: { label: "Blind spot", color: "#A78BFA" },
  lainnya: { label: "Lainnya", color: "#8A94A3" },
};
export const HAZARD_TYPE_LIST = Object.keys(HAZARD_TYPES);

export const SEVERITIES = {
  kritis: { label: "Kritis", color: "#EF4444" },
  tinggi: { label: "Tinggi", color: "#FB923C" },
  sedang: { label: "Sedang", color: "#FBBF24" },
  rendah: { label: "Rendah", color: "#34D399" },
};
export const SEVERITY_LIST = Object.keys(SEVERITIES);
const SEVERITY_RANK = { kritis: 4, tinggi: 3, sedang: 2, rendah: 1 };
export function maxSeverity(sevs) {
  let best = null;
  for (const s of sevs) {
    if (!best || (SEVERITY_RANK[s] || 0) > (SEVERITY_RANK[best] || 0)) best = s;
  }
  return best;
}

export const HAZARD_STATUS = {
  open: { label: "Terbuka", color: "#38BDF8" },
  assigned: { label: "Ditugaskan", color: "#A78BFA" },
  in_progress: { label: "Dikerjakan", color: "#FBBF24" },
  resolved: { label: "Selesai", color: "#34D399" },
};
export const HAZARD_STATUS_LIST = Object.keys(HAZARD_STATUS);

export const CLOSURE_REASONS = {
  blasting: { label: "Blasting / peledakan", color: "#EF4444" },
  maintenance: { label: "Maintenance jalan", color: "#F59E0B" },
  weather: { label: "Cuaca", color: "#38BDF8" },
  accident: { label: "Kecelakaan", color: "#FB923C" },
  lainnya: { label: "Lainnya", color: "#8A94A3" },
};
export const CLOSURE_REASON_LIST = Object.keys(CLOSURE_REASONS);

export const CLOSURE_STATUS = {
  scheduled: { label: "Terjadwal", color: "#38BDF8" },
  active: { label: "Aktif", color: "#EF4444" },
  lifted: { label: "Dicabut", color: "#34D399" },
};
export const CLOSURE_STATUS_LIST = Object.keys(CLOSURE_STATUS);
