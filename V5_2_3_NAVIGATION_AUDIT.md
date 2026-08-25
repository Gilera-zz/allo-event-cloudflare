# V5.2.3 Navigation audit

This release replaces the mixed CSS/native anchor behavior from V5.2.2 with one measured same-page scroll routine.

## Fixed
- Removed the double offset caused by combining `scroll-padding-top` and `scroll-margin-top`.
- Same-page links now measure the real sticky header height at click time.
- Desktop gets 24 px breathing room below the header; mobile gets 16 px.
- `#service-event`, `#service-staffing`, `#service-expo`, and `#service-logistics` intentionally resolve to `#services`, so the complete services heading and card composition remains visible.
- Header, dropdown, hero, footer, project CTAs, contact and booking hash links use the same behavior because the handler is delegated at document level.
- Browser Back/Forward between hash sections now restores the correct section; returning to a no-hash homepage returns to the top.
- Navigation from `/case/...` back to `/#services`, `/#projects`, `/#about`, etc. is corrected after the homepage mounts.
- CSS scroll margins remain only as a no-JavaScript/native fallback.

## Audit
Public homepage targets currently available:
- `#top`
- `#services`
- legacy service aliases (`#service-event`, `#service-staffing`, `#service-expo`, `#service-logistics`)
- `#projects`
- `#builder`
- `#about`
- `#partners`
- `#booking`
- `#contact`

All changed TS/TSX files pass a TypeScript syntax/transpile check.
