import { useEffect, useState } from "react";
import { useRealtimeTable } from "../hooks/useRealtimeTable.js";
import {
  fetchClosures,
  createClosure,
  updateClosure,
} from "../services/closures.js";
import {
  CLOSURE_REASONS,
  CLOSURE_REASON_LIST,
  CLOSURE_STATUS,
  CLOSURE_STATUS_LIST,
} from "../data/pitroad.js";
import {
  fmtDateTime,
  fmtDuration,
  toWitaInputValue,
  fromWitaInputValue,
} from "../lib/time.js";
import SectionHeader from "./SectionHeader.jsx";
import CornerTicks from "./CornerTicks.jsx";

const inputCls =
  "w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-text outline-none focus:border-lime";
const labelCls =
  "mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute";

function useNow(ms) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const emptyForm = {
  segment: "",
  reason: "",
  detail: "",
  starts_at: "",
  ends_at: "",
  created_by: "",
};

export default function ClosureBoard() {
  const { rows: closures, rtOk, error, setError } = useRealtimeTable(
    "road_closures",
    "closure-rt",
    fetchClosures
  );
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    starts_at: toWitaInputValue(new Date(Date.now() + 30 * 60000).toISOString()),
    ends_at: toWitaInputValue(new Date(Date.now() + 90 * 60000).toISOString()),
  }));
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const now = useNow(30000);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.segment.trim() || !form.reason || !form.created_by.trim()) {
      setError("Segmen, alasan, dan nama pembuat wajib diisi.");
      return;
    }
    const startIso = fromWitaInputValue(form.starts_at);
    const endIso = fromWitaInputValue(form.ends_at);
    if (!startIso || !endIso || new Date(endIso) <= new Date(startIso)) {
      setError("Waktu selesai harus sesudah waktu mulai.");
      return;
    }
    setSaving(true);
    try {
      await createClosure({
        segment: form.segment.trim(),
        reason: form.reason,
        detail: form.detail.trim() || null,
        starts_at: startIso,
        ends_at: endIso,
        created_by: form.created_by.trim(),
        status: "scheduled",
      });
      setForm({
        ...emptyForm,
        starts_at: toWitaInputValue(new Date(Date.now() + 30 * 60000).toISOString()),
        ends_at: toWitaInputValue(new Date(Date.now() + 90 * 60000).toISOString()),
      });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      await updateClosure(id, { status });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const active = closures.filter((c) => c.status === "active");
  const rest = closures.filter((c) => c.status !== "active");

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {active.length > 0 && (
        <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-red-300">
              Peringatan — {active.length} jalan ditutup
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {active.map((c) => {
              const remain = new Date(c.ends_at).getTime() - now;
              return (
                <div key={c.id} className="flex flex-wrap items-baseline gap-x-3 font-mono text-sm">
                  <span className="font-bold text-text">{c.segment}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-red-300">
                    {CLOSURE_REASONS[c.reason] ? CLOSURE_REASONS[c.reason].label : c.reason}
                  </span>
                  <span className="ml-auto text-[11px] text-mute">
                    sampai {fmtDateTime(c.ends_at)}
                    {remain > 0 && <span className="text-red-300"> · sisa {fmtDuration(remain)}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <section className="relative rounded-xl border border-line bg-panel p-5">
        <CornerTicks />
        <SectionHeader index="01" title="Jadwalkan Penutupan" className="mb-4" />
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelCls}>Segmen jalan *</label>
            <input value={form.segment} onChange={set("segment")} placeholder="mis. Ramp B km 2.3" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Alasan *</label>
            <select value={form.reason} onChange={set("reason")} className={inputCls}>
              <option value="">— pilih alasan —</option>
              {CLOSURE_REASON_LIST.map((r) => (
                <option key={r} value={r}>{CLOSURE_REASONS[r].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Dibuat oleh *</label>
            <input value={form.created_by} onChange={set("created_by")} placeholder="Nama dispatcher" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mulai *</label>
            <input type="datetime-local" value={form.starts_at} onChange={set("starts_at")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Selesai *</label>
            <input type="datetime-local" value={form.ends_at} onChange={set("ends_at")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Detail</label>
            <input value={form.detail} onChange={set("detail")} placeholder="mis. Blasting bench 12, radius 500 m" className={inputCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-lime px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-black transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Jadwalkan"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <SectionHeader index="02" title={`Riwayat Penutupan — ${closures.length}`} className="flex-1" />
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-mute">
            <span className={`inline-block h-2 w-2 rounded-full ${rtOk === null ? "bg-yellow-400" : rtOk ? "bg-green-400" : "bg-orange-400"}`} />
            {rtOk === null ? "MENGHUBUNGKAN…" : rtOk ? "REALTIME AKTIF" : "POLLING 5 DTK"}
          </span>
        </div>

        {closures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-panel/50 px-6 py-12 text-center">
            <div className="font-display text-lg font-bold text-text">Belum ada penutupan</div>
            <p className="mt-1 text-sm text-mute">Jadwalkan penutupan jalan pertama lewat form di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                  <th className="px-4 py-3">Segmen</th>
                  <th className="px-4 py-3">Alasan</th>
                  <th className="px-4 py-3">Mulai</th>
                  <th className="px-4 py-3">Selesai</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...active, ...rest].map((c) => {
                  const st = CLOSURE_STATUS[c.status] || CLOSURE_STATUS.scheduled;
                  const busy = busyId === c.id;
                  return (
                    <tr key={c.id} className={c.status === "lifted" ? "opacity-60" : undefined}>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-text">{c.segment}</td>
                      <td className="px-4 py-3 text-sm text-text/90">
                        {CLOSURE_REASONS[c.reason] ? CLOSURE_REASONS[c.reason].label : c.reason}
                        {c.detail && <div className="mt-0.5 font-mono text-[11px] text-mute">{c.detail}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-mute">{fmtDateTime(c.starts_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-mute">{fmtDateTime(c.ends_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: st.color, background: `${st.color}1f`, border: `1px solid ${st.color}66` }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "scheduled" && (
                          <button onClick={() => setStatus(c.id, "active")} disabled={busy} className="rounded-md bg-lime px-3 py-1.5 font-mono text-xs font-bold text-black disabled:opacity-50">
                            AKTIFKAN
                          </button>
                        )}
                        {c.status === "active" && (
                          <button onClick={() => setStatus(c.id, "lifted")} disabled={busy} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs font-bold text-text hover:border-mute disabled:opacity-50">
                            CABUT
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
