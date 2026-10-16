# PitRoad — Koordinasi Kondisi Jalan & Hazard Tambang

Helper operasional untuk dispatcher tambang — **bukan** FMS. FMS mengatur armada;
PitRoad menjaga kondisi jalan yang dilalui armada dan mengoordinasikan penutupan jalan.

## Fitur

**Papan Hazard**
- Lapor hazard jalan (lubang, debu, licin, batu jatuh, genangan, blind spot)
- Lokasi per area / bench / segmen jalan + tingkat severity
- Workflow: open → tugaskan unit (dozer/grader) → dikerjakan → selesai
- Waktu respons tercatat per laporan
- Update realtime via Supabase Realtime (fallback polling 5 detik)

**Penutupan Jalan**
- Kelola penutupan segmen: blasting, maintenance, cuaca, kecelakaan
- Banner peringatan untuk penutupan yang sedang aktif
- Workflow: terjadwal → aktif → dicabut

**Peta Pit**
- Peta skematis 6 zona tambang (bukan posisi GPS)
- Badge jumlah hazard terbuka per zona, berwarna sesuai severity tertinggi
- Klik zona untuk memfilter papan hazard

**Analitik**
- Hazard per area, per tipe, distribusi severity
- Rata-rata waktu respons, tren 14 hari

## Stack

- Frontend: React + Vite + Tailwind CSS v3 + Recharts
- Backend: Supabase Postgres (`hazard_reports`, `road_closures`, `units`)
- Hosting: Vercel

## Run locally

```bash
npm install
cp .env.example .env   # isi kredensial Supabase
npm run dev
```

Required env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Database schema: `supabase/schema.sql`
