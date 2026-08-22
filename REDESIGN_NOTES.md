# Allo Event – public website redesign

This redesign updates the public landing page while leaving the existing application structure and backend functions intact.

## Preserved functionality

- Supabase-backed live projects / completed-project archive and project modals
- Existing booking form and lead submission to Supabase
- Admin authentication and admin routes
- Swedish / English language switch
- Light / dark theme control
- Staffing-role dialog
- Links to the personnel portal and the 3D booth builder
- Existing Nessim and WorkMan partner logos and partner copy
- Existing company and contact information

## Redesign changes

- Dark premium event-agency header and hero
- Hero can automatically use the latest project image from Supabase, with a graphic fallback
- Expanded navigation with Services, Cases, Build your booth, About and Contact
- Four distinct service areas: Event Production, Staffing, Fairs & Booths, Rigging & Logistics
- Existing live Projects section restyled as a case / Selected Work section
- Dedicated 3D booth-builder showcase
- Stronger About Allo section and delivery/value strip
- Partner cards redesigned around the existing logo files
- Existing booking form restyled to fit the new visual system
- Expanded contact section and footer
- Mobile navigation added
- Public-site colors are scoped under `.allo-site`, so admin pages are not recolored by the redesign variables

## Build note

The source ZIP did not include `node_modules`. Run the normal dependency install (`npm install` or your existing package-manager workflow) before `npm run build` / `npm run dev`.
