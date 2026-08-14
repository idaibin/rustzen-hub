# apps/console UI Contract

Shared visual semantics are owned only by [`DESIGN.md`](../../../DESIGN.md).
This document records console-specific composition and does not restate the shared
palette, type scale, radius scale, or component meanings.

## Current surface

- Next.js App Router owns `/login`, `/dashboard`, `/dashboard/licenses`, and
  `/dashboard/versions`; API routes stay outside UI ownership.
- `AdminShell` owns sidebar, top bar, responsive navigation, content bounds, theme
  control, and command palette.
- `DataTable` owns search, sorting, pagination, export, and empty feedback.
- `DialogSurface` owns modal overlay, labeling, panel geometry, and dismissal;
  license forms and destructive server actions retain business ownership.
- `Badge` exposes `safe`, `caution`, and `danger`; `license-status.ts` owns the
  license/device status mapping used by table consumers.

## Console layout

- Preserve compact table and form density, stable action placement, and one page
  scroll owner.
- Tailwind and local UI components are implementation adapters, not a second
  visual authority. Framework aliases must bind the semantics in root `DESIGN.md`.

## Verification

- Run `npm run lint --workspace @rustzen/console` and
  `npm run build --workspace @rustzen/console`.
- Rendered modal focus, responsive behavior, and theme appearance require direct
  browser evidence and are not proven by this document.
