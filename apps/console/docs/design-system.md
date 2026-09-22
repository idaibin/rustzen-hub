# apps/console UI & Design System Contract

Shared visual semantics are owned solely by [`DESIGN.md`](../../../DESIGN.md).
This document records console-specific adoption, token pipeline boundaries, and surface governance.

## Authority and Boundaries

1. **Shared Visual Semantics**: Root [`DESIGN.md`](../../../DESIGN.md) is the sole authority for shared color scales, safety roles (`safe`, `caution`, `danger`), depth tiers, and typography principles.
2. **Machine Token Authority**: `design-system/tokens/**` owns console-adopted serializable token values (primitive and semantic layers). It does not redefine root visual semantics.
3. **Generated Artifacts**: `src/styles/generated/tokens.css` is deterministically generated from token JSON and is strictly immutable to manual edits.
4. **Pilot Surface**: The `/login` route is the primary vertical slice pilot surface for component governance and token consumption.
5. **Package Scope**: This pilot does not extract or publish a cross-project token package; all token files and builders remain local to `apps/console`.
6. **Specification Scope**: The token format adopts a lightweight JSON subset (`value`, `$type`, references `{primitive...}`) and does not claim full compliance with any specific DTCG standard version.
7. **Out-of-Scope Domains**: Product rules, API routes, authentication/session management, database schemas/migrations, and production Vercel infrastructure stay outside UI governance.
8. **Verification & Boundaries**: Build, lint, and token validation prove static contracts. Rendered layout, focus states, keyboard interactions, and responsive appearance require browser verification evidence. Production deploy, live database, and production secrets remain `Not verified`.

## Current UI Surface

- Next.js App Router owns `/login`, `/dashboard`, `/dashboard/licenses`, and `/dashboard/versions`; API routes remain outside UI ownership.
- `AdminShell` owns sidebar, top bar, responsive navigation, content bounds, theme control, and command palette.
- `DataTable` owns search, sorting, pagination, export, and empty feedback.
- `DialogSurface` owns modal overlay, labeling, panel geometry, and dismissal; license forms and destructive server actions retain business ownership.
- `Badge` exposes `safe`, `caution`, and `danger`; `license-status.ts` owns the license/device status mapping used by table consumers.

## Component Reuse and Adapter Rules

- Business pages and feature code must consume reusable UI through `@/components/ui/<component>` public imports.
- Third-party UI primitives are restricted outside declared adapter roots.
- Local UI components consume generated Semantic Tokens rather than ad-hoc palette values.
- Raw native HTML elements are permitted for standard inputs (`Input`, `Select`, `Textarea`) and native dialog mechanics (`DialogSurface`).

## Verification Commands

- Token validation: `npm run tokens:validate --workspace @rustzen/console`
- Token build: `npm run tokens:build --workspace @rustzen/console`
- Generated drift check: `npm run tokens:check-generated --workspace @rustzen/console`
- UI registry check: `npm run validate:ui-components --workspace @rustzen/console`
- Lint: `npm run lint --workspace @rustzen/console`
- Test: `npm run test:console --workspace @rustzen/console`
- Build: `npm run build --workspace @rustzen/console`
- Browser verification: `node scripts/browser-verify.mjs <artifact-dir>`
