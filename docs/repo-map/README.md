# Rustzen Hub Repository Map

This is the authoritative navigation and reuse map for `rustzen-hub`. Live source,
package manifests, the nearest `AGENTS.md`, and current command output remain proof.

## Repository boundary

- Map root and Git root: repository root.
- Scope class: npm web monorepo with a static public site and a Next.js console/API.
- Persistence: versioned.
- Shared product/protocol authority: `contracts/*`.
- Shared visual-semantic authority: root [`DESIGN.md`](../../DESIGN.md).

## Applications

| Application | Owner | Runtime/build boundary | Scoped map |
| --- | --- | --- | --- |
| Public site | `apps/site` | Astro static pages and assets | `apps/site/docs/architecture.md` |
| Console/API | `apps/console` | Next.js pages, server actions, API routes, Prisma | `apps/console/docs/project-map.md` |

Do not move public content into the console or API/database ownership into the
site. Add `packages/*` source only after both apps have compatible live consumers.

## Shortest task routes

| Task | Read in order |
| --- | --- |
| Public page | root/nearest `AGENTS.md` → `DESIGN.md` → `apps/site/docs/architecture.md` → route → layout/component/data owner |
| Console page | root/nearest `AGENTS.md` → `DESIGN.md` → `apps/console/docs/project-map.md` → route → admin component → UI primitive |
| Shared visual change | `DESIGN.md` anchor → both CSS adapters → live component and representative consumer in each affected app |
| License/update API | console route → owning `src/lib` service → Prisma/contract owner → representative caller/test |
| Entitlement policy | `contracts/*` authority → console producer/consumer → immutable downstream snapshot verification |

## Frontend reuse index

| Product/design term | Semantic job | Canonical owner | Access and consumers | Reuse boundary | DESIGN binding |
| --- | --- | --- | --- | --- | --- |
| Site actions | Public CTA/link variants | `apps/site/src/components/Button.astro` | imported by public pages | Astro/site only | `DESIGN.md#components` |
| Safety chip | Safe/caution/danger explanation | `apps/site/src/components/SafetyChip.astro` | product and pricing surfaces | Astro/site only | `DESIGN.md#colors`, `#components` |
| Console badge/status | Compact semantic status | `apps/console/src/components/ui/badge.tsx`, `apps/console/src/components/admin/license-status.ts` | license/device tables | Console only; one status mapping | `DESIGN.md#colors`, `#components` |
| Console dialog | Labeled modal overlay and panel | `apps/console/src/components/ui/dialog.tsx` (`DialogSurface`) | create/edit/confirm workflows | Console UI primitive; business actions stay local | `DESIGN.md#elevation--depth`, `#components` |
| Console data table | Search/sort/page/export | `apps/console/src/components/admin/data-table.tsx` | license/device tables | Console workflow composition | `DESIGN.md#layout` |

Before a new declaration, search the owning app and the relevant row's provider
root. Decide reuse, extend, wrap, justified new, or `Not verified`; a map miss is
not proof that an implementation is absent.

## Naming and validation

- Astro URL route files are lowercase; Astro reusable components are PascalCase.
- React/Next reusable component files are kebab-case; exported components/types are
  PascalCase; hooks use `use-*.ts`/`useX`.
- Shared status terms are `safe`, `caution`, and `danger`.
- Root commands: `npm run build`, `npm run lint`, or the matching workspace command.
- Browser layout, focus, deployed environment, database state, and production APIs
  remain `Not verified` without direct evidence.
