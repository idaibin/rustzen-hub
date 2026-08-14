# apps/console Deployment Notes

Status: current deployment notes
Date: 2026-06-25

## Deployment Classification

`apps/console` is a Peripheral Vercel project: Next.js App Router + Prisma +
PostgreSQL. Local validation used Homebrew PostgreSQL 17 and a local
`rustzen_console_test` database.

## Vercel Fact Sheet

| Item | Current evidence | Status |
| --- | --- | --- |
| Project/team | Vercel project `cloud` under `abin-projects` is the pre-cutover console project and carries the production env set | live Vercel query on 2026-07-01 |
| Domain | `console.rustzen.dev` | target domain for the new architecture; bind during the `rustzen-hub` cutover |
| Framework | Next.js from `package.json` and `src/app` | source |
| Build command | `npm run build` -> `node scripts/with-env.mjs prisma generate && next build` | verified locally |
| Output directory | Next.js managed output | local build verified; Vercel output not verified |
| Package manager | `package-lock.json`, root `package.json` workspaces | source |
| Env source | `.env.example` names | source |
| Vercel env | Existing `cloud` Vercel project env includes database, Blob, Creem, admin, license, and public URL groups | live Vercel query on 2026-07-01; values not committed |
| Runtime limits | Not found | not verified |
| `vercel.json` | Not found | not verified |
| `next.config.*` | Not found | not verified |

`.env.local`, `.next/`, `.vercel/`, and `node_modules/` are ignored/local-only.
`.vercel/` identifies the local Vercel link on this machine, but it is not
committed deploy truth and must not be committed. `.env.local` contains local
secrets and database URLs and must not be committed.

## Environment Groups

From `.env.example`:

| Group | Env names | Review concern |
| --- | --- | --- |
| Database | `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` | Prisma connectivity and migration target |
| Database platform reserve | `POSTGRES_URL` | Vercel/Postgres compatibility value; current Prisma datasource does not read it |
| Public URLs | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_APP_URL` should point at `https://console.rustzen.dev`; `NEXT_PUBLIC_SITE_URL` should point at `https://rustzen.dev` for public checkout return links |
| Admin auth | `RUSTZEN_ADMIN_USERNAME`, `RUSTZEN_ADMIN_PASSWORD`, `RUSTZEN_ADMIN_SECRET`, `RUSTZEN_ADMIN_API_TOKEN` | Dashboard credential handling, session signing, and operational API access |
| License/webhook | `LICENSE_JWT_SECRET`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `CREEM_WEBHOOK_SECRET` | `LICENSE_JWT_SECRET` signs opaque license bearer tokens and is required in production; webhook secrets verify provider HMAC signatures |
| Billing checkout | `CREEM_API_KEY`, `CREEM_RUSTZEN_CLEAR_PRODUCT_ID`, `CREEM_CHECKOUT_SUCCESS_URL` | Rustzen Clear Pro checkout and subscription fulfillment; live product identifierentifiers must be configured through deployment secrets |
| Product updater/downloads | `RUSTZEN_CLEAR_UPDATE_*`, `RUSTZEN_CLIPBOARD_UPDATE_*`, `RUSTZEN_ZIPPER_UPDATE_*` | Product-specific static fallback feeds and optional Blob origin allow-lists; a dashboard-published `tauri-updater` record takes precedence |
| Release uploads | `BLOB_READ_WRITE_TOKEN` | Public Blob store token used only by authenticated short-lived client-upload token exchange, server-side artifact verification, and immutable version-manifest publication; never expose it to the browser or commit it |
| Legacy license proxy | `RUSTZEN_LICENSE_SERVER_URL`, `RUSTZEN_LICENSE_SERVER_TOKEN` | Optional external license-server compatibility path, not the default desktop-client API |

The intended production domains are `https://console.rustzen.dev` for the
dashboard/API and `https://rustzen.dev` for the public site. Reuse the existing
Vercel console project during the cutover so production database, Blob, Creem,
admin, and license env values are not dropped. Values still belong in Vercel
project settings, not committed files.
Billing webhook events must identify the Rustzen product through metadata or the
configured product identifier; webhook ingestion records events without creating a
license when the product cannot be resolved.

## Local Database Verification

Verified on 2026-06-15:

1. `brew services start postgresql@17`
2. `pg_isready -h 127.0.0.1 -p 5432`
3. `createdb -h 127.0.0.1 -p 5432 rustzen_console_test`
4. `.env.local` pointed Prisma URLs to `rustzen_console_test`
5. `npm run db:push`
6. `npm run db:seed`
7. `npm run db:verify`
8. `psql -h 127.0.0.1 -p 5432 -d rustzen_console_test -c 'SELECT code, name FROM "Product" ORDER BY code;'`

`npm run db:verify` reported:

```json
{
  "products": 2,
  "licenses": 0,
  "devices": 0,
  "versions": 0,
  "billingEvents": 0
}
```

## Pre-Deploy Gate

Before any deploy:

1. Run `git status --short --branch` in `apps/console`.
2. Confirm current `package.json` scripts and package manager.
3. Configure required Vercel preview/prod env values; do not commit secrets.
4. Decide Prisma migration strategy before touching a real database.
5. Run `npm run db:generate`, `npm run lint`, and `npm run build`.
6. If database behavior changed, validate against a local test DB with
   `npm run db:push`, `npm run db:seed`, and `npm run db:verify`.
7. Confirm Vercel project/team/domain and keep Prisma-backed API routes on the
   Node runtime.
8. Confirm live billing product configuration in the provider dashboard without
   copying live identifiers into repository files.
9. For updater uploads, confirm the Blob store is public and test one signed
   old-to-new client update for each product without reusing signing keys.
10. Record verification evidence in the task report.

`npm run db:push` against production, production Vercel deploys, and real webhook
testing require explicit user approval.

## Not Found

- Committed `vercel.json`
- Committed `next.config.*`
- Committed CI workflow
- Committed Prisma migration files

## Verified

- Vercel target: reuse the existing console project carrying the production env
  set, then bind `console.rustzen.dev` during cutover.

## Not Verified

- Concrete Vercel preview/prod environment values; only env names and grouping
  were verified, not secret contents.
- Production `console.rustzen.dev` response after DNS propagation.
- Production PostgreSQL database availability.
- Production Prisma migration state.
- Billing webhook delivery and live product configuration.
- Lemon Squeezy webhook delivery for the legacy route.
- Desktop client consumption of activation or version routes.
- Authenticated Blob client uploads and installed old-to-new update/restart for
  Clipboard and Zipper.
