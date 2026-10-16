// Kode delay standar + label Indonesia + warna badge
export const DELAY_CODES = {
  QUE: { label: "Antre di shovel", color: "#F59E0B" },
  RFL: { label: "Isi solar / refuel", color: "#8B5CF6" },
  BRK: { label: "Breakdown", color: "#EF4444" },
  WTH: { label: "Cuaca / hujan", color: "#38BDF8" },
  RD: { label: "Jalan rusak", color: "#A16207" },
  SC: { label: "Ganti shift", color: "#6366F1" },
  IDL: { label: "Idle / menunggu instruksi", color: "#8A94A3" },
  MTN: { label: "Maintenance", color: "#14B8A6" },
};

export const DELAY_CODE_LIST = Object.keys(DELAY_CODES);

// Status unit + label Indonesia + warna badge
export const STATUS_META = {
  standby: { label: "Standby", color: "#6B7280", bg: "rgba(107,114,128,.15)" },
  loading: { label: "Loading", color: "#E9F40B", bg: "rgba(233,244,11,.12)" },
  hauling: { label: "Hauling", color: "#60A5FA", bg: "rgba(96,165,250,.15)" },
  dumping: { label: "Dumping", color: "#FBBF24", bg: "rgba(251,191,36,.15)" },
  returning: { label: "Returning", color: "#34D399", bg: "rgba(52,211,153,.15)" },
  queuing: { label: "Antre", color: "#FB923C", bg: "rgba(251,146,60,.15)" },
  refuel: { label: "Refuel", color: "#A78BFA", bg: "rgba(167,139,250,.15)" },
  breakdown: { label: "Breakdown", color: "#F87171", bg: "rgba(248,113,113,.15)" },
};

// Urutan status untuk ganti manual (klik badge)
export const MANUAL_STATUS_ORDER = [
  "standby",
  "loading",
  "hauling",
  "dumping",
  "returning",
  "queuing",
  "refuel",
  "breakdown",
];

export const TYPE_LABELS = {
  haul_truck: "Haul Truck",
  excavator: "Excavator",
  dozer: "Dozer",
  grader: "Grader",
};
