-- ============================================================
-- NeuroMetrix Clinical Studio — DEMO MODE policies
-- ============================================================
-- Run this in your Supabase SQL Editor if you want the app to work
-- without real per-user auth (any session, including the anonymous
-- key, can read/write all rows).
--
-- ⚠️  DO NOT USE WITH REAL PATIENT DATA. This grants full table-level
-- access to both the anon and authenticated roles. It is only safe for
-- local development, demos, and single-user pilots where the anon key
-- is not exposed publicly.
--
-- For production, run supabase-clinical-mode.sql which restricts each
-- row by owner_id = auth.uid().
-- ============================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on patients, biomarker_panels, assessment_sessions to anon, authenticated;

drop policy if exists "demo_patients_select" on patients;
drop policy if exists "demo_patients_insert" on patients;
drop policy if exists "demo_patients_update" on patients;
drop policy if exists "demo_patients_delete" on patients;
create policy "demo_patients_select" on patients for select using (true);
create policy "demo_patients_insert" on patients for insert with check (true);
create policy "demo_patients_update" on patients for update using (true);
create policy "demo_patients_delete" on patients for delete using (true);

drop policy if exists "demo_biomarker_select" on biomarker_panels;
drop policy if exists "demo_biomarker_insert" on biomarker_panels;
drop policy if exists "demo_biomarker_update" on biomarker_panels;
drop policy if exists "demo_biomarker_delete" on biomarker_panels;
create policy "demo_biomarker_select" on biomarker_panels for select using (true);
create policy "demo_biomarker_insert" on biomarker_panels for insert with check (true);
create policy "demo_biomarker_update" on biomarker_panels for update using (true);
create policy "demo_biomarker_delete" on biomarker_panels for delete using (true);

drop policy if exists "demo_sessions_select" on assessment_sessions;
drop policy if exists "demo_sessions_insert" on assessment_sessions;
drop policy if exists "demo_sessions_update" on assessment_sessions;
drop policy if exists "demo_sessions_delete" on assessment_sessions;
create policy "demo_sessions_select" on assessment_sessions for select using (true);
create policy "demo_sessions_insert" on assessment_sessions for insert with check (true);
create policy "demo_sessions_update" on assessment_sessions for update using (true);
create policy "demo_sessions_delete" on assessment_sessions for delete using (true);
