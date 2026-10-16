import { requireDb } from "../lib/supabase.js";

export async function fetchClosures() {
  const db = requireDb();
  const { data, error } = await db
    .from("road_closures")
    .select("*")
    .order("starts_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createClosure(payload) {
  const db = requireDb();
  const { data, error } = await db
    .from("road_closures")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateClosure(id, patch) {
  const db = requireDb();
  const { data, error } = await db
    .from("road_closures")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
