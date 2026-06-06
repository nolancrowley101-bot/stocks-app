# Stocks App

Yahoo-Finance-style stocks site: quote pages with chart + analyst targets, search, watchlist, portfolio tracking, news.

**Stack:** Next.js 15 · TypeScript · Tailwind · Prisma 6 + PostgreSQL · Auth.js v5 · yahoo-finance2 · lightweight-charts.

---

## Local setup

### 1. Install PostgreSQL

Easiest option: **Docker**.

```powershell
docker run -d --name stocks-pg `
  -e POSTGRES_USER=stocksapp `
  -e POSTGRES_PASSWORD=stocksapp_dev `
  -e POSTGRES_DB=stocksapp `
  -p 5432:5432 `
  postgres:16
```

No Docker? Install from <https://www.postgresql.org/download/windows/> (let it create the default `postgres` user, then create a DB/user with pgAdmin or `psql`).

### 2. Configure environment

`.env` is already created with sensible defaults that match the Docker command above. If you used different credentials, edit `DATABASE_URL`.

For `AUTH_SECRET`, generate a real value:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output into `.env` as `AUTH_SECRET="..."`.

### 3. Migrate the database

```powershell
npx prisma migrate dev --name init
```

This creates the tables and applies them to your local Postgres.

### 4. Run the dev server

```powershell
npm run dev
```

Open <http://localhost:3000>.

---

## Smoke test

1. Homepage loads — you should see indices, top movers, market news.
2. Click `AAPL` from the movers list — quote page with chart, key stats, analyst ratings, news.
3. Click **Sign up** in the navbar — create an account.
4. Go back to a quote page → tap **+ Watchlist** — should say "Added ✓".
5. Navigate to **Watchlist** — your ticker is there with a live price.
6. Navigate to **Portfolio** — add a holding (e.g., 10 shares of AAPL at $150).

If anything 500s, watch the dev server terminal — most failures will be `DATABASE_URL` misconfigured or Postgres not running.

---

## Useful scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Run production build
npx prisma studio    # Visual DB browser at localhost:5555
npx prisma migrate dev --name <something>   # Add a migration
```

---

## Project layout

```
src/
  app/
    api/             # API routes (search, quote, watchlist, portfolio, register)
    quote/[symbol]/  # Quote page
    watchlist/       # Watchlist page
    portfolio/       # Portfolio page
    signin, register, news, page.tsx, layout.tsx
  components/        # NavBar, SearchBox, PriceChart, AddToWatchlist, ui/
  lib/
    db.ts            # Prisma client singleton
    yahoo.ts         # All Yahoo Finance calls + DB-backed cache
    format.ts        # Currency/percent/time formatters
    cn.ts            # Tailwind className helper
  auth.ts            # Auth.js v5 config
  middleware.ts      # Protects /watchlist and /portfolio
prisma/
  schema.prisma      # DB schema
```

---

## Deployment

See `DEPLOY.md` for step-by-step VPS + domain + nginx + HTTPS instructions.
