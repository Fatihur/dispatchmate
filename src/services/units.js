import { requireDb } from "../lib/supabase.js";

export async function fetchUnits() {
  const db = requireDb();
  const { data, error } = await db
    .from("units")
    .select("*")
    .order("code", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateUnitStatus(code, status) {
  const db = requireDb();
  const { error } = await db
    .from("units")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("code", code);
  if (error) throw error;
}

export async function assignUnit(code, shovelCode) {
  const db = requireDb();
  const { error } = await db
    .from("units")
    .update({
      assigned_to: shovelCode || null,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code);
  if (error) throw error;
}

/** Subscribe to realtime changes on units. Returns an unsubscribe fn. */
export function subscribeUnits(onEvent) {
  const db = requireDb();
  const channel = db
    .channel("units-rt")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "units" },
      (payload) => onEvent(payload)
    )
    .subscribe();
  return () => {
    db.removeChannel(channel);
  };
}
