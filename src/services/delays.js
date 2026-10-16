import { requireDb } from "../lib/supabase.js";

export function currentShift() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Pagi";
  if (h >= 14 && h < 22) return "Siang";
  return "Malam";
}

export async function startDelay({ unit_code, delay_code, note }) {
  const db = requireDb();
  const { data, error } = await db
    .from("delay_logs")
    .insert({
      unit_code,
      delay_code,
      note: note || null,
      shift: currentShift(),
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endDelay(id) {
  const db = requireDb();
  const { data: row, error: fetchErr } = await db
    .from("delay_logs")
    .select("started_at")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;
  const endedAt = new Date();
  const durationMin =
    Math.round(((endedAt - new Date(row.started_at)) / 60000) * 10) / 10;
  const { error } = await db
    .from("delay_logs")
    .update({
      ended_at: endedAt.toISOString(),
      duration_min: durationMin,
    })
    .eq("id", id);
  if (error) throw error;
  return durationMin;
}

export async function fetchActiveDelays() {
  const db = requireDb();
  const { data, error } = await db
    .from("delay_logs")
    .select("*")
    .is("ended_at", null)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDelayHistory(limit = 20) {
  const db = requireDb();
  const { data, error } = await db
    .from("delay_logs")
    .select("*")
    .not("ended_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Total menit delay per kode (untuk grafik Pareto). */
export async function fetchDelaySummary() {
  const db = requireDb();
  const { data, error } = await db
    .from("delay_logs")
    .select("delay_code, duration_min")
    .not("ended_at", "is", null);
  if (error) throw error;
  const totals = {};
  for (const row of data ?? []) {
    const mins = Number(row.duration_min) || 0;
    totals[row.delay_code] = (totals[row.delay_code] || 0) + mins;
  }
  return Object.entries(totals)
    .map(([code, minutes]) => ({
      code,
      minutes: Math.round(minutes * 10) / 10,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}
