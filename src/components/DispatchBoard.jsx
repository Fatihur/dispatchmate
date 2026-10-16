import { useEffect, useRef, useState } from "react";
import { requireDb } from "../lib/supabase.js";
import {
  fetchUnits,
  updateUnitStatus,
  assignUnit,
} from "../services/units.js";
import { fetchActiveDelays } from "../services/delays.js";
import { recordCycle, fetchTodayStats } from "../services/cycles.js";
import StatCard from "./StatCard.jsx";
import UnitCard from "./UnitCard.jsx";

const PHASE_MS = 2600;
const PAUSED_STATUSES = ["breakdown", "refuel"];

function nextTruckStatus(status) {
  switch (status) {
    case "standby":
      return "loading";
    case "loading":
      return "hauling";
    case "hauling":
      return "dumping";
    case "dumping":
      return "returning";
    case "returning":
      return Math.random() < 0.35 ? "queuing" : "loading";
    case "queuing":
      return "loading";
    default:
      return "loading";
  }
}

export default function DispatchBoard() {
  const [units, setUnits] = useState([]);
  const [stats, setStats] = useState({
    ritase: 0,
    avgCycle: 0,
    activeUnits: 0,
    activeDelays: 0,
  });
  const [simOn, setSimOn] = useState(false);
  const [rtOk, setRtOk] = useState(null); // null=connecting, true=realtime, false=polling
  const [error, setError] = useState("");

  const unitsRef = useRef([]);
  const cycleStartRef = useRef({}); // unitCode -> ISO string saat mulai hauling
  const simRef = useRef(false);

  const applyUnits = (next) => {
    unitsRef.current = next;
    setUnits(next);
  };

  // ---- initial load + realtime (fallback: polling 5 dtk) ----
  useEffect(() => {
    let cancelled = false;
    let pollId = null;
    let channel = null;
    let subscribed = false;

    const load = async () => {
      try {
        const data = await fetchUnits();
        if (!cancelled) applyUnits(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };

    const startPolling = () => {
      if (pollId || cancelled) return;
      setRtOk(false);
      const tick = async () => {
        try {
          const data = await fetchUnits();
          if (!cancelled) applyUnits(data);
        } catch {
          /* polling senyap */
        }
      };
      pollId = setInterval(tick, 5000);
    };

    load();

    try {
      const db = requireDb();
      channel = db
        .channel("units-rt")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "units" },
          (payload) => {
            if (cancelled || !payload.new) return;
            const row = payload.new;
            const next = unitsRef.current.map((u) =>
              u.code === row.code ? { ...u, ...row } : u
            );
            // baris baru (harusnya tidak terjadi) -> tambah
            if (!next.some((u) => u.code === row.code)) next.push(row);
            applyUnits(next);
          }
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            subscribed = true;
            setRtOk(true);
          } else {
            startPolling();
          }
        });
      setTimeout(() => {
        if (!subscribed && !cancelled) startPolling();
      }, 8000);
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (channel) {
        try {
          requireDb().removeChannel(channel);
        } catch {
          /* abaikan */
        }
      }
    };
  }, []);

  // ---- stats refresh tiap 5 dtk ----
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const [today, delays] = await Promise.all([
          fetchTodayStats(),
          fetchActiveDelays(),
        ]);
        const activeUnits = unitsRef.current.filter(
          (u) => u.status !== "standby" && u.status !== "breakdown"
        ).length;
        if (!cancelled)
          setStats({
            ritase: today.ritase,
            avgCycle: today.avgCycle,
            activeUnits,
            activeDelays: delays.length,
          });
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ---- mesin simulasi ----
  useEffect(() => {
    simRef.current = simOn;
    if (!simOn) return;

    // seed awal siklus untuk truk yang sedang jalan
    for (const u of unitsRef.current) {
      if (
        u.type === "haul_truck" &&
        (u.status === "hauling" || u.status === "dumping") &&
        !cycleStartRef.current[u.code]
      ) {
        cycleStartRef.current[u.code] = new Date(
          Date.now() - 15 * 60000
        ).toISOString();
      }
    }

    const id = setInterval(() => {
      if (!simRef.current) return;
      const current = unitsRef.current;
      const updates = [];
      const cycles = [];

      for (const u of current) {
        if (u.type !== "haul_truck") continue;
        if (PAUSED_STATUSES.includes(u.status)) continue;
        const next = nextTruckStatus(u.status);
        if (!next || next === u.status) continue;

        if (u.status === "loading" && next === "hauling") {
          cycleStartRef.current[u.code] = new Date().toISOString();
        }
        if (u.status === "dumping" && next === "returning") {
          const started =
            cycleStartRef.current[u.code] ||
            new Date(Date.now() - 20 * 60000).toISOString();
          const cycleMin = Math.round((20 + Math.random() * 12) * 10) / 10;
          cycles.push({
            unit_code: u.code,
            shovel_code: u.assigned_to,
            started_at: started,
            ended_at: new Date().toISOString(),
            cycle_min: cycleMin,
          });
          delete cycleStartRef.current[u.code];
        }
        updates.push({ code: u.code, status: next });
      }

      // excavator: loading selama ada truk yang ditugaskan
      for (const u of current) {
        if (u.type !== "excavator" || u.status === "breakdown") continue;
        const hasTrucks = current.some(
          (t) => t.type === "haul_truck" && t.assigned_to === u.code
        );
        const want = hasTrucks ? "loading" : "standby";
        if (u.status !== want) updates.push({ code: u.code, status: want });
      }

      if (updates.length === 0 && cycles.length === 0) return;

      // tulis ke DB (fire-and-forget, error dicatat)
      for (const up of updates) {
        updateUnitStatus(up.code, up.status).catch((e) =>
          setError(`Gagal update ${up.code}: ${e.message}`)
        );
      }
      for (const c of cycles) {
        recordCycle(c).catch((e) =>
          setError(`Gagal catat ritase ${c.unit_code}: ${e.message}`)
        );
      }

      // update lokal optimistis
      const next = current.map((u) => {
        const up = updates.find((x) => x.code === u.code);
        return up ? { ...u, status: up.status } : u;
      });
      applyUnits(next);
    }, PHASE_MS);

    return () => clearInterval(id);
  }, [simOn]);

  const handleAssign = async (code, shovelCode) => {
    try {
      await assignUnit(code, shovelCode);
      const next = unitsRef.current.map((u) =>
        u.code === code ? { ...u, assigned_to: shovelCode } : u
      );
      applyUnits(next);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleStatusChange = async (code, status) => {
    try {
      await updateUnitStatus(code, status);
      const next = unitsRef.current.map((u) =>
        u.code === code ? { ...u, status } : u
      );
      applyUnits(next);
    } catch (e) {
      setError(e.message);
    }
  };

  const trucks = units.filter((u) => u.type === "haul_truck");
  const shovels = units.filter((u) => u.type === "excavator");
  const support = units.filter(
    (u) => u.type !== "haul_truck" && u.type !== "excavator"
  );

  const group = (title, list) =>
    list.length > 0 && (
      <div key={title}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-mute">
          {title}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((u) => (
            <UnitCard
              key={u.code}
              unit={u}
              shovels={shovels}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
              simOn={simOn}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* stats strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ritase hari ini" value={stats.ritase} unit="rit" accent />
        <StatCard label="Rata-rata cycle time" value={stats.avgCycle} unit="mnt" />
        <StatCard label="Unit aktif" value={stats.activeUnits} unit="unit" />
        <StatCard
          label="Unit dalam delay"
          value={stats.activeDelays}
          unit="unit"
        />
      </div>

      {/* kontrol simulasi */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
        <button
          onClick={() => setSimOn((v) => !v)}
          className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
            simOn
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-lime text-black hover:brightness-110"
          }`}
        >
          {simOn ? "■ Hentikan Simulasi" : "▶ Jalankan Simulasi"}
        </button>
        <span className="text-xs text-mute">
          {simOn
            ? "Simulasi berjalan: armada bergerak otomatis, ritase tercatat ke database."
            : "Nyalakan untuk mendemokan pergerakan armada secara live."}
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs text-mute">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              rtOk === null
                ? "bg-yellow-400"
                : rtOk
                  ? "bg-green-400"
                  : "bg-orange-400"
            }`}
          />
          {rtOk === null
            ? "Menghubungkan…"
            : rtOk
              ? "Realtime aktif"
              : "Mode polling 5 dtk"}
        </span>
      </div>

      {/* fleet grid */}
      <div className="space-y-6">
        {group("Haul Truck", trucks)}
        {group("Shovel / Excavator", shovels)}
        {group("Support", support)}
      </div>
    </div>
  );
}
