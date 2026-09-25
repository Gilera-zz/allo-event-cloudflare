# CLAUDE.md – regler för alloevent.se

Det här repot är Allo Events webbplats **alloevent.se** (TanStack Start + React 19 + Tailwind v4),
driftsatt på Cloudflare som workern `allo-event-web`. Samma app innehåller adminpanelen på `/admin`
(personal, schema, tidrapporter, massutskick, leads, Case CMS, Hemsida & hero) och använder samma
Supabase-databas som personalsystemet.

## Produktion

- **alloevent.se är produktion. Push till `main` går live.** Cloudflare Workers Builds kör
  `bun run build` och `npx wrangler deploy` automatiskt vid varje push till `main`.
- Håll `main` i fungerande skick. Kör minst `bun run build` innan push.
- Pusha inte till `main` utan att användaren har godkänt det för just den ändringen.

## Git

- **Aldrig `git stash`.**
- **Aldrig force push**, och skriv aldrig om historik som redan är pushad (rebase/amend/squash).
- Committa inte ändringar i `bun.lock` om uppgiften inte uttryckligen handlar om beroenden.
- `src/routeTree.gen.ts` genereras av TanStack Router vid `dev`/`build`. Redigera den inte för hand.

## Databas

- **Databasändringar görs bara med uttryckligt godkännande, per steg.** Det gäller migrationer,
  RLS-policies, funktioner, buckets och alla skrivningar mot databasen.
- Databasen delas med personalsystemet. Tabeller som `projects`, `profiles` och
  `project_assignments` används av båda. En ändring här kan slå sönder personalsystemet.
- Migrationer ligger i `db/migrations/` och körs manuellt i Supabase SQL Editor (se
  `DATABASE_MIGRATIONS.md`). Alla tabeller skapas inte här – bilden i repot är ofullständig.
- Inga secrets i koden. Bara den publika Supabase-URL:en och publishable key får finnas i klienten.

## Publika sajten och admin delar kod

- Admin och den publika sajten delar `src/styles.css`, temat (`src/hooks/use-theme.tsx`),
  `__root.tsx`, Supabase-klienten och auth. **Varje ändring av den publika sidan måste hållas
  avgränsad så att admin inte påverkas.**
- Nya publika stilar ska ligga under en publik klass (t.ex. `.allo-site` eller ett eget
  `allo-*`-prefix). Ändra inte globala element-selektorer (`body`, `h1`, `a`, `button`, `input`,
  `*`) eller tema-variablerna i `:root`/`.dark` utan att kontrollera admin.
- Rör inte `src/components/ui/*` (shadcn, används av admin) för att lösa ett problem på den
  publika sajten.
- Rör inte `vite.config.ts` eller paketet `@lovable.dev/vite-tanstack-config` – det levererar
  hela Vite-/Nitro-/Cloudflare-konfigurationen.

## Språk (svenska och engelska)

Alla nya texter på den publika sajten skrivs på **både svenska och engelska**. Svenska är
standardspråk. Språket väljs i klienten (`localStorage["lang"]`, `"sv"` | `"en"`), inte via URL,
så servern renderar alltid svenska. Mönstret som faktiskt används i dag:

1. **`src/lib/i18n.ts`** – `export const translations = { sv: {...}, en: {...} }` med sektioner
   (`nav`, `hero`, `about`, `services`, `showcase`, `partners`, `projectsSection`, `contact`,
   `booking`). Sidan gör `const t = translations[lang]` och läser t.ex. `t.partners.nessim_desc`;
   komponenter kan få en del som prop (`<ProjectsSection t={t.projectsSection} />`). Samma
   nycklar måste finnas i både `sv` och `en`.
2. **`svCopy` / `enCopy` i `src/routes/index.tsx`** – platta objekt längst ner i filen med nyare
   startsidetexter. Sidan väljer `const copy = sv ? svCopy : enCopy` och läser `copy.heroLine` osv.
   Lägg in varje ny nyckel i båda objekten.
3. **Inline-ternärer** – vissa komponenter (`SiteHeader.tsx`, `ThemeToggle.tsx`,
   `BookingSection.tsx`, delar av `index.tsx`) får `lang`/`language` som prop och skriver
   `sv ? "Svensk text" : "English text"` direkt.

Välj det mönster som redan används i filen du ändrar. Lägg inte till ett nytt i18n-bibliotek.
Obs: case-sidan (`src/routes/case.$slug.tsx`) och en del texter i `ProjectsSection.tsx` är i dag
hårdkodade på ett språk (se `docs/KNOWN_ISSUES.md`) – nya texter där ska ändå skrivas på båda.

## Kommandon

```sh
bun install
bun run dev        # http://localhost:8080
bun run build      # måste gå igenom innan push
bun run typecheck  # tsc --noEmit (har kända fel, se docs/KNOWN_ISSUES.md)
bun run lint       # eslint (har kända fel, se docs/KNOWN_ISSUES.md)
```

Nya typecheck- eller lint-fel ska inte införas; befintliga fel är dokumenterade som baslinje.

## Rapporter och dokumentation

- Rapporter från Claude skrivs i **`.claude-reports/`** (ignoreras av git), t.ex.
  `.claude-reports/ÅÅÅÅ-MM-DD-ämne.md`.
- Kända problem och risker samlas i `docs/KNOWN_ISSUES.md`.
- Starta inga webbläsartester om uppgiften inte uttryckligen ber om det.
