# V5.2.5 Publishing Safety

- Adds an explicit `public_visible` master permission to projects.
- Existing projects default to private; the migration intentionally does not backfill visibility.
- Public ongoing/archive project lists only query `public_visible = true`.
- Published cases and hero slideshow require both publication and public visibility.
- Direct `/case/:slug` URLs require both flags.
- Case CMS includes “Tillåt på hemsidan” and a one-click “Dölj från hemsidan” action.
- “Dölj från hemsidan” preserves operational project data but disables case, featured and hero publication.
- Removed remaining Future Retail AI demo images from `public/`.

Run `db/migrations/20260826_project_public_visibility.sql` in Supabase before live.
