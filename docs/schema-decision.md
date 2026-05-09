# Schema decision: 3-table JSON vs 11-table normalized

**Status:** open question. The current rebuild ships with the 3-table approach. The v2.0 build (Dec 2025, in `~/Downloads/_RNP_Practice/RNPRegen/Neuromatrix/neurometrix-clinical/`) used the 11-table approach. This memo lays out the tradeoff so the choice is deliberate, not accidental.

## What's actually different

**Current rebuild — 3 tables**

```
patients               (PII + demographics + protocol prefs)
biomarker_panels       (lab values keyed by patient + capture time)
assessment_sessions    (per-session metadata + results in JSON columns)
  └─ assessment_results jsonb  -- { stroop: {...}, trailA: {...}, ... }
  └─ domain_scores      jsonb  -- composite percentiles
  └─ summary            jsonb  -- ReCODE signals, narrative
```

**v2.0 — 11 tables**

```
patients
biomarker_records
assessment_sessions    (metadata only, no results)
stroop_results         (interference_score, accuracy, mean_rt, …)
symbol_digit_results   (throughput, cv_rt, errors, …)
trail_making_a_results (completion_time_ms, errors, …)
trail_making_b_results (completion_time_ms, ba_ratio, …)
spatial_span_forward_results
spatial_span_backward_results
verbal_memory_results
recode_analysis
```

## The actual tradeoff

| Dimension | 3-table (current) | 11-table (v2.0) |
|---|---|---|
| Add a new test | App-code change only — JSON is schemaless | DDL migration: new table + RLS policies + service mappers |
| Change a test's metric set | App-code change | DDL migration on that test's table |
| Single-patient queries | Trivial — 1 row, JSON.parse client-side | Requires LEFT JOINs across N tables |
| Cross-patient analytics ("avg Trail B/A in 60-69 cohort with high insulin") | `SELECT (assessment_results->'trailB'->>'completionTimeMs')::int FROM …` — works but slow, awkward, untyped | `SELECT AVG(ba_ratio) FROM trail_making_b_results JOIN …` — fast, typed, indexable |
| BI tools / Tableau / Looker | Need view-layer JSON unpacking | Native column access |
| Population norm building | Painful: every metric requires a JSON extraction CTE | Direct: `SELECT throughput FROM symbol_digit_results` |
| Postgres-level constraints (e.g. "max_span ≥ 0") | Application-level only | DB-enforced CHECK constraints |
| Schema versioning when test logic changes | No place to track it | Add a `version` column |

## Where this decision actually bites

The pain isn't on day one — it's the first time you want to do **anything analytical across patients**. Three concrete scenarios:

1. **"Is Dr. Patel's patient population's mean Stroop interference improving over 2026?"** — 3-table requires a SQL function or ETL job to expand JSON; 11-table is a one-liner.
2. **Publishing internal norms.** If you ever want to say "our cohort's Trail B 50th percentile at age 65 is 78s," the 11-table version is queryable; the 3-table version needs a flattening pipeline first.
3. **Apollo Health / Bredesen network data sharing.** Any external tool that imports your data will expect typed columns. 3-table forces you to build an export ETL anyway.

The pain on the **3-table side** is also real:

1. **Test iteration speed.** When you decided last December to add `cvRt` and `intrusions` and `baRatio`, the v2.0 monolith required schema migrations. The rebuild just adds keys to the JSON. That's why the rebuild made it to production faster — fewer DDL changes to coordinate.
2. **Pre-clinical / pilot data.** During iteration, you don't know what metrics you want yet. JSON lets you capture everything and decide later.

## Recommendation

**Stay with the 3-table approach for now**, with two small forward-compatibility additions:

1. **Add a `result_schema_version` column** to `assessment_sessions`:
   ```sql
   alter table assessment_sessions add column result_schema_version text not null default 'v1';
   ```
   Bump it whenever a test's JSON shape changes. A future migration script can branch on the version.

2. **Document the migration path** as a one-time script (don't write it now — write it when you actually need it). Sketch:
   ```sql
   insert into stroop_results (session_id, interference_score, accuracy, mean_rt, percentile)
   select id,
          (assessment_results->'stroop'->>'interferenceMs')::int,
          (assessment_results->'stroop'->>'accuracy')::int,
          (assessment_results->'stroop'->>'meanRtMs')::int,
          (assessment_results->'stroop'->>'percentile')::int
   from assessment_sessions
   where assessment_results ? 'stroop';
   ```
   Repeat per test. The data is fully recoverable from JSON.

**Switch to 11-table the day** any of these become true:
- You need a BI dashboard for population trends (Looker, Metabase, Tableau).
- You want to publish norms from your own data (research paper, RNP / CereNova white paper).
- You're integrating with Apollo Health or another platform that consumes structured cognitive data.
- Multiple clinicians are using the platform and someone wants cross-clinician analytics.

Until then, the speed of iteration on the 3-table model is worth more than the analytic flexibility of 11.

## What this means concretely for the next 90 days

- **Don't migrate yet.** No DDL changes needed. The rebuild's current schema is fine.
- **Add the version column** when you next touch the schema for any reason.
- **Re-read this memo** the first time you find yourself writing a non-trivial JSON-extraction query for a clinical question. That's the signal that 11-table has become the right choice.

## Out of scope for this memo

- Whether to add a separate `recode_analysis` table for ReCODE flag history (currently lives inside `summary` JSON). Probably worth doing when ReCODE flag logic stabilizes.
- Whether to denormalize biomarker values into typed columns (currently `biomarker_panels.panel_values` is JSON). Same answer: fine for now, revisit when querying.
- Trial-level data storage. Currently the per-trial RT arrays inside Stroop / SDMT are not saved — only summary metrics. Storing them would be a separate decision (storage cost vs reproducibility).
