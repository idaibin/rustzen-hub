# Console UI Components

The console's reusable UI contract is implemented by repository-owned
components in `src/components/ui`. Business pages and feature components import
those public modules as `@/components/ui/<component>`; importing a third-party
UI primitive directly is not an alternative API.

## Registry Lifecycle

- **Owner**: `src/components/ui` maintainers own this contract and its listed source modules.
- **Consumer**: `scripts/validate-ui-components.mjs`, invoked by `npm run validate:ui-components --workspace @rustzen/console`, is the non-LLM machine consumer.
- **Contract & Version**: `contract_id`: `urn:rustzen-hub:ui-component-registry:v1`, `version`: `ui-component-governance-v1`.
- **Drift Policy**: Update the registry in the same change as component source, semantic roles, public imports, or bare package dependencies. The validator rejects unregistered modules and dependency mismatches.
- **Retirement Rule**: First migrate every consumer across all pages, then remove the registry entry and owned source together. Deprecated components must specify `replacement` and `migration` fields before deletion. Do not retain retired public imports as silent aliases.
- **Props Authority**: Component TypeScript source and types remain the sole authority for complete component Props, slots, events, and DOM semantics. The registry records only machine-verifiable governance metadata.
- **Scope & Limitations**: The validator uses the TypeScript Compiler API for React/TSX files; it does not process Vue Single File Components (SFCs).

## Reuse and Usage Rules

- `components/ui` owns generic controls (`Button`, `Input`, `Select`, `Textarea`, `Label`), feedback (`Alert`, `Badge`), surfaces (`Card`, `Separator`), overlays (`DialogSurface`), and data presentation (`Table`).
- Consuming pages and features must keep product business rules, data fetching, authorization checks, and server action mutations in their own feature/route directory.
- Public imports are granular per-component (`@/components/ui/button`, `@/components/ui/input`, etc.). A shared barrel index file is not required.
- Native HTML attributes (`disabled`, `type`, `autoComplete`, `required`, `htmlFor`, etc.) are passed through transparently without wrapping them in third-party API types.
- Layout-level `className` (e.g. `w-full`, `max-w-md`, `mb-5`) is permitted on consuming pages. Consuming pages must NOT override internal component colors, focus rings, control heights, or border radii via `className`.

## Anti-Patterns and Prohibitions

1. **Direct Third-Party Primitive Imports**: Do not import `antd`, `@mui/*`, `@radix-ui/*`, `@headlessui/*`, `element-plus`, or `tdesign` in business pages or feature code. All UI controls must pass through repository-owned adapters under `src/components/ui`.
2. **Reverse Dependencies**: Components under `src/components/ui` must NOT import from `src/app`, `src/components/admin`, or business feature layers.
3. **Zero-Responsibility Wrappers**: Do not create components that merely rename third-party components without adding token mapping, accessibility, behavioral guarantees, or lifecycle management.
4. **Duplicated Component API Mirrors**: Do not maintain duplicate lists of Props or slot definitions in Markdown or Registry JSON.

## Admission and Escape Hatches

- Add a shared component only when more than one console consumer requires the same visual and interaction semantics.
- Third-party UI libraries may only be imported inside declared adapter roots (`src/components/ui`).
- Temporary escape hatches must be recorded in `escape_hatches` in `components.registry.json` with `owner`, `reason`, `consumer`, `package`, and `review_by` fields.

## Native Implementation Exceptions

- Native inputs remain the owned implementation for `Input`, `Select`, and `Textarea`; their native HTML5 form validation and accessibility behavior is intentional.
- `DialogSurface` uses the native HTML `<dialog>` element and custom backdrop/lock management for dismissal, keyboard handling, and focus retention.

## ui-governance-v2 acceptance

- `UI-GOV-01`: Lint rejects unknown CSS variables, direct business consumption of foundation aliases, and page-level hard-coded color values. `globals.css` and `src/components/ui` are the declared visual adapter roots.
- `UI-GOV-02`: Every Semantic Token value is a resolvable Primitive or Semantic reference. Generated CSS drift is checked by the same callable used by the negative test.
- `UI-GOV-03`: `Alert` variants own feedback color semantics. Consumers may add layout classes but must not restyle alert colors, borders, radii, or control geometry.
- `UI-GOV-04`: Browser verification fails closed on CDP/runtime/assertion errors and covers real keyboard Tab order, native empty-submit validation, the rendered login error Alert, Light/Dark themes, and the frozen desktop/mobile viewports.
