# Allo Event V3.1 polish

## Booking / "YOUR WORK. OUR PEOPLE."
- Removed the fragile inline gold/foreground heading treatment.
- Added explicit theme-aware classes for both headline rows.
- Fixed the old `#booking h2 { color: #fff !important; }` conflict by overriding it at the component level.
- `YOUR WORK.` now uses a readable secondary tone in both light and dark mode.
- `OUR PEOPLE.` remains the primary high-contrast line.
- Added a subtle monochrome grid and divider to improve composition without adding color.
- Kept form logic and Supabase submission unchanged.

## Partners
- Added a tightly cropped display asset for the Nessim logo so transparent whitespace no longer makes it appear tiny.
- Added a fixed 138px logo stage shared by both partner cards.
- Nessim and WorkMan now have separate optical sizing rules while sharing identical card geometry.
- Copy and CTA positions are isolated from logo dimensions, so resizing a logo does not shift headings or paragraphs.
- Mobile logo stage has its own stable height.

## QA
- Modified TSX files pass TypeScript syntax transpilation.
- No Supabase, Cloudflare/Wrangler, admin, routing, booking submission, or theme-state logic was changed.
