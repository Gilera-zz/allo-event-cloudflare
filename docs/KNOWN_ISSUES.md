# Kända problem och risker

Sammanställt vid grundarbetet 2026-09-25 (kartläggning utan ändringar).
Punkter markerade **(verifiera i DB)** bygger på koden och migrationerna i repot. Den faktiska
databasen har inte kontrollerats, eftersom `projects`, `profiles`, `leads`, `user_roles` och
`project_assignments` skapades utanför repot. Punkter markerade **(bekräftat i DB)** har
kontrollerats mot en export av RLS-reglerna i Supabase (2026-09-25).

## Säkerhet och databas

1. **`projects` är fullt läsbar för anonyma** **(bekräftat i DB)**. Policyerna
   "Allow public read access on projects" och "Public can read projects" (SELECT, `anon` och
   `authenticated`, `USING true`) gör att vem som helst med publishable key kan läsa alla
   operativa projekt och alla kolumner. Den publika sajten filtrerar på `public_visible=true` i
   klienten (`ProjectsSection.tsx`, `case.$slug.tsx`, `HomepageHeroBackground.tsx`), men det
   skyddar ingenting. `BookingSection.tsx:148-163` räknar anonymt över alla projekt (räknaren
   renderas inte).
   **Åtgärdad 2026-09-25.** `db/migrations/20260925_projects_restrict_anon_read.sql` är körd.
   De två öppna policyerna är ersatta med "Anon reads public projects", så anon läser nu bara
   projekt med `public_visible = true`.
2. **Alla kundförfrågningar (`leads`) är läsbara för vem som helst** **(bekräftat i DB)**.
   Formuläret fungerade tack vare policyn "Allow anon select" (SELECT, `public`, `USING true`),
   eftersom det gjorde `.insert(...).select("id").single()`. Läsrätten är en läcka: alla leads med
   namn, e-post, telefon och meddelande kan läsas med publishable key. Det finns ingen annan
   SELECT-policy, så admin läser via samma öppna policy. "Allow anon insert" (INSERT, `public`,
   `WITH CHECK true`) finns också. Policyn "Public can submit booking requests" från
   `20260611_leads_public_insert.sql` finns inte i exporten.
   **Åtgärdad 2026-09-25.** Formuläret sparar utan att läsa tillbaka (`.select("id").single()`
   borttaget), och `db/migrations/20260925_leads_close_public_read.sql` är körd: "Allow anon
   select" är borttagen och "Admins read leads" (`has_role(auth.uid(), 'admin')`) tillagd. Bara
   admin kan läsa leads.
   Kvar **(verifiera i DB)**: tomma datum- och antalsfält skickas som `""` till kolumner av typen
   `date`/`integer`, vilket kan ge typfel.
3. **`profiles_self_update_notice_pref` är för bred** (`20260626_receive_job_notices.sql:18-23`).
   Den tillåter UPDATE av alla kolumner i den egna profilen (t.ex. `is_admin`, `personal_id`) om
   inget annat hindrar det. **(bekräftat i DB, delvis):** `has_role(uid, role)` läser bara
   `public.user_roles`, så `is_admin` i `profiles` ger ingen behörighet i RLS i den här databasen.
   Sajten använder `profiles.is_admin` bara för visning och målgruppen "admins" i massutskick
   (punkt 5). Kvar att kontrollera: om personalportalen använder `is_admin` för behörighet.
4. **All behörighetskontroll i admin sker i klienten** (`src/routes/admin.tsx:11-20`,
   `use-auth.tsx`). Säkerheten vilar helt på RLS, som för `projects`, `profiles`, `leads`,
   `user_roles` och `project_assignments` inte syns i repot.
5. **Två sanningskällor för admin:** `user_roles` (auth, massutskick) och `profiles.is_admin`
   (`admin.staff.tsx`, målgruppen "admins" i `admin.massutskick.tsx`).
6. **`time_sheets`-policyn: stämmer inte** **(bekräftat i DB)**. Den faktiska policyn kräver att
   `status` förblir 'Väntar på godkännande' vid uppdatering, så personal kan inte sätta t.ex.
   "Fakturerad" själv. (Beskrivningen byggde på `20260608_time_tracking.sql:71-73`, som inte
   motsvarar databasen.) Kvar: delete-fel ignoreras i `admin.min-tidrapport.tsx`,
   `admin.schema.tsx:138` och `admin.timesheets.tsx:204`.
7. **`clients` är läsbar för all inloggad personal** **(bekräftat i DB)**, inklusive
   `org_number` och `billing_email` (`20260608_time_tracking.sql:25-27`). Troligen avsiktligt
   (personal väljer kund i tidrapporter och schema), men ska bekräftas.
8. **`public.has_role()` definieras inte i repot** men alla admin-policies i migrationerna
   använder den. Enligt exporten finns den i databasen och läser bara `public.user_roles`.
9. **Case CMS skriver över operativa fält** i den delade tabellen `projects`
   (`admin.case-cms.tsx:205-214`: `title, category, location, starts_at, ends_at,
   positions_needed, image_url, description, status`). Tomma fält blir `null`, och `status` är
   fritext som kan krocka med personalsystemets värden.
10. **`DATABASE_MIGRATIONS.md`** saknar `20260826_mass_email_opt_out.sql` och
    `20260826_project_public_visibility.sql` i den rekommenderade ordningen.
11. **Ingen genererad Supabase-typfil** och ingen `Database`-generic. Felaktiga kolumnnamn fångas
    inte vid kompilering; flera `as X[]`-casts ger typecheck-fel (se Kodkvalitet).
11a. **Statusändring och borttagning av leads i admin** **(åtgärdad 2026-09-25)**. Tidigare
    fanns ingen UPDATE- eller DELETE-policy på `leads`, så RLS stoppade ändringar tyst (0 rader,
    inget fel). `admin.leads.tsx` kör `update(...).eq("id", id).select("id")` och
    `delete().eq("id", id).select("id")` och visar ett fel ("Kunde inte spara status" /
    "Kunde inte ta bort förfrågan") när inga rader kommer tillbaka.
    `db/migrations/20260925_leads_admin_update_delete.sql` ("Admins update leads",
    "Admins delete leads") är körd, och det är testat att status sparas och att borttagning
    fungerar.

## Projekt och admin

12. **Inget i repot skapar projekt.** Projekt skapas bara utanför (troligen i personalsystemet).
    Case CMS kan bara redigera befintliga rader (`admin.case-cms.tsx:194`).
13. **Schema, tidrapporter och tillgänglighet har ingen koppling till `projects`.** De kopplas till
    `clients` och användare. Bara `project_assignments.project_id` pekar på projekt.
14. **Olika definitioner av "bekräftad" bemanning:** `admin.projects.tsx:56` räknar
    `confirmed/accepted`, `admin.index.tsx:95` räknar även `approved/booked` och gissar tabellnamn
    (`project_assignments`, `assignments`, `staff_assignments`, `bookings`).
15. **Fel från `project_assignments` hanteras inte** i `admin.projects.tsx:49-51` (bemanning visar
    tyst 0).
16. **Hero-listan i admin** (`admin.homepage.tsx:62`) filtrerar bara på `case_published`, men den
    publika heron kräver även `public_visible`. Admin kan välja case som aldrig visas.
17. **Admins "Min sida"-vyer** (`mitt-schema`, `min-tidrapport`, `tillganglighet`,
    `mina-projekt`) nås bara av admins, eftersom `/admin` släpper igenom endast admins.

## SEO och rendering

18. **Allt innehåll från databasen laddas i webbläsaren** (useEffect). Inga loaders på servern.
    Case-listan, projekten och hero-bilderna syns inte för sökmotorer.
19. **Case-sidan renderar bara "Laddar case" på servern.** Titel och beskrivning är statiska
    ("Case | Allo Event") och skrivs om i klienten. Ingen canonical, inga og-taggar,
    `og_image_url` hämtas men används inte.
20. **Okänd case-slug ger HTTP 200** (mjuk 404), och 404-vyn saknar header och footer.
21. **Ingen sitemap.** `/sitemap.xml` ger 404 och `robots.txt` pekar inte på någon.
22. **Admin och `/login` saknar `noindex`.** Admin-sidor har ingen egen titel alls.
23. **Språket väljs bara i klienten** (`localStorage["lang"]`). Servern renderar alltid svenska,
    `<html lang="sv">` ändras aldrig, inga `hreflang`, ingen engelsk URL.
24. **Ingen `og:image`** på någon sida trots `twitter:card=summary_large_image`.
25. **Ingen favicon-länk i `<head>`** trots att `public/favicon*.png`, `favicon.ico` och
    `apple-touch-icon.png` finns (bara `/favicon.ico` hittas automatiskt).

## Innehåll

26. **Blandade språk och hårdkodade texter** som inte följer språkvalet: "SELECTED WORK",
    "VIEW CASE", "View case", "WE MAKE IT HAPPEN.", hela BuilderPreview, "Adminpanelen",
    rollchipsen i bemanningsdialogen, integritetspolicyn, flera aria-labels och **hela case-sidan**.
27. **Integritetspolicyn** (`BookingSection.tsx`, PrivacyModal) har adressen Bjursätragatan 77,
    Bandhagen (sajten anger Surbrunnsgatan 30), nämner Netlify fast sajten ligger på Cloudflare, och
    "Senast uppdaterad" genereras från dagens datum.
28. **`tel:`-länkar innehåller "(0)"** (`tel:+46(0)702239680`) i kontaktkorten.
29. **"Jobba hos oss" i footern öppnas i samma flik**, i headern i ny flik.
30. **"Kundens ord" i projektmodalen visas aldrig**, eftersom `client_notes` inte hämtas.
31. **Död kod och oanvända texter:** `completedCount` och `NEED_TYPES` i `BookingSection.tsx`,
    `svCopy.heroLine`, stora delar av `i18n.nav/hero/services/showcase/contact/booking`,
    `src/lib/lovable-error-reporting.ts` (importeras inte).
32. **`#choose` och `#partners` länkas inte** från nav, mobilmeny eller footer. `#service-*` aliasas
    alltid till `#services`. Mobilmenyn saknar tjänsternas underlänkar.
33. **AI-genererade demobilder finns kvar** i `public/images/cases/future-retail-summit-2026/`
    (`hero.webp`, `build.webp`, `registration.webp`). Ingen kod refererar dem, men
    `V5_2_LIVE_READY_NOTES.md` säger att de togs bort. De publiceras ändå som statiska filer.
    Oanvända partnerlogor: `nessim-logo.png`, `nessim-logo-display.png`.

## Kodkvalitet och verktyg

34. **Typecheck-baslinje: 9 fel** (8 om `routeTree.gen.ts` är nygenererad). 7 × TS2352
    (`GenericStringError` castas till egna typer p.g.a. otypad Supabase-klient), 1 × TS2345 i
    `admin.index.tsx:212`, 1 × TS2345 i `admin.homepage.tsx:26` som beror på punkt 35.
35. **`src/routeTree.gen.ts` i git är inaktuell.** Den saknar `/admin/homepage`. Den genereras om
    vid `dev`/`build`, så produktion fungerar, men filen blir ändrad lokalt efter varje bygge.
36. **Lint-baslinje: 12 714 problem (12 700 fel, 14 varningar)**, varav 12 692 `prettier/prettier`.
    11 492 av dem är `Delete ␍` på Windows: repot saknar `.gitattributes` och `core.autocrlf=true`
    ger CRLF i arbetskopian. Övrigt: 4 `no-irregular-whitespace`, 3 `no-explicit-any`,
    1 `no-unused-expressions`, 9 `react-refresh/only-export-components`,
    5 `react-hooks/exhaustive-deps`.
37. **Dev-servern lyssnar på alla nätverksgränssnitt** (port 8080, även LAN-adressen), eftersom
    Lovable-konfigurationen sätter host/port.
38. **Lovable-rester:** mappen `.lovable/`, `src/lib/lovable-error-reporting.ts`, paketnamnet
    `tanstack_start_ts` och kommentarer om Lovable i `vite.config.ts`. Paketet
    `@lovable.dev/vite-tanstack-config` levererar hela byggkonfigurationen och ska inte tas bort
    utan en ersättning.
39. **Många versionsanteckningar i roten** (`V3_*` – `V6_*`, `REDESIGN_NOTES.md` m.fl.) som delvis
    motsäger koden (se punkt 33).

## Stilar (`src/styles.css`, delas av publik sajt och admin)

40. **Portaler hamnar utanför scope.** Radix Select/Dialog/DropdownMenu och Sonner renderas under
    `<body>` och läser `:root`/`.dark`-tokens. Admins Select (massutskick) och toasts får därför den
    publika krämfärgen och guldaccenten. En ändring i `:root`/`.dark` (r. 47–110) slår igenom i
    admin, `/login` och 404/fel-sidorna.
41. **Globala selektorer som påverkar admin:** `html { scroll-behavior: smooth }` (r. 2937),
    `h1–h3` letter-spacing (r. 130), `body`-transition (r. 125), oscopat `#builder` (r. 3314).
42. **Egen CSS ligger utanför `@layer`** och vinner alltid över Tailwind. Selektorer bygger på
    utility-klassnamn (`.admin-app .rounded-lg`, `[class*="sticky top-6"]`,
    `.allo-about-panel .text-white\/70`) och DOM-struktur (`#booking > div > div > div:first-child`,
    `[style*=…]`). De går sönder tyst vid ändringar i TSX.
43. **233 rader med `!important`.** `.admin-app :where(input, select, textarea)` (r. 2593–2604)
    tvingar stil på alla fält i admin.
44. **`--accent: #fff` / `--ring: rgba(255,255,255,.58)`** sätts på `.allo-site` (r. 504–505) och
    återställs aldrig: vita fokusringar på ljus bakgrund i ljust läge (latent).
45. **Inga fonter laddas.** Inter och Urbanist används men laddas inte (ingen länk, ingen
    `@font-face`). Besökare utan fonterna installerade får `system-ui`.
46. **Temavalet är gemensamt** (`localStorage["allo-theme"]`): tema bytt i admin byts även publikt.
47. **Admin-block insprängda i publika delar** (r. 3015–3101, 3349–3353) och stora mängder död
    kaskad (V1 r. 144–490, V6-hero r. 3105–3217/3318–3340, `.allo-builder-*`, `.allo-demo-notice`).
    `allo-section-kicker-dark` och `allo-theme-heading-dark` används i TSX men saknar CSS.
