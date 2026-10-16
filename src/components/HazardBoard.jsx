import { useEffect, useState } from "react";
import { useRealtimeTable } from "../hooks/useRealtimeTable.js";
import {
  fetchHazards,
  createHazard,
  updateHazard,
  fetchSupportUnits,
} from "../services/hazards.js";
import {
  AREAS,
  AREA_LIST,
  HAZARD_TYPES,
  HAZARD_TYPE_LIST,
  SEVERITIES,
  SEVERITY_LIST,
  HAZARD_STATUS,
  HAZARD_STATUS_LIST,
} from "../data/pitroad.js";
import {
  fmtDateTime,
  fmtDuration,
  fromWitaInputValue,
  witaInputPlusMinutes,
} from "../lib/time.js";
import SectionHeader from "./SectionHeader.jsx";
import CornerTicks from "./CornerTicks.jsx";

const inputCls =
  "w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-text outline-none focus:border-lime";
const labelCls =
  "mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute";

function Badge({ color, children }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{ color, background: `${color}1f`, border: `1px solid ${color}66` }}
    >
      {children}
    </span>
  );
}

const emptyForm = {
  area: "",
  bench: "",
  segment: "",
  hazard_type: "",
  severity: "sedang",
  description: "",
  reporter: "",
};

export default function HazardBoard({ areaFilter, onClearAreaFilter }) {
  const { rows: hazards, rtOk, error, setError } = useRealtimeTable(
    "hazard_reports",
    "hazard-rt",
    fetchHazards
  );
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fStatus, setFStatus] = useState("all");
  const [fSeverity, setFSeverity] = useState("all");
  const [fArea, setFArea] = useState("all");

  const [assigningId, setAssigningId] = useState(null);
  const [assignUnit, setAssignUnit] = useState("");
  const [assignTarget, setAssignTarget] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchSupportUnits().then(setUnits).catch((e) => setError(e.message));
  }, [setError]);

  useEffect(() => {
    if (areaFilter) setFArea(areaFilter);
  }, [areaFilter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.area || !form.segment.trim() || !form.hazard_type || !form.reporter.trim()) {
      setError("Area, segmen, tipe hazard, dan nama pelapor wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createHazard({
        area: form.area,
        bench: form.bench.trim() || null,
        segment: form.segment.trim(),
        hazard_type: form.hazard_type,
        severity: form.severity,
        description: form.description.trim() || null,
        reporter: form.reporter.trim(),
        status: "open",
      });
      setForm(emptyForm);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const doAssign = async (id) => {
    if (!assignUnit) {
      setError("Pilih unit pendukung (dozer/grader) dulu.");
      return;
    }
    const targetIso = fromWitaInputValue(assignTarget);
    if (!targetIso || new Date(targetIso).getTime() <= Date.now()) {
      setError("Target waktu harus di masa depan.");
      return;
    }
    setBusyId(id);
    try {
      await updateHazard(id, {
        status: "assigned",
        assigned_unit: assignUnit,
        target_at: targetIso,
      });
      setAssigningId(null);
      setAssignUnit("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const doStart = async (id) => {
    setBusyId(id);
    try {
      await updateHazard(id, {
        status: "in_progress",
        acknowledged_at: new Date().toISOString(),
      });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const doResolve = async (id) => {
    if (!resolutionNote.trim()) {
      setError("Catatan resolusi wajib diisi.");
      return;
    }
    setBusyId(id);
    try {
      await updateHazard(id, {
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_note: resolutionNote.trim(),
      });
      setResolvingId(null);
      setResolutionNote("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = hazards.filter(
    (h) =>
      (fStatus === "all" || h.status === fStatus) &&
      (fSeverity === "all" || h.severity === fSeverity) &&
      (fArea === "all" || h.area === fArea)
  );
  const openCount = hazards.filter((h) => h.status !== "resolved").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="relative rounded-xl border border-line bg-panel p-5">
        <CornerTicks />
        <SectionHeader index="01" title="Lapor Hazard Baru" className="mb-4" />
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>Area *</label>
            <select value={form.area} onChange={set("area")} className={inputCls}>
              <option value="">— pilih area —</option>
              {AREA_LIST.map((a) => (
                <option key={a} value={a}>{AREAS[a].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Bench (opsional)</label>
            <input value={form.bench} onChange={set("bench")} placeholder="mis. Bench 12" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Segmen jalan *</label>
            <input value={form.segment} onChange={set("segment")} placeholder="mis. Ramp B km 2.3" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipe hazard *</label>
            <select value={form.hazard_type} onChange={set("hazard_type")} className={inputCls}>
              <option value="">— pilih tipe —</option>
              {HAZARD_TYPE_LIST.map((t) => (
                <option key={t} value={t}>{HAZARD_TYPES[t].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Severity *</label>
            <div className="flex gap-1.5">
              {SEVERITY_LIST.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, severity: s }))}
                  className={`flex-1 rounded-md border px-2 py-2 font-mono text-[11px] font-bold uppercase transition-colors ${
                    form.severity === s ? "text-black" : "text-mute hover:text-text"
                  }`}
                  style={
                    form.severity === s
                      ? { background: SEVERITIES[s].color, borderColor: SEVERITIES[s].color }
                      : { borderColor: "#232B36", background: "#161C24" }
                  }
                >
                  {SEVERITIES[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Nama pelapor *</label>
            <input value={form.reporter} onChange={set("reporter")} placeholder="Nama dispatcher / pengawas" className={inputCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className={labelCls}>Deskripsi</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="Kondisi jalan, dampak ke lalu lintas, dsb."
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-lime px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-black transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Kirim Laporan"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHeader index="02" title={`Daftar Hazard — ${openCount} terbuka`} className="mb-3" />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="rounded-md border border-line bg-panel2 px-3 py-2 font-mono text-xs text-text">
            <option value="all">Semua status</option>
            {HAZARD_STATUS_LIST.map((s) => (
              <option key={s} value={s}>{HAZARD_STATUS[s].label}</option>
            ))}
          </select>
          <select value={fSeverity} onChange={(e) => setFSeverity(e.target.value)} className="rounded-md border border-line bg-panel2 px-3 py-2 font-mono text-xs text-text">
            <option value="all">Semua severity</option>
            {SEVERITY_LIST.map((s) => (
              <option key={s} value={s}>{SEVERITIES[s].label}</option>
            ))}
          </select>
          <select
            value={fArea}
            onChange={(e) => { setFArea(e.target.value); onClearAreaFilter && onClearAreaFilter(); }}
            className="rounded-md border border-line bg-panel2 px-3 py-2 font-mono text-xs text-text"
          >
            <option value="all">Semua area</option>
            {AREA_LIST.map((a) => (
              <option key={a} value={a}>{AREAS[a].label}</option>
            ))}
          </select>
          {areaFilter && areaFilter !== "all" && (
            <span className="rounded-full border border-lime/50 bg-lime/10 px-3 py-1.5 font-mono text-[11px] text-lime">
              Dari peta: {AREAS[areaFilter] ? AREAS[areaFilter].label : areaFilter}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-mute">
            <span className={`inline-block h-2 w-2 rounded-full ${rtOk === null ? "bg-yellow-400" : rtOk ? "bg-green-400" : "bg-orange-400"}`} />
            {rtOk === null ? "MENGHUBUNGKAN…" : rtOk ? "REALTIME AKTIF" : "POLLING 5 DTK"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-panel/50 px-6 py-12 text-center">
            <div className="font-display text-lg font-bold text-text">Tidak ada hazard</div>
            <p className="mt-1 text-sm text-mute">
              {hazards.length === 0
                ? "Belum ada laporan. Jadilah yang pertama melaporkan kondisi jalan."
                : "Tidak ada yang cocok dengan filter saat ini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map((h) => {
              const sev = SEVERITIES[h.severity] || SEVERITIES.sedang;
              const st = HAZARD_STATUS[h.status] || HAZARD_STATUS.open;
              const busy = busyId === h.id;
              return (
                <article key={h.id} className="relative rounded-xl border border-line bg-panel p-4 transition-colors hover:border-mute">
                  <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-full" style={{ background: sev.color }} />
                  <div className="flex flex-wrap items-center gap-2 pl-2">
                    <Badge color={sev.color}>{sev.label}</Badge>
                    <Badge color={st.color}>{st.label}</Badge>
                    <span className="ml-auto font-mono text-[11px] text-mute">{fmtDateTime(h.reported_at)}</span>
                  </div>
                  <div className="mt-2 pl-2 font-mono text-sm font-bold text-text">
                    {AREAS[h.area] ? AREAS[h.area].label : h.area}
                    {h.bench ? <span className="text-mute"> · {h.bench}</span> : null}
                    <span className="text-mute"> · </span>{h.segment}
                  </div>
                  <div className="mt-1 pl-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
                    {HAZARD_TYPES[h.hazard_type] ? HAZARD_TYPES[h.hazard_type].label : h.hazard_type}
                  </div>
                  {h.description && <p className="mt-2 pl-2 text-sm text-text/90">{h.description}</p>}
                  <div className="mt-2 pl-2 font-mono text-[11px] text-mute">
                    Pelapor: <span className="text-text">{h.reporter}</span>
                    {h.assigned_unit && (
                      <span> · Unit: <span className="text-lime">{h.assigned_unit}</span> · target {fmtDateTime(h.target_at)}</span>
                    )}
                  </div>
                  {h.status === "resolved" && (
                    <div className="mt-2 rounded-md border border-line bg-panel2 px-3 py-2">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                        Resolusi · response {fmtDuration(new Date(h.resolved_at) - new Date(h.reported_at))}
                      </div>
                      <div className="mt-1 text-sm text-text">{h.resolution_note}</div>
                    </div>
                  )}

                  <div className="mt-3 pl-2">
                    {h.status === "open" && assigningId !== h.id && (
                      <button
                        onClick={() => { setAssigningId(h.id); setAssignTarget(witaInputPlusMinutes(120)); setAssignUnit(""); }}
                        className="rounded-md border border-lime/60 bg-lime/10 px-4 py-1.5 font-mono text-xs font-bold text-lime transition hover:bg-lime hover:text-black"
                      >
                        TUGASKAN UNIT
                      </button>
                    )}
                    {h.status === "open" && assigningId === h.id && (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-panel2 p-2">
                        <select value={assignUnit} onChange={(e) => setAssignUnit(e.target.value)} className="rounded-md border border-line bg-panel px-2 py-1.5 font-mono text-xs text-text">
                          <option value="">— unit —</option>
                          {units.map((u) => (
                            <option key={u.code} value={u.code}>{u.code} ({u.type})</option>
                          ))}
                        </select>
                        <input
                          type="datetime-local"
                          value={assignTarget}
                          onChange={(e) => setAssignTarget(e.target.value)}
                          className="rounded-md border border-line bg-panel px-2 py-1.5 font-mono text-xs text-text"
                        />
                        <button onClick={() => doAssign(h.id)} disabled={busy} className="rounded-md bg-lime px-3 py-1.5 font-mono text-xs font-bold text-black disabled:opacity-50">
                          {busy ? "…" : "OK"}
                        </button>
                        <button onClick={() => setAssigningId(null)} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mute">
                          Batal
                        </button>
                      </div>
                    )}
                    {h.status === "assigned" && (
                      <button onClick={() => doStart(h.id)} disabled={busy} className="rounded-md border border-lime/60 bg-lime/10 px-4 py-1.5 font-mono text-xs font-bold text-lime transition hover:bg-lime hover:text-black disabled:opacity-50">
                        {busy ? "…" : "MULAI KERJAKAN"}
                      </button>
                    )}
                    {h.status === "in_progress" && resolvingId !== h.id && (
                      <button onClick={() => { setResolvingId(h.id); setResolutionNote(""); }} className="rounded-md bg-lime px-4 py-1.5 font-mono text-xs font-bold text-black transition hover:brightness-110">
                        SELESAIKAN
                      </button>
                    )}
                    {h.status === "in_progress" && resolvingId === h.id && (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-panel2 p-2">
                        <input
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Catatan resolusi *"
                          className="min-w-[200px] flex-1 rounded-md border border-line bg-panel px-2 py-1.5 text-xs text-text"
                        />
                        <button onClick={() => doResolve(h.id)} disabled={busy} className="rounded-md bg-lime px-3 py-1.5 font-mono text-xs font-bold text-black disabled:opacity-50">
                          {busy ? "…" : "OK"}
                        </button>
                        <button onClick={() => setResolvingId(null)} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mute">
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
