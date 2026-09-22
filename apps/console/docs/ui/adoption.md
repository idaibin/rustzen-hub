# apps/console UI Components Adoption

This record declares project-specific adoption of the Forgeway UI Components and Design Tokens Standard for `@rustzen/console`.

## Basis and owners

- Repository/component basis: `b93de754a60bc4f9d737305c58f16e6d2fa9a871` (task basis: `rustzen-hub-console-ui-pilot-v1`)
- UI implementation owner: `apps/console/src/components/ui`
- Shared visual authority: [`DESIGN.md`](../../../../DESIGN.md)
- Feature UI contract locations: `apps/console/docs/design-system.md`, `apps/console/docs/ui/components.md`

## Project-owned UI boundary

- UI owner root: `src/components/ui`
- Stable public imports: `@/components/ui/<component>` (e.g., `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/card`, `@/components/ui/badge`, `@/components/ui/alert`, `@/components/ui/dialog`, `@/components/ui/label`, `@/components/ui/select`, `@/components/ui/separator`, `@/components/ui/table`, `@/components/ui/textarea`)
- Controlled component admission rule: Add or modify shared components only when more than one console surface requires identical visual/interaction semantics. Must be registered in `components.registry.json` and maintained under `src/components/ui`.
- Raw native element exceptions: Native inputs for `Input`, `Select`, `Textarea`; native HTML `<dialog>` element for `DialogSurface`.
- Component retirement rule: Migrate all consuming pages/components first, then remove registry entry and component source together in the same change. No silent deprecated aliases.

## Third-party dependency policy

- Restricted UI packages or import patterns: `antd`, `antd/*`, `@mui/*`, `@radix-ui/*`, `@headlessui/*`, `element-plus`, `element-plus/*`, `tdesign`, `tdesign/*`, `tdesign-react`, `tdesign-react/*`, `tdesign-react-next`, `tdesign-react-next/*`, `@tdesign/*`
- Allowed adapter roots: `src/components/ui`
- Separately governed dependency categories: Icons (`lucide-react`) are permitted inside UI components; charting/rich-text/editors are governed per-feature.
- Deep-import policy: Forbidden for restricted third-party UI libraries across the codebase.

## Controlled escape hatches

`none` (no exceptions active in this pilot).

## Components documentation and Registry

- Human component contract path: `apps/console/docs/ui/components.md`
- Structured Registry: `applicable`
- Registry source path and format: `apps/console/docs/ui/components.registry.json` (JSON)
- Named owner and producer: `apps/console` UI maintainers (`src/components/ui`)
- Non-LLM consumer: `scripts/validate-ui-components.mjs`
- Semantic version: `ui-component-governance-v1`
- Executable validator: `npm run validate:ui-components --workspace @rustzen/console`
- Drift policy: Update registry in the same commit as source changes. Validator rejects unregistered components and package mismatches.
- Retirement rule: Deprecated entries must declare `replacement` and `migration` notes before final removal.
- Source and public-import coverage rule: All `.tsx` components directly in `src/components/ui` must be registered with exact 1-to-1 matching `public_import`.

## Design Token pipeline

- Status: `applicable`
- Logical layers: `Primitive -> Semantic`
- Token source: `design-system/tokens/primitive.tokens.json` and `design-system/tokens/semantic.tokens.json` (lightweight JSON format)
- Builder and generated outputs: `scripts/build-design-tokens.mjs` -> `src/styles/generated/tokens.css`
- Third-party theme adapters: Not needed (Tailwind inline theme maps to CSS variables).
- Token usage gate: `npm run tokens:check-usage --workspace @rustzen/console`; business source is restricted to known role-based Semantic tokens, while foundation aliases are limited to `globals.css` and `src/components/ui`.
- Generated drift check: `npm run tokens:check-generated --workspace @rustzen/console` (in-memory generation vs disk comparison).
- Cross-project package decision: `not-applicable` for this pilot (tokens and builders remain local to `apps/console`).

## Validation commands and evidence

- UI component registry validation: `npm run validate:ui-components --workspace @rustzen/console`
- Restricted-import validation: enforced via `scripts/validate-ui-components.mjs` and `eslint.config.mjs`
- Token validation: `npm run tokens:validate --workspace @rustzen/console`
- Token build: `npm run tokens:build --workspace @rustzen/console`
- Token drift check: `npm run tokens:check-generated --workspace @rustzen/console`
- Token usage check: `npm run tokens:check-usage --workspace @rustzen/console`
- Lint: `npm run lint --workspace @rustzen/console`
- Test: `npm run test:console --workspace @rustzen/console`
- Build: `npm run build --workspace @rustzen/console`
- Browser runtime evidence: `node scripts/browser-verify.mjs .codex/artifacts/ui-component-pilot-v2/pass-1` and `pass-2`; each run must fail closed and cover the `UI-GOV-04` matrix.
- Current browser result: `Partial`. The task-owned `pass-1` evidence verifies real keyboard focus progression, native empty-submit validation, and the rendered login error Alert at the desktop Light-theme viewport. Dark-theme capture and the remaining desktop/mobile matrix are `Not verified`: the task-owned Next dev runtime entered a Turbopack fatal state (`Failed to write app endpoint /login/page`, `Next.js package not found`) and the fail-closed CDP runner stopped on `Page.captureScreenshot` timeout. No Pass 2 was attempted after the repeated acceptance failure.
- Browser evidence path: `.codex/artifacts/ui-component-pilot-v2/pass-1`; `failure.json` is the current machine-readable stop record. A later rerun must use a healthy task-owned runtime and generate fresh evidence rather than reuse the partial screenshots.
- Current `Not verified` boundaries: Live database runtime, production secrets, Vercel production deployment.

## Adoption verdict

- Status: `Partial`. The `ui-governance-v2` source, static contract, test, lint, and production-build gates pass; the complete browser runtime matrix remains `Not verified` for the reasons recorded above.
- Owner decision reference: Daibin, `rustzen-hub-console-ui-pilot-v1`
- Open conflicts and stale records: Prior `ui-component-pilot-v1` Pass 1 contains a runtime exception and is superseded for final acceptance.
