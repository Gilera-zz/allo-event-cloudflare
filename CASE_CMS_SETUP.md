# Allo Event – Case CMS V4

This version builds a public case-study system on top of the existing `projects` table. It does **not** replace project staffing, assignments, dates or the existing public project/archive component.

## What is included

- New **Selected Work** presentation on the homepage.
- An AI-generated demo case: **Future Retail Summit 2026**.
- New public route: `/case/:slug`.
- New admin page: `/admin/case-cms`.
- Existing `/admin/projects` now links directly into the Case CMS editor for each project.
- Case media upload through a public Supabase Storage bucket called `case-media`.
- Additive Supabase migration: `db/migrations/20260823_project_case_cms.sql`.
- Existing light/dark/system theme continues to work.

## One-time Supabase setup

1. Open the Supabase project used by alloevent.se.
2. Open **SQL Editor**.
3. Copy and run the entire file:
   `db/migrations/20260823_project_case_cms.sql`
4. Verify that **Storage → case-media** exists.
5. Deploy/push the website as usual through GitHub → Cloudflare Workers.

The migration only adds presentation fields to the existing `projects` table and a media bucket. It deliberately does not replace the existing project read policy.

## Admin workflow

1. Log in to the existing admin panel.
2. Open **Admin Översikt → Case CMS**, or open **Projekt & Bemanning** and choose **Redigera projekt & case** on a project.
3. Select an existing project.
4. Fill in any combination of:
   - operational/basic data
   - public slug
   - published / featured state
   - client, venue and year
   - teaser and hero media
   - intro, challenge, solution and result
   - services delivered
   - quick facts
   - build/live timeline
   - gallery with alt text, captions and layout
   - quote and credits
   - CTA
   - SEO title, description and OG image
5. Save as a draft with **Publicera som case** off.
6. Use **Förhandsvisa** to inspect `/case/<slug>` while logged in.
7. Turn on **Publicera som case** and save when ready.

## Demo helper

**Fyll med demo-case** fills only the public presentation fields. It does **not** overwrite the selected project's operational title, dates, staffing need, status or location. Nothing is written to Supabase until **Spara ändringar** is clicked.

The homepage shows the bundled AI demo automatically until at least one real case has `case_published = true`. As soon as a real case is published, live Case CMS data replaces the demo.

## Demo disclaimer

Future Retail Summit 2026, its statistics, quote and images are fictitious/AI-generated and are included only to demonstrate the layout. Do not present them as a real Allo Event delivery.

## Media recommendations

- Hero images: 1800–2400 px wide, WebP/AVIF preferred.
- Gallery images: 1400–2200 px wide, WebP/AVIF preferred.
- Hero video: 8–15 seconds, muted, MP4/WebM, ideally under 8–12 MB.
- Always fill in alt text for public images.

## Data model philosophy

Operational project data stays in the original columns. Public case content uses `case_*` fields on the same row. Arrays such as services, facts, timeline, gallery and credits are stored as JSONB so the system stays simple and does not require a second CMS.

## Homepage hero integration (V5.2.4)

After the Case CMS migration, also run `db/migrations/20260825_homepage_hero.sql`.
That migration adds the explicit Case-to-hero opt-in fields and the singleton
homepage settings row. Published Cases are never added to the homepage hero
unless `Visa i hero slideshow` is enabled.
