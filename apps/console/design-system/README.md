# apps/console Design System Tokens

This directory contains the machine-readable design token sources for `@rustzen/console`.

## Authority and Pipeline

- **Visual Authority**: [`DESIGN.md`](../../../DESIGN.md) at the repository root owns all shared visual semantics.
- **Token Sources**:
  - `tokens/primitive.tokens.json`: Raw hex colors, sizes, radius steps, and motion curves.
  - `tokens/semantic.tokens.json`: Semantic role bindings (`light` and `dark` modes) referencing primitive values.
- **Generated Output**:
  - `src/styles/generated/tokens.css`: Deterministically generated CSS custom properties. **Do not edit manually.**
- **Generator Scripts**:
  - `scripts/build-design-tokens.mjs`: Validates token graph (duplicates, unknown refs, circular refs) and generates `tokens.css`.
  - `scripts/design-tokens.test.mjs`: Unit tests for token resolution, circular reference detection, and drift detection.
  - `scripts/build-design-tokens.mjs --check-usage`: Enforces Semantic-only business consumption, known CSS variables, and the declared adapter boundary.

## Commands

```bash
# Validate token sources without writing to disk
npm run tokens:validate --workspace @rustzen/console

# Build generated tokens.css from token sources
npm run tokens:build --workspace @rustzen/console

# Check for drift between token sources and generated CSS (CI gate)
npm run tokens:check-generated --workspace @rustzen/console

# Check token-layer usage in authored source (CI gate)
npm run tokens:check-usage --workspace @rustzen/console
```
