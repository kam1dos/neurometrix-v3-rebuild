-- ============================================================
-- NeuroMetrix Clinical Studio — CLINICAL MODE policies
-- ============================================================
-- Reverses supabase-demo-mode.sql. Run this when you're ready to use
-- real authentication and per-user row-level security (each clinician
-- only sees their own patients via owner_id = auth.uid()).
-- ============================================================

revoke select, insert, update on patients, biomarker_panels, assessment_sessions from anon;

drop policy if exists "demo_patients_select" on patients;
drop policy if exists "demo_patients_insert" on patients;
drop policy if exists "demo_patients_update" on patients;
drop policy if exists "demo_biomarker_select" on biomarker_panels;
drop policy if exists "demo_biomarker_insert" on biomarker_panels;
drop policy if exists "demo_biomarker_update" on biomarker_panels;
drop policy if exists "demo_sessions_select" on assessment_sessions;
drop policy if exists "demo_sessions_insert" on assessment_sessions;
drop policy if exists "demo_sessions_update" on assessment_sessions;

-- Re-create the strict per-user policies from supabase-schema.sql
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
