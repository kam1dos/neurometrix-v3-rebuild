-- ============================================================
-- NeuroMetrix Clinical Studio - Supabase Schema
-- Local-first app with optional authenticated Supabase sync
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) default auth.uid(),
  patient_code text not null,
  study_id text,
  first_name text,
  last_name text,
  date_of_birth date,
  age_at_baseline integer not null check (age_at_baseline between 18 and 120),
  education_years integer not null check (education_years between 0 and 30),
  sex text check (sex in ('F', 'M', 'O') or sex is null),
  care_track text not null default 'ReCODE prevention',
  preferred_protocol_id text not null default 'recode-baseline',
  is_deidentified boolean not null default false,
  notes text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_patients_owner_code on patients(owner_id, patient_code);
create index if not exists idx_patients_study on patients(study_id);

create table if not exists biomarker_panels (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) default auth.uid(),
  patient_id uuid not null references patients(id) on delete cascade,
  captured_at timestamptz not null default now(),
  panel_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_biomarker_panels_patient on biomarker_panels(patient_id, captured_at desc);

create table if not exists assessment_sessions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) default auth.uid(),
  patient_id uuid not null references patients(id) on delete cascade,
  patient_code text not null,
  protocol_id text not null,
  session_number integer not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  age_at_assessment integer,
  assessment_results jsonb not null default '{}'::jsonb,
  domain_scores jsonb not null default '{}'::jsonb,
  summary jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(patient_id, session_number)
);

create index if not exists idx_assessment_sessions_patient on assessment_sessions(patient_id, started_at desc);
create index if not exists idx_assessment_sessions_status on assessment_sessions(status);

alter table patients enable row level security;
alter table biomarker_panels enable row level security;
alter table assessment_sessions enable row level security;

drop policy if exists "patients_select_own" on patients;
drop policy if exists "patients_insert_own" on patients;
drop policy if exists "patients_update_own" on patients;
create policy "patients_select_own" on patients for select using (owner_id = auth.uid());
create policy "patients_insert_own" on patients for insert with check (owner_id = auth.uid());
create policy "patients_update_own" on patients for update using (owner_id = auth.uid());

drop policy if exists "biomarkers_select_own" on biomarker_panels;
drop policy if exists "biomarkers_insert_own" on biomarker_panels;
drop policy if exists "biomarkers_update_own" on biomarker_panels;
create policy "biomarkers_select_own" on biomarker_panels
  for select using (owner_id = auth.uid() and patient_id in (select id from patients where owner_id = auth.uid()));
create policy "biomarkers_insert_own" on biomarker_panels
  for insert with check (owner_id = auth.uid() and patient_id in (select id from patients where owner_id = auth.uid()));
create policy "biomarkers_update_own" on biomarker_panels
  for update using (owner_id = auth.uid() and patient_id in (select id from patients where owner_id = auth.uid()));

drop policy if exists "sessions_select_own" on assessment_sessions;
drop policy if exists "sessions_insert_own" on assessment_sessions;
drop policy if exists "sessions_update_own" on assessment_sessions;
create policy "sessions_select_own" on assessment_sessions
  for select using (owner_id = auth.uid() and patient_id in (select id from patients where owner_id = auth.uid()));
create policy "sessions_insert_own" on assessment_sessions
  for insert with check (owner_id = auth.uid() and patient_id in (select id from patients where owner_id = auth.uid()));
create policy "sessions_update_own" on assessment_sessions
  for update using (owner_id = auth.uid() and patient_id in (select id from patients where owner_id = auth.uid()));

create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_patients_updated_at on patients;
create trigger touch_patients_updated_at
before update on patients
for each row execute procedure touch_updated_at();

drop trigger if exists touch_biomarker_panels_updated_at on biomarker_panels;
create trigger touch_biomarker_panels_updated_at
before update on biomarker_panels
for each row execute procedure touch_updated_at();

drop trigger if exists touch_assessment_sessions_updated_at on assessment_sessions;
create trigger touch_assessment_sessions_updated_at
before update on assessment_sessions
for each row execute procedure touch_updated_at();

create or replace view session_overview as
select
  s.id,
  s.patient_id,
  s.patient_code,
  s.protocol_id,
  s.session_number,
  s.status,
  s.started_at,
  s.completed_at,
  s.domain_scores,
  s.summary,
  p.care_track,
  p.is_deidentified
from assessment_sessions s
join patients p on p.id = s.patient_id;

grant usage on schema public to authenticated;
grant select, insert, update on patients to authenticated;
grant select, insert, update on biomarker_panels to authenticated;
grant select, insert, update on assessment_sessions to authenticated;
grant select on session_overview to authenticated;

-- Demo-only anonymous policies can be enabled below if you explicitly want
-- unauthenticated browser access for a local showcase. Leave disabled for
-- any clinical or shared deployment.
--
-- create policy "demo_patients_select" on patients for select using (true);
-- create policy "demo_patients_insert" on patients for insert with check (true);
-- create policy "demo_patients_update" on patients for update using (true);
-- create policy "demo_biomarker_select" on biomarker_panels for select using (true);
-- create policy "demo_biomarker_insert" on biomarker_panels for insert with check (true);
-- create policy "demo_biomarker_update" on biomarker_panels for update using (true);
-- create policy "demo_sessions_select" on assessment_sessions for select using (true);
-- create policy "demo_sessions_insert" on assessment_sessions for insert with check (true);
-- create policy "demo_sessions_update" on assessment_sessions for update using (true);
