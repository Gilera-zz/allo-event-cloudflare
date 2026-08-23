# V5 – Allo Operations Admin Redesign

This version continues directly from V4 Case CMS and redesigns the complete admin experience around the same monochrome Scandinavian / futuristic identity as the public site.

## Core admin shell
- New monochrome, theme-aware Operations shell.
- Rebuilt desktop sidebar with clearer information architecture.
- New mobile top bar + slide-in navigation drawer.
- Responsive layout for desktop, tablet and mobile.
- Allo logo is rendered monochrome automatically for light and dark themes.

## Theme system
- Admin now uses the same persistent theme engine as the public site.
- Three explicit modes: System / Light / Dark.
- System follows the device/browser preference live.
- Manual Light or Dark selections are persisted.
- Theme selector is available in both desktop and mobile admin navigation.

## Dashboard
- Rebuilt Operations overview.
- Live counts for leads, upcoming projects, confirmed crew and registered staff.
- Upcoming-project list using Supabase data.
- Recent customer-request list using Supabase data.
- Quick links to Projects, Schedule and Case CMS.
- No invented KPIs or fake business numbers.

## Existing admin modules
The redesign applies consistently to existing modules including:
- Projects & staffing
- Case CMS
- Customer enquiries / CRM
- Schedule & planning
- Timesheets & invoicing
- Staff views
- Availability
- Personal schedule
- Personal time reporting
- Placeholder modules such as 3D designs and mass communication

Tables, cards, filters, inputs, selects, textareas, modals and state badges have been normalised into the new design system.

## Case CMS
- V4 Case CMS is preserved.
- Existing Case CMS project data, gallery, timeline, SEO, publishing and media fields remain intact.
- The V4 migration is still required if it has not yet been run:
  `db/migrations/20260823_project_case_cms.sql`

## Lead compatibility fix
The booking form uses newer fields such as:
- `first_name`
- `last_name`
- `company_name`
- `category`
- `description`

The CRM view now supports both those fields and the older legacy lead fields (`name`, `company`, `event_type`, `message`). This prevents newer website enquiries from appearing with missing names/company/message in admin.

## Login
- Login page redesigned to match Allo Operations.
- Theme control available before login.
- Fully responsive split/editorial layout.

## Validation
A full dependency install/build could not be completed in the execution environment because `npm install` timed out. Changed TS/TSX files were syntax/type-parser checked with the global TypeScript compiler; only expected missing-dependency/module errors were present when checking without installed node_modules.

Cloudflare's connected build remains the final production compilation check.
