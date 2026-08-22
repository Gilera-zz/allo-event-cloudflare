# Allo Event – Cloudflare deployment

Projektet är förberett för Cloudflare Workers. Det är en TanStack Start-app med SSR och statiska assets. Den befintliga Vite/Lovable-konfigurationen bygger redan med Cloudflare som Nitro-target, så den ska inte ersättas med en extra Cloudflare Vite-plugin utan anledning.

## 1. Installera beroenden

```bash
npm install
```

## 2. Logga in på Cloudflare

```bash
npx wrangler login
```

Kontrollera kontot:

```bash
npm run cf:whoami
```

## 3. Testa build lokalt

```bash
npm run build
npm run preview
```

## 4. Deploy

```bash
npm run deploy
```

Första deployen skapar Worker-projektet `allo-event-web` och ger en tillfällig `*.workers.dev`-adress.

## 5. Koppla alloevent.se

I Cloudflare Dashboard:

1. Lägg till `alloevent.se` i Cloudflare om domänen inte redan ligger där.
2. Följ Cloudflares instruktioner för nameservers hos nuvarande registrar.
3. Gå till **Workers & Pages** → `allo-event-web` → **Settings / Domains & Routes**.
4. Lägg till `alloevent.se` som Custom Domain.
5. Lägg även till `www.alloevent.se` och välj vilken version som ska vara canonical/redirect.
6. Kontrollera att SSL är aktivt innan Netlify-DNS tas bort.

## 6. Supabase

Supabase påverkas inte av flytten. Databas, autentisering, projekt och bokningsdata fortsätter ligga i Supabase.

Projektet har idag fallback-värden för den publika Supabase-URL:en och publishable key. Om ni vill hantera dem via buildmiljön istället, sätt:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

som build environment variables i Cloudflare.

Supabase `anon` / publishable key är avsedd att kunna användas i klientkod. En `service_role`-nyckel får däremot aldrig läggas i Vite-variabler eller skickas till webbläsaren.

## 7. Flytta från Netlify utan driftstopp

Rekommenderad ordning:

1. Deploya Cloudflare-versionen till `workers.dev`.
2. Testa startsida, Case/projekt, bokningsformulär, login/admin, språkbyte och alla externa länkar.
3. Koppla domänen till Cloudflare.
4. Testa `https://alloevent.se` och `https://www.alloevent.se`.
5. Först därefter avslutas Netlify-planen.

## Gratisnivån

Cloudflare tar inte betalt för vanliga statiska asset-anrop. SSR-anrop kör Worker-koden och räknas mot Workers Free-planens kvot. För en normal företagshemsida är gratisnivån normalt mycket generös, men kontrollera användningen i Cloudflare Dashboard efter flytten.
