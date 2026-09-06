-- ============================================================
-- RELIVIA — Full Database Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- Safe to re-run: uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ────────────────────────────────────────
-- CORE: patients
-- ────────────────────────────────────────
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references auth.users(id) not null,
  name text not null,
  age int,
  note text,
  date_of_birth date,
  created_at timestamptz default now()
);
alter table patients add column if not exists age int;
alter table patients add column if not exists date_of_birth date;

-- ────────────────────────────────────────
-- CORE: daily_checkins
-- ────────────────────────────────────────
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  checkin_date date not null,
  mood int not null check (mood between 1 and 5),
  sleep_quality int not null check (sleep_quality between 1 and 5),
  social_interaction int not null check (social_interaction between 1 and 5),
  medication_taken boolean not null default true,
  appetite text check (appetite in ('decreased','normal','increased')) default 'normal',
  self_care text check (self_care in ('decreased','normal','improved')) default 'normal',
  behavior_change boolean not null default false,
  free_text_note text,
  behavior_change_flag boolean generated always as (mood <= 2 or sleep_quality <= 2) stored,
  created_at timestamptz default now(),
  unique (patient_id, checkin_date)
);
alter table daily_checkins add column if not exists appetite text check (appetite in ('decreased','normal','increased')) default 'normal';
alter table daily_checkins add column if not exists self_care text check (self_care in ('decreased','normal','improved')) default 'normal';
alter table daily_checkins add column if not exists behavior_change boolean not null default false;

-- ────────────────────────────────────────
-- HEALTH DATA (from Health Connect / simulation)
-- ────────────────────────────────────────
create table if not exists health_data (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  data_type text not null check (data_type in ('sleep_hours','steps','heart_rate')),
  value numeric not null,
  unit text not null,
  recorded_at date not null default current_date,
  source text not null default 'manual',
  created_at timestamptz default now(),
  unique (patient_id, data_type, recorded_at)
);

-- ────────────────────────────────────────
-- BASELINES (personal behavioral baseline per metric)
-- ────────────────────────────────────────
create table if not exists baselines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  metric text not null,
  baseline_value numeric not null,
  baseline_min numeric,
  baseline_max numeric,
  sample_count int not null default 0,
  calculated_at timestamptz default now(),
  unique (patient_id, metric)
);

-- ────────────────────────────────────────
-- DETECTED CHANGES
-- ────────────────────────────────────────
create table if not exists detected_changes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  metric text not null,
  baseline_value numeric not null,
  current_value numeric not null,
  change_percent numeric not null,
  severity text not null check (severity in ('normal','meaningful_change','significant_change')),
  detected_at timestamptz default now()
);

-- ────────────────────────────────────────
-- AGENT SESSIONS (stateful investigation)
-- ────────────────────────────────────────
create table if not exists agent_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  trigger text not null,
  status text not null check (status in ('investigating','waiting_for_caregiver','completed')) default 'investigating',
  current_context jsonb default '{}',
  questions_asked jsonb default '[]',
  caregiver_responses jsonb default '[]',
  analysis_history jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ────────────────────────────────────────
-- CLINICAL INSIGHTS (from Agent)
-- ────────────────────────────────────────
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  agent_session_id uuid references agent_sessions(id),
  detected_changes jsonb default '[]',
  related_factors jsonb default '[]',
  monitoring_points jsonb default '[]',
  context_notes text,
  interpretation text,
  summary text,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────
-- CONSULTATION BRIEFS
-- ────────────────────────────────────────
create table if not exists consultation_briefs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  insight_id uuid references insights(id),
  observation_period_start date,
  observation_period_end date,
  key_changes jsonb default '[]',
  baseline_comparison jsonb default '{}',
  caregiver_observation text,
  medication_status text,
  relevant_history text,
  questions_for_consultation jsonb default '[]',
  full_content text,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────
-- LEGACY: ai_insights (backward compat)
-- ────────────────────────────────────────
create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  generated_at timestamptz default now(),
  risk_category text check (risk_category in ('low','medium','high')),
  contributing_factors jsonb,
  summary_text text
);

-- ────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────
alter table patients enable row level security;
alter table daily_checkins enable row level security;
alter table ai_insights enable row level security;
alter table health_data enable row level security;
alter table baselines enable row level security;
alter table detected_changes enable row level security;
alter table agent_sessions enable row level security;
alter table insights enable row level security;
alter table consultation_briefs enable row level security;

-- patients
drop policy if exists "caregiver owns their patient" on patients;
create policy "caregiver owns their patient" on patients
  for all using (auth.uid() = caregiver_id) with check (auth.uid() = caregiver_id);

-- daily_checkins
drop policy if exists "caregiver owns their checkins" on daily_checkins;
create policy "caregiver owns their checkins" on daily_checkins
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- ai_insights (legacy)
drop policy if exists "caregiver owns their insights" on ai_insights;
create policy "caregiver owns their insights" on ai_insights
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- health_data
drop policy if exists "caregiver owns health_data" on health_data;
create policy "caregiver owns health_data" on health_data
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- baselines
drop policy if exists "caregiver owns baselines" on baselines;
create policy "caregiver owns baselines" on baselines
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- detected_changes
drop policy if exists "caregiver owns detected_changes" on detected_changes;
create policy "caregiver owns detected_changes" on detected_changes
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- agent_sessions
drop policy if exists "caregiver owns agent_sessions" on agent_sessions;
create policy "caregiver owns agent_sessions" on agent_sessions
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- insights
drop policy if exists "caregiver owns new insights" on insights;
create policy "caregiver owns new insights" on insights
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- consultation_briefs
drop policy if exists "caregiver owns consultation_briefs" on consultation_briefs;
create policy "caregiver owns consultation_briefs" on consultation_briefs
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- ============================================================
-- COMMUNITY (existing — unchanged)
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  city text,
  total_checkins int not null default 0,
  is_verified boolean not null default false,
  created_at timestamptz default now()
);
alter table profiles add column if not exists city text;

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  helpful_count int not null default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table community_posts enable row level security;

drop policy if exists "profiles readable by authenticated" on profiles;
create policy "profiles readable by authenticated" on profiles
  for select using (auth.role() = 'authenticated');
drop policy if exists "users manage their own profile" on profiles;
create policy "users manage their own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "posts readable by authenticated" on community_posts;
create policy "posts readable by authenticated" on community_posts
  for select using (auth.role() = 'authenticated');

drop policy if exists "users insert their own posts" on community_posts;
create policy "users insert their own posts" on community_posts
  for insert with check (auth.uid() = author_id);

drop policy if exists "users update their own posts" on community_posts;
create policy "users update their own posts" on community_posts
  for update using (auth.uid() = author_id);

drop policy if exists "users delete their own posts" on community_posts;
create policy "users delete their own posts" on community_posts
  for delete using (auth.uid() = author_id);

create or replace function update_caregiver_verification() returns trigger as $$
declare
  v_caregiver_id uuid;
  v_count int;
begin
  select caregiver_id into v_caregiver_id from patients where id = coalesce(NEW.patient_id, OLD.patient_id);
  if v_caregiver_id is null then
    return coalesce(NEW, OLD);
  end if;
  select count(*) into v_count from daily_checkins dc
    join patients p on p.id = dc.patient_id
    where p.caregiver_id = v_caregiver_id;
  update profiles set total_checkins = v_count, is_verified = (v_count >= 14)
    where id = v_caregiver_id;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_update_caregiver_verification on daily_checkins;
create trigger trg_update_caregiver_verification
  after insert or update or delete on daily_checkins
  for each row execute function update_caregiver_verification();

create or replace function increment_helpful(post_id uuid) returns void as $$
begin
  update community_posts set helpful_count = helpful_count + 1 where id = post_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function increment_helpful(uuid) to authenticated;
