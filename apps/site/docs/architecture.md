# apps/site Architecture

`apps/site` is the Astro static public website. The repository root
[`docs/repo-map/README.md`](../../../docs/repo-map/README.md) owns cross-app routing;
this file owns only the site boundary.

## Stack and owners

- Astro 7 static output; `src/pages` is the route-registration authority.
- `src/layouts/SiteLayout.astro` owns document chrome and metadata.
- `src/components` owns reusable Astro composition.
- `src/data/product.ts` owns product/download facts; `src/i18n.ts` owns shared
  bilingual labels.
- `src/styles/global.css` adapts root [`DESIGN.md`](../../../DESIGN.md) semantics.
- `public` owns static assets; `.astro` and `dist` are generated.

## Current route families

- Public/product: `/`, `/products`, `/products/clear`, `/pricing`, `/download`.
- Information/support: `/docs`, `/help`, `/about`, `/contact`, `/404`.
- Legal/checkout: `/privacy`, `/terms`, `/refund`, `/checkout/success`.
- Localized pages: supported mirrors below `/zh/*`; source files are proof of the
  exact mirrored set.

Download and checkout links may target `apps/console` API routes. This does not
move billing, license, update metadata, or download API ownership into the site.

## Commands

- `npm run build --workspace @rustzen/site`
- `npm run dev --workspace @rustzen/site`
- `npm run preview --workspace @rustzen/site`

Rendered layout and live deployment remain `Not verified` without direct browser
or deployment evidence.
