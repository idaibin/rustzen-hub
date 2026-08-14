# apps/site Content Governance

## Purpose

`apps/site` publishes the Rustzen brand and Zen Clear product content for the product site at `rustzen.dev`.

The site currently represents:

- Zen Clear: beta macOS cleanup client.

## Naming

- Use `Rustzen` for the public brand, website copy, page titles, navigation labels, image alt text, and product ecosystem references.
- Use `idaibin/rustzen-hub apps/site` for the GitHub repository identifier and `@rustzen/rustzen-hub apps/site` for the package identifier; use lowercase `rustzen-*` only for product names, route/file identifiers, command names, historical prose, and literal URLs.
- Historical snapshots may retain `Rustzen` when documenting the original naming in old prose. Prefer adding context over rewriting historical wording.
- The product is `Zen Clear`.

## Content Sources

| Source | Role | Fact boundary |
| --- | --- | --- |
| `src/data/product.ts` | Product status, description, highlights, proof, download, and purchase copy. | tracked source |
| `src/pages/index.astro` | Home page composition and high-level product messaging. | tracked source |
| `src/pages/checkout/success.astro` | Checkout completion copy after Creem redirects customers back to the site. | tracked source |
| `src/layouts/SiteLayout.astro` | Footer, favicon, and baseline metadata. | tracked source |
| `contracts/entitlements/v1.json` | Approved free/Pro feature IDs and runtime entitlement policy. | authoritative versioned contract in `rustzen-hub` |
| `rustzen-tools/products/clear` | Desktop behavior, current product implementation, and product-specific development commands. | external source owner; verify before publishing implementation claims |
| `public/*` | Public images, icons, and fonts. | tracked or untracked until added |
| `docs/current-site-content.md` | Snapshot from the previous multi-product local site before the Astro rebuild. | documentation snapshot |

## Product Copy Rules

- Keep product claims tied to current product state.
- Keep `rustzen-clear` as the stable contract/API product identifier. Do not
  treat that identifier as the current source-repository path; desktop source
  ownership is `rustzen-tools/products/clear`.
- Do not describe platform services as local runtime dependencies for Zen Clear.
- Do not publish release/update/signing claims that have not been verified in the relevant product repository.
- Keep route slugs stable unless redirects and navigation are reviewed.
- Keep the public download button pointed at the Platform latest download resolver,
  not a hard-coded release package URL.
- Zen Clear Pro pricing is `$10/year` and subscription-only. Keep purchase copy,
  checkout success copy, and Rustzen Platform checkout assumptions aligned.
- Current public feature boundary: scanning, cleanup preview, macOS permission
  setup, automatic update checks, and manual update checks do not require a
  license. Pro unlocks cleanup, Restore Center, advanced scan rules,
  exclusions, custom rules, scheduled scans, and up to three
  activated devices.
- Public cleanup wording must say default cleanup moves recoverable items into
  Zen Clear Restore Center. Do not describe the default action as direct
  deletion or macOS Trash. Permanent deletion is explicit from Restore Center
  or an explicit permanent-delete mode.
- Restore Center copy must mention that retained items remain until restored or
  manually permanently deleted, and that Restore Center storage is surfaced in
  disk analysis so it does not become invisible growth.

## SEO And Metadata

Current baseline metadata is set in `SiteLayout.astro` using page-level `title` and `description` props. The home page provides an explicit description through `src/data/product.ts`.

Before adding SEO features such as Open Graph images, canonical URLs, redirects, or sitemap generation, record the source file, generated output expectation, and verification command.

## Media Rules

- `public/` is for assets referenced by URL paths such as `/products/zen-clear-product.png`.
- Zen Clear product media is based on a real Tauri GUI window screenshot stored
  at `public/products/zen-clear-gui-screenshot.png`, then composed into
  `public/products/zen-clear-product.png` for site and Creem product-page use.
  Use `public/products/zen-clear-creem-cover.png` for the Creem checkout media;
  it should stay visually aligned with `zen-clear-product.png` and must not
  introduce a separate dark/light product screenshot.
  Keep it aligned with the current Zen Clear app rather than older
  `Disk Cleaner Pro` concept screens.
- Real GUI media should come from `rustzen-tools/products/clear`, using that
  product's documented development command; use CGWindowID window screenshots
  rather than a browser preview or `/Applications/ZenClear.app`.
- Screenshots used as docs evidence belong under `docs/screenshots/`.
- New product media should be reviewed for route usage, alt text, file size, and whether it is tracked or still untracked.

## Dirty-Tree Protection

Use `git status --short --branch` before edits. Preserve unrelated local changes, and keep governance-only changes separate from content/UI changes when possible.
