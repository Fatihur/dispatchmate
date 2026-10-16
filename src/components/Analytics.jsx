import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { fetchHazards } from "../services/hazards.js";
import {
  AREAS,
  AREA_LIST,
  HAZARD_TYPES,
  HAZARD_TYPE_LIST,
  SEVERITIES,
  SEVERITY_LIST,
} from "../data/pitroad.js";
import { fmtDuration } from "../lib/time.js";
import SectionHeader from "./SectionHeader.jsx";
import CornerTicks from "./CornerTicks.jsx";

const LIME = "#E9F40B";
const GRID = "#232B36";
const TICK = { fill: "#8A94A3", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" };
const tooltipStyle = {
  background: "#10141A",
  border: "1px solid #232B36",
  borderRadius: 8,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  color: "#F2F4F7",
};

const TYPE_SHORT = {
  lubang: "Lubang",
  debu: "Debu",
  licin: "Licin",
  batu_jatuh: "Batu jatuh",
  genangan: "Genangan",
  blind_spot: "Blind spot",
  lainnya: "Lainnya",
};

function ChartPanel({ index, title, children, wide }) {
  return (
    <div className={`relative rounded-xl border border-line bg-panel p-4 ${wide ? "lg:col-span-2" : ""}`}>
      <SectionHeader index={index} title={title} className="mb-3" />
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel/50 px-6 py-16 text-center">
      <div className="font-display text-xl font-extrabold uppercase tracking-tight text-text">
        Belum ada data
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-mute">
        Analitik muncul setelah ada laporan hazard. Buka tab Papan Hazard dan
        laporkan kondisi jalan pertama — semua grafik dihitung dari data nyata.
      </p>
    </div>
  );
}

export default function Analytics() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setHazards(await fetchHazards());
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const perArea = AREA_LIST.map((a) => ({
      name: AREAS[a].label,
      count: hazards.filter((h) => h.area === a).length,
    }));
    const perType = HAZARD_TYPE_LIST.map((t) => ({
      name: TYPE_SHORT[t],
      count: hazards.filter((h) => h.hazard_type === t).length,
    })).filter((d) => d.count > 0);
    const perSeverity = SEVERITY_LIST.map((s) => ({
      name: SEVERITIES[s].label,
      count: hazards.filter((h) => h.severity === s).length,
      color: SEVERITIES[s].color,
    }));

    const resolved = hazards.filter((h) => h.status === "resolved" && h.resolved_at && h.reported_at);
    const respMs = resolved.map((h) => new Date(h.resolved_at) - new Date(h.reported_at));
    const avgResp = respMs.length ? respMs.reduce((a, b) => a + b, 0) / respMs.length : null;

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Makassar" });
      days.push({
        key,
        name: label,
        count: hazards.filter((h) => h.reported_at && h.reported_at.slice(0, 10) === key).length,
      });
    }
    return { perArea, perType, perSeverity, avgResp, resolvedCount: resolved.length, days };
  }, [hazards]);

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-panel px-6 py-16 text-center font-mono text-sm text-mute">
        Memuat analitik…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (hazards.length === 0) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SectionHeader index="01" title={`Ringkasan — ${hazards.length} laporan`} className="flex-1" />
        <button onClick={load} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mute hover:border-mute hover:text-text">
          MUAT ULANG
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartPanel index="02" title="Hazard per area">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stats.perArea} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={TICK} interval={0} angle={-18} dy={8} height={52} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#161C24" }} />
              <Bar dataKey="count" fill={LIME} radius={[3, 3, 0, 0]} name="Laporan" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel index="03" title="Hazard per tipe">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stats.perType} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={TICK} interval={0} angle={-18} dy={8} height={52} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#161C24" }} />
              <Bar dataKey="count" fill={LIME} radius={[3, 3, 0, 0]} name="Laporan" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel index="04" title="Distribusi severity">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stats.perSeverity} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={TICK} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#161C24" }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Laporan">
                {stats.perSeverity.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="relative rounded-xl border border-line bg-panel p-4">
          <CornerTicks />
          <SectionHeader index="05" title="Response time" className="mb-3" />
          <div className="flex h-[230px] flex-col justify-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
              Rata-rata lapor → selesai
            </div>
            <div className="mt-2 font-mono text-5xl font-bold text-lime">
              {stats.avgResp == null ? "—" : fmtDuration(stats.avgResp)}
            </div>
            <div className="mt-3 font-mono text-xs text-mute">
              dari {stats.resolvedCount} hazard selesai
              {stats.resolvedCount === 0 && " — belum ada yang selesai"}
            </div>
          </div>
        </div>

        <ChartPanel index="06" title="Tren 14 hari terakhir" wide>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stats.days} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ ...TICK, fontSize: 10 }} interval={1} angle={-24} dy={10} height={56} />
              <YAxis tick={TICK} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#161C24" }} />
              <Bar dataKey="count" fill={LIME} radius={[3, 3, 0, 0]} name="Laporan" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}
