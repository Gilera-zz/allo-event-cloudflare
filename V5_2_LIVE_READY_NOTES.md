# V5.2 Live-ready public Case state

This release removes all AI-generated public case media and keeps the Case CMS ready for real projects.

## Public website
- Removed the Future Retail Summit demo from Selected Work.
- Removed all AI-generated case images from `public/images/cases/`.
- Removed the public demo case route/fallback.
- Added a polished Case Archive empty state that automatically disappears as soon as the first real project is published as a case.
- Real published cases from Supabase continue to render normally.

## Case CMS
- Kept the CMS and existing project integration.
- Replaced `Fyll med demo-case` with `Fyll med case-mall`.
- The starter preset contains no fake client, metrics, quote or media.
- Nothing is saved until the user explicitly clicks Save.

## Database
No new migration is required for V5.2 itself.
The previous Case CMS migration is still required:
`db/migrations/20260823_project_case_cms.sql`

The availability fix from V5.1 is also included.
