-- ============================================================
-- DispatchMate — database schema (Supabase / Postgres)
-- Cara pakai: buka Supabase Dashboard → SQL Editor → New Query
--             → paste seluruh file ini → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabel armada ----------
create table if not exists units (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,              -- contoh: 'HD-01'
  type        text not null,                     -- haul_truck | excavator | dozer | grader
  status      text not null default 'standby',   -- loading | hauling | dumping | returning
                                                -- queuing | refuel | breakdown | standby
  assigned_to text,                              -- kode shovel yang dilayani unit ini
  updated_at  timestamptz not null default now()
);

-- ---------- Tabel catatan delay ----------
create table if not exists delay_logs (
  id           uuid primary key default gen_random_uuid(),
  unit_code    text not null,                    -- kode unit yang delay
  delay_code   text not null,                    -- QUE | RFL | BRK | WTH | RD | SC | IDL | MTN
  started_at   timestamptz not null,
  ended_at     timestamptz,
  duration_min numeric,                           -- durasi menit (diisi saat stop)
  note         text,
  shift        text,                              -- Pagi | Siang | Malam
  created_at   timestamptz not null default now()
);

-- ---------- Tabel riwayat cycle time ----------
create table if not exists cycle_records (
  id          uuid primary key default gen_random_uuid(),
  unit_code   text not null,
  shovel_code text,
  started_at  timestamptz not null,
  ended_at    timestamptz not null,
  cycle_min   numeric not null,
  created_at  timestamptz not null default now()
);

-- ---------- Data awal armada ----------
insert into units (code, type, status) values
  ('HD-01','haul_truck','standby'),
  ('HD-02','haul_truck','standby'),
  ('HD-03','haul_truck','standby'),
  ('HD-04','haul_truck','standby'),
  ('HD-05','haul_truck','standby'),
  ('HD-06','haul_truck','standby'),
  ('EX-01','excavator','standby'),
  ('EX-02','excavator','standby'),
  ('DZ-01','dozer','standby'),
  ('GR-01','grader','standby')
on conflict (code) do nothing;

-- ---------- RLS: buka akses penuh untuk MVP (tools internal single-user) --
alter table units         enable row level security;
alter table delay_logs    enable row level security;
alter table cycle_records enable row level security;

drop policy if exists "public all units" on units;
drop policy if exists "public all delay_logs" on delay_logs;
drop policy if exists "public all cycle_records" on cycle_records;

create policy "public all units"
  on units for all using (true) with check (true);
create policy "public all delay_logs"
  on delay_logs for all using (true) with check (true);
create policy "public all cycle_records"
  on cycle_records for all using (true) with check (true);
