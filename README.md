# alloevent.se

Allo Events webbplats och adminpanel. Byggd med TanStack Start, React 19 och Tailwind v4, med
Supabase som databas och inloggning. Driftsätts på Cloudflare Workers som `allo-event-web`.

- **Publik sajt:** `/` (startsida) och `/case/$slug` (case-sidor).
- **Admin:** `/admin` – personal, schema, tidrapporter, massutskick, leads, Case CMS och
  Hemsida & hero. Delar Supabase-databas med personalsystemet.

> Push till `main` går live på alloevent.se via Cloudflare Workers Builds. Läs
> [CLAUDE.md](CLAUDE.md) innan du ändrar något.

## Kom igång lokalt

Kräver [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Dev-servern startar på <http://localhost:8080> och går mot den riktiga Supabase-databasen
(publik URL och publishable key finns som fallback i `src/integrations/supabase/client.ts`, eller
sätts med `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Skript

| Kommando | Vad det gör |
| --- | --- |
| `bun run dev` | Startar utvecklingsservern |
| `bun run build` | Produktionsbygge till `.output/` (samma som Cloudflare kör) |
| `bun run preview` | Förhandsgranskar bygget lokalt |
| `bun run typecheck` | Typkontroll med `tsc --noEmit` |
| `bun run lint` | ESLint (inklusive Prettier) |
| `bun run format` | Formaterar med Prettier |

## Driftsättning

Cloudflare Workers Builds kör `bun run build` och `npx wrangler deploy` vid varje push till
`main`. Se [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md) för detaljer.

## Mer dokumentation

- [CLAUDE.md](CLAUDE.md) – regler för arbete i repot
- [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) – kända problem och risker
- [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md) – migrationer i `db/migrations/`
- [CASE_CMS_SETUP.md](CASE_CMS_SETUP.md) – Case CMS
