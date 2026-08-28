# V6 — Clear Offer Architecture

This release keeps the existing Scandinavian monochrome visual system but rebuilds the public homepage hierarchy so a first-time visitor understands Allo Event immediately.

## Changed

- New hero message: **VI BYGGER. VI BEMANNAR. VI LEVERERAR.**
- Clear supporting line explaining events, exhibitions and production from load-in to load-out.
- Added direct first-screen CTAs: **Boka personal** and **Be om offert**.
- Moved **WE MAKE IT HAPPEN.** into a brand/payoff role instead of using it as the main explanation.
- Added **Stockholm · Uppdrag i hela Sverige** in the hero.
- Added two large decision paths directly after the hero:
  - Bemanning
  - Produktion
- Moved Selected Work / public cases earlier on the homepage, before the detailed service catalogue.
- Reframed services as concrete deliveries rather than abstract business areas.
- Moved the 3D booth builder down into the exhibition delivery story and removed it as a top-level company identity in desktop navigation.
- Added **Så arbetar vi** to main navigation.
- Header CTA changed to **Be om offert**.
- Light-mode hero fallback now uses an off-white editorial canvas when no real hero media is configured. Real hero images still use the dark overlay for legibility.
- Admin hero preview updated to reflect the V6 headline.

## No migration required

No database or Supabase migration is required for V6. Existing hero settings, case CMS, booking, admin, mass-email and staff functionality are preserved.
