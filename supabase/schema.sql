-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references auth.users(id) not null,
  name text not null,
  age int,
  note text,
  created_at timestamptz default now()
);
-- safe to re-run even if you already created this table before the `age`/`city` columns existed
alter table patients add column if not exists age int;

create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  checkin_date date not null,
  mood int not null check (mood between 1 and 5),
  sleep_quality int not null check (sleep_quality between 1 and 5),
  social_interaction int not null check (social_interaction between 1 and 5),
  medication_taken boolean not null default true,
  free_text_note text,
  behavior_change_flag boolean generated always as (mood <= 2 or sleep_quality <= 2) stored,
  created_at timestamptz default now(),
  unique (patient_id, checkin_date)
);

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  generated_at timestamptz default now(),
  risk_category text check (risk_category in ('low','medium','high')),
  contributing_factors jsonb,
  summary_text text
);

alter table patients enable row level security;
alter table daily_checkins enable row level security;
alter table ai_insights enable row level security;

create policy "caregiver owns their patient" on patients
  for all using (auth.uid() = caregiver_id) with check (auth.uid() = caregiver_id);

create policy "caregiver owns their checkins" on daily_checkins
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

create policy "caregiver owns their insights" on ai_insights
  for all using (patient_id in (select id from patients where caregiver_id = auth.uid()))
  with check (patient_id in (select id from patients where caregiver_id = auth.uid()));

-- ============================================================
-- Community feature: public profile + cross-user story sharing
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

-- Any authenticated caregiver can read any profile (needed to show display_name +
-- verified badge on posts from other users), but can only edit their own row.
create policy "profiles readable by authenticated" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users manage their own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Any authenticated caregiver can read every post (this is the whole point of the
-- community feed), but can only create/edit/delete their own posts.
create policy "posts readable by authenticated" on community_posts
  for select using (auth.role() = 'authenticated');
create policy "users insert their own posts" on community_posts
  for insert with check (auth.uid() = author_id);
create policy "users update their own posts" on community_posts
  for update using (auth.uid() = author_id);
create policy "users delete their own posts" on community_posts
  for delete using (auth.uid() = author_id);

-- Auto-verification: a caregiver earns the "Terverifikasi" badge once they've
-- logged 14 or more daily check-ins across their patient(s). This runs as
-- SECURITY DEFINER so it can update profiles.is_verified even though the
-- triggering user's own RLS policy on `profiles` only allows editing their own row
-- (the trigger acts on behalf of that same row, so this stays safe).
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

-- Lets any authenticated caregiver mark another caregiver's post as helpful
-- without needing UPDATE rights on the whole row (RLS only lets you edit your
-- own posts otherwise). SECURITY DEFINER + a narrow, single-purpose function
-- keeps this safe: it can only ever touch helpful_count, nothing else.
create or replace function increment_helpful(post_id uuid) returns void as $$
begin
  update community_posts set helpful_count = helpful_count + 1 where id = post_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function increment_helpful(uuid) to authenticated;
