import { requireDb } from "../lib/supabase.js";

export async function fetchHazards() {
  const db = requireDb();
  const { data, error } = await db
    .from("hazard_reports")
    .select("*")
    .order("reported_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createHazard(payload) {
  const db = requireDb();
  const { data, error } = await db
    .from("hazard_reports")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateHazard(id, patch) {
  const db = requireDb();
  const { data, error } = await db
    .from("hazard_reports")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Unit pendukung (dozer/grader) untuk dropdown penugasan. */
export async function fetchSupportUnits() {
  const db = requireDb();
  const { data, error } = await db
    .from("units")
    .select("code, type")
    .in("type", ["dozer", "grader"])
    .order("code");
  if (error) throw new Error(error.message);
  return data;
}
