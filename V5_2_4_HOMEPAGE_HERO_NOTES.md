# V5.2.4 — Homepage Hero Control

## Public homepage
- Removed automatic use of the newest operational project image.
- Added a controlled fixed hero mode.
- Added an optional Case slideshow mode using only published Cases explicitly marked for the hero.
- Case slideshow supports 4–15 second timing, crossfade, subtle slow zoom, slide metadata and manual slide navigation.
- Desktop loads at most 5 Case slides; mobile at most 3.
- `prefers-reduced-motion` disables automatic cycling and slow zoom.
- If Case slideshow has no eligible Cases, the manually selected fixed hero is used.
- If no manual hero exists, the site uses the monochrome graphical fallback.

## Admin
New route: `/admin/homepage` → **Hemsida & hero**

Editors can control:
- Fixed hero vs Case slideshow
- Desktop hero image
- Optional mobile hero image
- Image position
- Overlay darkness
- Slideshow interval
- Slow zoom
- Case metadata display
- Which published Cases appear in the slideshow
- Hero priority/order per Case

## Case CMS
Each Case also has:
- `Visa i hero slideshow`
- `Hero-prioritet`

## Database
Run `db/migrations/20260825_homepage_hero.sql` once in Supabase SQL Editor.
The migration is additive and does not delete existing projects or Cases.
