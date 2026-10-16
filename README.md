# DispatchMate

Helper tools for mine dispatchers — a fleet **Dispatch Board** plus a **Delay & Downtime Logger**.

Built as interview preparation material for a Mine Dispatcher role, but structured as a real, working full-stack app.

## Features

**Dispatch Board**
- Live fleet status grid (HD / EX / DZ / GR unit types)
- Ritase hari ini, average cycle time, active units, units in delay
- Manual status changes and truck-to-shovel assignment
- Simulation mode: advances truck phases and writes cycle records

**Delay & Downtime Logger**
- Delay codes (QUE, RFL, BRK, WTH, RD, SC, IDL, MTN)
- Start/finish delay with live timers and automatic shift detection
- Delay history + aggregate delay chart (Recharts)

## Stack

- Frontend: React + Vite + Tailwind CSS v3 + Recharts
- Backend: Supabase Postgres (tables: `units`, `delay_logs`, `cycle_records`)
- Hosting: Vercel

## Run locally

```bash
npm install
cp .env.example .env   # fill in your Supabase values
npm run dev
```

Required env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Database schema: `supabase/schema.sql`
