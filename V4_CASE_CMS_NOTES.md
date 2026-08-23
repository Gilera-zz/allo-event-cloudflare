# V4 — Selected Work + Project Case CMS

## Public site
- Added a new **Selected Work** layer above the existing live project/archive section.
- Added `/case/$slug` full case-study pages.
- Bundled an AI demo case, **Future Retail Summit 2026**, with optimized WebP imagery.
- Demo automatically disappears from Selected Work when a real published case exists.
- Existing current/completed project functionality remains below Selected Work.
- Case pages inherit the existing System / Light / Dark theme setup.

## Admin
- Added **Case CMS** to the existing admin sidebar.
- Existing `/admin/projects` cards now link into the relevant Case CMS project.
- Editor covers operational basics plus publication, hero/media, story, services, facts, timeline, gallery, quote, credits, CTA and SEO.
- Media can be uploaded to Supabase Storage.
- Ordered arrays can be moved up/down directly in the editor.
- **Fyll med demo-case** is safe: it fills presentation content only and does not overwrite operational title/dates/staffing/status/location.

## Supabase
Run once:
`db/migrations/20260823_project_case_cms.sql`

See `CASE_CMS_SETUP.md` for the exact workflow.
