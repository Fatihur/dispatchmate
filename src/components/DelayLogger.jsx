import { useEffect, useReducer, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchUnits } from "../services/units.js";
import {
  startDelay,
  endDelay,
  fetchActiveDelays,
  fetchDelayHistory,
  fetchDelaySummary,
} from "../services/delays.js";
import { DELAY_CODES, DELAY_CODE_LIST } from "../data/delayCodes.js";
import SectionHeader from "./SectionHeader.jsx";

function fmtElapsed(startedAt) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(startedAt)) / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MONO_TICK = {
  fill: "#8A94A3",
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
};

export default function DelayLogger() {
  const [units, setUnits] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState([]);
  const [unitCode, setUnitCode] = useState("");
  const [delayCode, setDelayCode] = useState("QUE");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // re-render tiap detik untuk timer elapsed
  const [, forceTick] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(forceTick, 1000);
    return () => clearInterval(id);
  }, []);

  const reload = async () => {
    try {
      const [u, a, h, s] = await Promise.all([
        fetchUnits(),
        fetchActiveDelays(),
        fetchDelayHistory(20),
        fetchDelaySummary(),
      ]);
      setUnits(u);
      setActive(a);
      setHistory(h);
      setSummary(
        s.map((row) => ({
          ...row,
          label: DELAY_CODES[row.code]?.label || row.code,
          fill: DELAY_CODES[row.code]?.color || "#E9F40B",
        }))
      );
      if (!unitCode && u.length > 0) setUnitCode(u[0].code);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    reload();
    const id = setInterval(reload, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    if (!unitCode || busy) return;
    setBusy(true);
    setError("");
    try {
      await startDelay({ unit_code: unitCode, delay_code: delayCode, note });
      setNote("");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async (id) => {
    setError("");
    try {
      await endDelay(id);
      await reload();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-300">
          {error}
        </div>
      )}

      {/* form catat delay */}
      <div className="rounded-lg border border-line bg-panel p-5">
        <SectionHeader index="01" title="Catat Delay Baru" className="mb-4" />
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
              Unit
            </label>
            <select
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-text outline-none focus:border-lime"
            >
              {units.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
              Kode delay
            </label>
            <div className="flex flex-wrap gap-2">
              {DELAY_CODE_LIST.map((code) => (
                <button
                  key={code}
                  onClick={() => setDelayCode(code)}
                  className={`rounded-md border px-3 py-2 font-mono text-xs font-bold transition-colors ${
                    delayCode === code
                      ? "border-lime bg-lime text-black"
                      : "border-line bg-panel2 text-mute hover:border-lime hover:text-text"
                  }`}
                  title={DELAY_CODES[code].label}
                >
                  {code}
                </button>
              ))}
            </div>
            <div className="mt-1.5 font-mono text-[11px] text-mute">
              {delayCode} — {DELAY_CODES[delayCode].label}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional), mis. antre di EX-01 karena…"
            className="flex-1 rounded-lg border border-line bg-panel2 px-3 py-2.5 text-sm text-text outline-none placeholder:text-mute/60 focus:border-lime"
          />
          <button
            onClick={handleStart}
            disabled={!unitCode || busy}
            className="rounded-lg bg-lime px-6 py-2.5 text-sm font-bold text-black transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Mulai Delay"}
          </button>
        </div>
      </div>

      {/* delay aktif */}
      <div className="rounded-lg border border-line bg-panel p-5">
        <SectionHeader
          index="02"
          title={`Delay Berjalan (${active.length})`}
          className="mb-2"
        />
        {active.length === 0 ? (
          <p className="py-2 text-sm text-mute">
            Tidak ada delay berjalan. Semua unit beroperasi normal.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {active.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <span className="font-mono text-sm font-bold text-text">
                  {d.unit_code}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold"
                  style={{
                    color: DELAY_CODES[d.delay_code]?.color,
                    border: `1px solid ${DELAY_CODES[d.delay_code]?.color}55`,
                    background: `${DELAY_CODES[d.delay_code]?.color}18`,
                  }}
                >
                  {d.delay_code} —{" "}
                  {DELAY_CODES[d.delay_code]?.label || d.delay_code}
                </span>
                <span className="font-mono text-2xl font-bold text-lime">
                  {fmtElapsed(d.started_at)}
                </span>
                <span className="font-mono text-[11px] text-mute">
                  sejak {fmtDateTime(d.started_at)} · shift {d.shift}
                  {d.note ? ` · ${d.note}` : ""}
                </span>
                <button
                  onClick={() => handleEnd(d.id)}
                  className="ml-auto rounded-lg border border-lime/50 px-4 py-1.5 text-xs font-bold text-lime transition-colors hover:bg-lime hover:text-black"
                >
                  Selesai
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* grafik delay per kode */}
      <div className="rounded-lg border border-line bg-panel p-5">
        <SectionHeader
          index="03"
          title="Total Menit Delay per Kode"
          className="mb-4"
        />
        {summary.length === 0 ? (
          <p className="py-2 text-sm text-mute">
            Belum ada data delay yang selesai dicatat.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={summary}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke="#232B36" vertical={false} />
              <XAxis
                dataKey="code"
                tick={MONO_TICK}
                tickLine={false}
                axisLine={{ stroke: "#232B36" }}
              />
              <YAxis
                tick={MONO_TICK}
                tickLine={false}
                axisLine={{ stroke: "#232B36" }}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: "#161C24",
                  border: "1px solid #232B36",
                  borderRadius: 8,
                  color: "#F2F4F7",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                formatter={(v, _n, props) => [
                  `${v} menit`,
                  props?.payload?.label || "Total",
                ]}
              />
              <Bar dataKey="minutes" fill="#E9F40B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* riwayat */}
      <div className="rounded-lg border border-line bg-panel p-5">
        <SectionHeader
          index="04"
          title="Riwayat Delay (20 terakhir)"
          className="mb-2"
        />
        {history.length === 0 ? (
          <p className="py-2 text-sm text-mute">Belum ada riwayat delay.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                  <th className="py-2 pr-4 font-medium">Unit</th>
                  <th className="py-2 pr-4 font-medium">Kode</th>
                  <th className="py-2 pr-4 font-medium">Mulai</th>
                  <th className="py-2 pr-4 font-medium">Selesai</th>
                  <th className="py-2 pr-4 font-medium">Durasi</th>
                  <th className="py-2 pr-4 font-medium">Shift</th>
                  <th className="py-2 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-line/60 text-text/90"
                  >
                    <td className="py-2.5 pr-4 font-mono font-bold">
                      {h.unit_code}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-xs font-bold"
                        style={{
                          color: DELAY_CODES[h.delay_code]?.color,
                          background: `${DELAY_CODES[h.delay_code]?.color}18`,
                        }}
                      >
                        {h.delay_code}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-mute">
                      {fmtDateTime(h.started_at)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-mute">
                      {fmtDateTime(h.ended_at)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-lime">
                      {h.duration_min ?? "—"} mnt
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-mute">
                      {h.shift || "—"}
                    </td>
                    <td className="py-2.5 text-mute">{h.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
