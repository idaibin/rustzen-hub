# apps/console Project Map

The repository root [`docs/repo-map/README.md`](../../../docs/repo-map/README.md)
owns cross-app navigation. This scoped map routes console work without persisting
branch, dirty-tree, local database, or deployment snapshots.

## Stack and owners

- Next.js App Router, React, TypeScript, Tailwind CSS v4, and local source-owned UI
  primitives.
- `src/app` owns dashboard pages and API route registration.
- `src/components/admin` owns console workflows and high-density composition.
- `src/components/ui` owns business-neutral primitives.
- `src/app/globals.css` adapts root [`DESIGN.md`](../../../DESIGN.md) semantics.
- `prisma/schema.prisma` owns persisted product, license, device, release, and
  billing data shape.

## Shortest task routes

| Task | Read in order |
| --- | --- |
| Dashboard UI | nearest `AGENTS.md` → `DESIGN.md` → target `src/app/dashboard` page → `src/components/admin` owner → `src/components/ui` primitive |
| License/device workflow | dashboard licenses page → server action → `licenses-table.tsx` / `devices-table.tsx` → `license-status.ts` → dialog/table primitives |
| Release UI/API | versions page → `tauri-release-upload.tsx` → upload/updater-only asset-resolve/publish API routes → `src/lib/{tauri-release,blob-release,minisign}.ts` |
| API contract | route registration → owning `src/lib` service/schema → representative caller/test |
| Database work | `.env.example` → `prisma/schema.prisma` → owning route/service → explicit local database gate |

## Reuse index

| Semantic job | Canonical owner | Representative consumers | Boundary |
| --- | --- | --- | --- |
| Console shell | `src/components/admin/admin-shell.tsx` (`AdminShell`) | dashboard layouts/pages | Reuse navigation, theme, content bounds, and command palette |
| Data table | `src/components/admin/data-table.tsx` (`DataTable`) | licenses and devices | Reuse search/sort/pagination/export; columns remain feature-local |
| Status badge | `src/components/ui/badge.tsx` + `src/components/admin/license-status.ts` | licenses and devices | Reuse root `DESIGN.md` safe/caution/danger semantics and one status mapping |
| Modal surface | `src/components/ui/dialog.tsx` (`DialogSurface`) | license create/edit and confirmation | Reuse overlay, labeling, close affordance, geometry, and dismissal |
| Feedback | `src/components/admin/toaster.tsx` | copy and server-action flows | Reuse current toast state owner |

## Commands and boundaries

- `npm run lint --workspace @rustzen/console`
- `npm run build --workspace @rustzen/console`
- `npm run test:console --workspace @rustzen/console`

Database mutation, deploys, environment changes, and webhooks require separate
authorization. `.env*`, `.next`, `.vercel`, and `node_modules` are local/generated,
not repository truth.
