# apps/site UI Contract

Shared visual semantics are owned only by [`DESIGN.md`](../../../DESIGN.md).
This document records site-specific composition and does not repeat shared token
values or component semantics.

## Current surfaces

- Public routes are generated from `src/pages`; English is the default and Chinese
  mirrors supported pages below `src/pages/zh`.
- `SiteLayout.astro` owns document metadata, global navigation, footer, theme, and
  page chrome.
- `src/data/product.ts` owns product and download copy; `src/i18n.ts` owns shared
  bilingual navigation and page labels.
- `Button.astro` and `SafetyChip.astro` are the current reusable site primitives.
  Pages use the shared `.glass`, `.glass-2`, and `.glass-3` style tiers directly;
  there is no separate `GlassCard` component contract.

## Site layout

- Marketing and documentation pages prioritize responsive reading flow.
- The header is sticky glass chrome. Policies remain keyboard-operable from the
  main navigation and legal links remain available in the footer.
- English and Chinese routes stay structurally mirrored when a localized surface
  is supported. A missing sibling route is a product/content decision, not an
  invitation to invent copy.

## Verification

- Build with `npm run build --workspace @rustzen/site`.
- Browser-rendered layout, focus traversal, and breakpoints require direct browser
  evidence and are not proven by this document.
