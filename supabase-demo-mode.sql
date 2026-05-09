-- ============================================================
-- NeuroMetrix Clinical Studio — DEMO MODE policies
-- ============================================================
-- Run this in your Supabase SQL Editor if you want the app to work
-- without real Supabase Auth (anyone with the anon key can read/write).
--
-- ⚠️  DO NOT USE WITH REAL PATIENT DATA. This grants full access to the
-- anonymous role. It is only safe for local development, demos, and
-- single-user pilots where the anon key is not exposed publicly.
--
-- For production use the default policies in supabase-schema.sql, which
-- restrict each row by owner_id = auth.uid().
-- ============================================================

grant usage on schema public to anon;
grant select, insert, update on patients, biomarker_panels, assessment_sessions to anon;

drop policy if exists "demo_patients_select" on patients;
drop policy if exists "demo_patients_insert" on patients;
drop policy if exists "demo_patients_update" on patients;
create policy "demo_patients_select" on patients for select using (true);
create policy "demo_patients_insert" on patients for insert with check (true);
create policy "demo_patients_update" on patients for update using (true);

drop policy if exists "demo_biomarker_select" on biomarker_panels;
drop policy if exists "demo_biomarker_insert" on biomarker_panels;
drop policy if exists "demo_biomarker_update" on biomarker_panels;
create policy "demo_biomarker_select" on biomarker_panels for select using (true);
create policy "demo_biomarker_insert" on biomarker_panels for insert with check (true);
create policy "demo_biomarker_update" on biomarker_panels for update using (true);

drop policy if exists "demo_sessions_select" on assessment_sessions;
drop policy if exists "demo_sessions_insert" on assessment_sessions;
drop policy if exists "demo_sessions_update" on assessment_sessions;
create policy "demo_sessions_select" on assessment_sessions for select using (true);
create policy "demo_sessions_insert" on assessment_sessions for insert with check (true);
create policy "demo_sessions_update" on assessment_sessions for update using (true);
