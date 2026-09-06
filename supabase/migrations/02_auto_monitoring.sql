-- ============================================================
-- RELIVIA — Migration 02: automatic monitoring support (PRD §34)
-- Run AFTER supabase/schema.sql in Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- Constrain health_data.source to known origins (PRD §34)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'health_data_source_check'
  ) then
    alter table health_data
      add constraint health_data_source_check
      check (source in (
        'health_connect',
        'health_connect_simulation',
        'manual',
        'simulation',
        'demo_seed'
      ));
  end if;
end $$;

-- Track which trigger created an agent session (PRD §34:
-- agent_sessions.trigger metadata)
alter table agent_sessions
  add column if not exists trigger_source text default 'manual';

-- Indexes for the automatic pipeline + dedup queries (PRD §24)
create index if not exists idx_health_data_patient_date
  on health_data (patient_id, recorded_at desc);

create index if not exists idx_agent_sessions_patient_status
  on agent_sessions (patient_id, status, created_at desc);

create index if not exists idx_detected_changes_patient
  on detected_changes (patient_id, detected_at desc);

-- ────────────────────────────────────────
-- SYNC QUEUE (durable server-side mirror of the
-- local offline queue, PRD §32 — optional use)
-- ────────────────────────────────────────
create table if not exists sync_queue (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  payload jsonb not null default '{}',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz default now()
);

alter table sync_queue enable row level security;

drop policy if exists "caregiver owns sync_queue" on sync_queue;
create policy "caregiver owns sync_queue" on sync_queue
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

create index if not exists idx_sync_queue_patient
  on sync_queue (patient_id, created_at);
