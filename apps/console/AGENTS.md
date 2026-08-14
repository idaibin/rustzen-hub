# apps/console Agent Guide

## Scope

`apps/console` is the Rustzen admin console and API app inside `idaibin/rustzen-hub`.

It owns:

- login and dashboard pages;
- product, release, license, user, settings, and billing surfaces;
- Prisma schema and seed data;
- billing webhooks;
- license activation/verification APIs;
- update metadata and download APIs.

It was migrated from the legacy `rustzen/rzen-platform` repository.

## Boundaries

- Do not put public marketing pages, product landing pages, docs entry pages, or downloadable static site content here.
- Public website routes belong to `apps/site`.
- `.env`, `.env.local`, `.env.*.local`, `.next/`, `.vercel/`, and `node_modules/` are local-only and must not be committed.
- Database, production deploy, Vercel environment, billing webhook, and license-token changes require explicit approval.

## Commands

Run from the repository root unless there is a narrow reason to work inside this app:

```bash
npm run lint --workspace @rustzen/console
npm run build --workspace @rustzen/console
npm run db:generate --workspace @rustzen/console
npm run dev --workspace @rustzen/console
```

## Work Rules

- Read `package.json`, `.env.example`, `prisma/schema.prisma`, and the directly relevant `src/app/**` or `src/lib/**` files before changing API or dashboard behavior.
- Preserve current API contracts unless the task explicitly asks for a breaking change.
- Keep Vercel and runtime facts marked as not verified unless checked against the live deployment.
