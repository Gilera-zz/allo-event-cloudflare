# Allo Event database migrations

Do not paste every SQL file blindly into an existing Supabase project.
Migrations are one-time schema upgrades and some have dependencies.

## Recommended order for a brand-new / incomplete database

1. `20260608_time_tracking.sql`
2. `20260608_time_tracking_historical.sql`
3. `20260608_scheduled_shifts.sql`
4. `20260610_availability.sql`
5. `20260611_leads_public_insert.sql`
6. `20260626_receive_job_notices.sql`
7. `20260823_project_case_cms.sql`

## Existing Allo Event database

Run only migrations for features that have not already been applied. The current
`20260610_availability.sql` is upgrade-safe and can repair an older availability
table that lacks `status`, `note`, `created_at` or `updated_at`.

For the V4/V5 Case CMS, `20260823_project_case_cms.sql` must be applied once.
