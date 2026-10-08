# rustzen-hub Agent Guide

## Scope

`rustzen-hub` is the Rustzen web monorepo.

- `apps/site` owns the public website, product pages, download page, docs entry, and about page.
- `apps/console` owns the admin console, dashboard, product/release/license surfaces, billing hooks, and related APIs.
- `packages/*` is for shared assets only after a dependency is used across more than one app.
- `contracts/*` is the versioned authority for product IDs, feature IDs,
  entitlement protocols, and runtime policies. Product repositories may consume
  immutable snapshots but must not redefine policy.

This repository replaces the old split between `rustzen/rzen-portal` and `rustzen/rzen-platform`.

Preserve unrelated uncommitted work when changing either app.

## Boundaries

- Do not put public marketing/product pages in `apps/console`.
- Do not put admin-only pages, API route ownership, secrets, or Prisma changes in `apps/site`.
- Do not extract shared packages before both apps actually need the shared surface.
- Do not commit `.env`, `.env.local`, `.vercel/`, `.next/`, `.astro/`, `dist/`, `out/`, or `node_modules/`.
- Production deploy, Vercel environment changes, database changes, and webhook tests require explicit approval.

## Commands

Use npm from the repository root:

```bash
npm install
npm run build
npm run lint
npm run build --workspace @rustzen/site
npm run lint --workspace @rustzen/console
npm run build --workspace @rustzen/console
```

Use `/private/tmp/npm-cache` for dependency installs when running Codex-managed npm installs on this machine.

Report the branch, working-tree state, changed packages, checks run, and any unverified deployment, environment, database, or webhook risks.
