import { requireDb } from "../lib/supabase.js";

export async function recordCycle({
  unit_code,
  shovel_code,
  started_at,
  ended_at,
  cycle_min,
}) {
  const db = requireDb();
  const { error } = await db.from("cycle_records").insert({
    unit_code,
    shovel_code: shovel_code || null,
    started_at,
    ended_at,
    cycle_min,
  });
  if (error) throw error;
}

/** Ritase hari ini + rata-rata cycle time (menit). */
export async function fetchTodayStats() {
  const db = requireDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await db
    .from("cycle_records")
    .select("cycle_min")
    .gte("created_at", start.toISOString());
  if (error) throw error;
  const rows = data ?? [];
  const ritase = rows.length;
  const avg =
    ritase > 0
      ? Math.round(
          (rows.reduce((s, r) => s + (Number(r.cycle_min) || 0), 0) / ritase) *
            10
        ) / 10
      : 0;
  return { ritase, avgCycle: avg };
}
