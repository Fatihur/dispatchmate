-- PitRoad: koordinasi kondisi jalan & hazard tambang (helper untuk FMS utama)
-- Tabel: hazard_reports, road_closures. Tabel units dipakai ulang untuk assignment.

-- ---------- Hazard reports ----------
create table if not exists hazard_reports (
  id uuid primary key default gen_random_uuid(),
  area text not null,                       -- PIT_A | PIT_B | PIT_C | RAMP_UTAMA | DISPOSAL | ROM_PAD
  bench text,                               -- mis. 'Bench 1140'
  segment text not null,                    -- mis. 'Ramp B km 2.3'
  hazard_type text not null,                 -- lubang | debu | licin | batu_jatuh | genangan | blind_spot | lainnya
  severity text not null default 'sedang',   -- rendah | sedang | tinggi | kritis
  description text,
  reporter text not null,
  status text not null default 'open',       -- open | assigned | in_progress | resolved
  assigned_unit text references units(code),
  target_at timestamptz,
  reported_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_note text
);
create index if not exists idx_hazard_status on hazard_reports(status);
create index if not exists idx_hazard_severity on hazard_reports(severity);
create index if not exists idx_hazard_area on hazard_reports(area);
create index if not exists idx_hazard_reported on hazard_reports(reported_at desc);

-- ---------- Road closures ----------
create table if not exists road_closures (
  id uuid primary key default gen_random_uuid(),
  segment text not null,
  reason text not null,                      -- blasting | maintenance | weather | accident | lainnya
  detail text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled',   -- scheduled | active | lifted
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_closure_status on road_closures(status);
create index if not exists idx_closure_starts on road_closures(starts_at);

-- ---------- RLS: sama seperti tools internal single-user ----------
alter table hazard_reports enable row level security;
alter table road_closures  enable row level security;

drop policy if exists "public all hazard_reports" on hazard_reports;
drop policy if exists "public all road_closures" on road_closures;

create policy "public all hazard_reports"
  on hazard_reports for all using (true) with check (true);
create policy "public all road_closures"
  on road_closures for all using (true) with check (true);
