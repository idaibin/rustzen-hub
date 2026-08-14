# Rustzen Hub

`rustzen-hub` is the Rustzen web surface monorepo.

## Apps

- `apps/site`: Astro website, product pages, download page, docs entry, and about page.
- `apps/console`: Next.js console for dashboard, products, releases, users, settings, billing, and related APIs.

## Packages

- `packages/*`: reserved shared owners; add source only after both apps have
  compatible live consumers. Package README files describe the admission boundary,
  not an implemented shared component contract.

## Contracts

- `contracts/entitlements/v1.json`: authoritative Rustzen Pro product,
  feature, protocol, and runtime-policy registry.
- Rustzen Tools may keep an exact versioned snapshot, but it is not a second
  policy authority.

## Cross-Repository Ownership

- `rustzen-hub` owns the public site, console APIs, billing/release surfaces,
  and the authoritative entitlement contract.
- `rustzen-tools/products/clear` owns the Zen Clear desktop product source,
  product-specific development commands, and runtime implementation.
- `rustzen-tools/shared/desktop-ui` owns Rustzen desktop implementation tokens.
  This repository's shared web visual semantics are owned only by root
  [`DESIGN.md`](./DESIGN.md) and are bound separately by the site and console CSS
  adapters.
- `rustzen-clear` remains the stable product identifier used by contracts and
  APIs; it is not the current source-repository path.

## Commands

```bash
npm install
npm run build
npm run lint
npm run dev:site
npm run dev:console
```

Run app-specific commands with filters:

```bash
npm run build --workspace @rustzen/site
npm run lint --workspace @rustzen/console
npm run build --workspace @rustzen/console
```

## Migration Notes

- `apps/site` was migrated from `rustzen/rzen-portal`.
- `apps/console` was migrated from `rustzen/rzen-platform`.
- The old repositories should be treated as legacy sources after this monorepo is verified and pushed.
- Generated/local-only directories such as `.vercel/`, `.next/`, `.astro/`, `dist/`, `out/`, and `node_modules/` are not source truth.

## License and Commercial Rights

This repository is proprietary. See [LICENSE.md](./LICENSE.md),
[LICENSE-SCOPE.md](./LICENSE-SCOPE.md), [NOTICE.md](./NOTICE.md),
[TRADEMARKS.md](./TRADEMARKS.md), and
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
