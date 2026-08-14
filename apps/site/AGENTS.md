# apps/site Agent Guide

## Scope

`apps/site` is the Rustzen public website and product-site app inside `idaibin/rustzen-hub`.

It owns:

- `/`
- `/products`
- `/products/clear`
- `/download`
- `/docs`
- `/about`
- public policy and support pages
- product marketing assets under `public/` and `src/assets/`

It was migrated from the legacy `rustzen/rzen-portal` repository.

## Boundaries

- Do not put admin dashboard, authenticated console pages, Prisma schema changes, webhook handlers, or API route ownership here.
- Billing, license activation, update metadata, and download API routes belong to `apps/console`.
- `.vercel/`, `.astro/`, `.next/`, `out/`, `dist/`, and `node_modules/` are generated or local-only.

## Commands

Run from the repository root unless there is a narrow reason to work inside this app:

```bash
npm run build --workspace @rustzen/site
npm run dev --workspace @rustzen/site
npm run preview --workspace @rustzen/site
```

## Work Rules

- Reuse existing Astro layouts, components, `src/data/product.ts`, and `src/i18n.ts`.
- Keep route and content changes focused on the requested page.
- Keep English and Chinese mirrored routes aligned when adding public pages.
- Do not change deployment targets or Vercel project settings without explicit approval.
