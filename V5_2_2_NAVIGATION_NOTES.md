# V5.2.2 Navigation & Anchor QA

This pass fixes in-page navigation on the public site so sticky-header links land on complete section compositions rather than cropped cards.

## Fixed
- Footer service links now keep their specific hashes (`#service-event`, etc.) but those hashes resolve at the top of the full Services section.
- Header service dropdown uses the same service aliases.
- Clicking Eventproduktion/Bemanning/Mässor & Monter/Rigg & Logistik now shows the section heading and all service cards instead of pinning one card beneath the sticky header.
- `Om Allo` now lands on the actual About section, not the proof/stat strip above it.
- Added consistent scroll padding/margins for the 74px sticky header on desktop and mobile.
- Added smooth in-page scrolling while respecting `prefers-reduced-motion`.
- Eventproduktion card now leads to the booking section instead of the unrelated About section.
- Audited all public hash links: every current internal hash has a matching unique target.

## Files changed
- `src/components/SiteHeader.tsx`
- `src/components/ProjectsSection.tsx`
- `src/components/BookingSection.tsx`
- `src/routes/index.tsx`
- `src/styles.css`
