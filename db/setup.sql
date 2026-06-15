-- ══════════════════════════════════════════
-- VoltEarth — Supabase Database Setup
-- Run this ONCE in Supabase SQL Editor
-- Project: https://eicwqdylfqbzuvxmxdgh.supabase.co
-- ══════════════════════════════════════════
-- NOTE: If tables already exist, this is safe to re-run
--       (uses CREATE TABLE IF NOT EXISTS)
-- ══════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── 1. USERS ─────────────────────────────
create table if not exists users (
  id            uuid        primary key default uuid_generate_v4(),
  email         text        unique not null,
  name          text,
  password_hash text,                    -- SHA-256 hex of password (null = legacy/demo)
  last_login    timestamptz default now(),
  device        text,
  ip_address    text,
  created_at    timestamptz default now()
);

-- Add password_hash to existing deployments (safe if column already exists)
alter table users add column if not exists password_hash text;

-- ─── 2. PREDICTIONS ───────────────────────
-- Stores every energy analysis result (auto-saved on Generate)
create table if not exists predictions (
  id             uuid    primary key default uuid_generate_v4(),
  user_name      text,
  user_email     text,
  type           text    not null,       -- 'solar' | 'wind'
  location       text,                   -- City name
  state_name     text,                   -- State name
  lat            float8,                 -- GPS latitude
  lng            float8,                 -- GPS longitude
  system_size_kw float8,                 -- Panel/turbine size in kW
  efficiency_pct float8,                 -- Efficiency %
  temperature_c  float8,                 -- Ambient temp °C
  irradiance     float8,                 -- kWh/m²/day (solar only)
  wind_speed     float8,                 -- m/s (wind only)
  daily_kwh      float8,                 -- Predicted daily output kWh
  annual_kwh     float8,                 -- Predicted annual output kWh
  co2_kg         float8,                 -- CO₂ offset kg/year
  revenue_inr    float8,                 -- Estimated revenue ₹/year
  gps_string     text,                   -- Formatted GPS string
  created_at     timestamptz default now()
);

-- ─── 3. GENERATION_LOGS ───────────────────
-- Daily/periodic logs tied to a prediction
create table if not exists generation_logs (
  id             uuid    primary key default uuid_generate_v4(),
  prediction_id  uuid    references predictions(id) on delete cascade,
  date           date    default current_date,
  source         text,                   -- 'Solar' | 'Wind'
  generation_kwh float8,                 -- Actual kWh generated
  efficiency_pct float8,                 -- Actual efficiency %
  status         text,                   -- 'Optimal' | 'Good' | 'Processing'
  created_at     timestamptz default now()
);

-- ─── 4. ACTIVITY_LOGS ─────────────────────
-- Stores every user action automatically
create table if not exists activity_logs (
  id            uuid    primary key default uuid_generate_v4(),
  user_name     text,
  user_email    text,
  action        text,                    -- 'Login' | 'Generate' | 'Download' | etc.
  detail        text,                    -- Action description
  location      text,                    -- GPS or city string
  category      text,                    -- 'auth'|'generate'|'view'|'download'|'search'
  ip_address    text,
  device        text,
  created_at    timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────
alter table users            enable row level security;
alter table predictions      enable row level security;
alter table generation_logs  enable row level security;
alter table activity_logs    enable row level security;

-- Allow all (open policy — tighten for production with JWT auth)
do $$ begin
  if not exists (select from pg_policies where tablename='users' and policyname='allow_all') then
    execute 'create policy allow_all on users for all using (true) with check (true)';
  end if;
  if not exists (select from pg_policies where tablename='predictions' and policyname='allow_all') then
    execute 'create policy allow_all on predictions for all using (true) with check (true)';
  end if;
  if not exists (select from pg_policies where tablename='generation_logs' and policyname='allow_all') then
    execute 'create policy allow_all on generation_logs for all using (true) with check (true)';
  end if;
  if not exists (select from pg_policies where tablename='activity_logs' and policyname='allow_all') then
    execute 'create policy allow_all on activity_logs for all using (true) with check (true)';
  end if;
end $$;

-- ─── PERFORMANCE INDEXES ──────────────────
create index if not exists idx_pred_created    on predictions(created_at desc);
create index if not exists idx_pred_user       on predictions(user_email);
create index if not exists idx_pred_type       on predictions(type);
create index if not exists idx_gen_prediction  on generation_logs(prediction_id);
create index if not exists idx_gen_date        on generation_logs(date desc);
create index if not exists idx_act_created     on activity_logs(created_at desc);
create index if not exists idx_act_user        on activity_logs(user_email);
create index if not exists idx_act_category    on activity_logs(category);

-- ══════════════════════════════════════════
-- Done! Open the app — data seeds automatically
-- on first login if all tables are empty.
-- ══════════════════════════════════════════
