# Rustzen portfolio and naming review v2

## Review contract

Codex is the executor. ChatGPT Pro is the independent reviewer. Review only the supplied proposal and verified repository facts. Do not assume that any rename, repository creation, code migration, archive, license change, deployment, commit, push, or public announcement is authorized.

Return findings by severity, incorrect assumptions, required decisions, verification gates, a revised recommendation, and a verdict: `pass`, `needs changes`, or `blocked`.

## User-approved naming direction

```text
rustzen-hub       # Website, license backend, downloads, product/release console
rustzen-admin     # Public Web/Rust engineering template
rustzen-core      # Public product-neutral Rust foundations with proven consumers
rustzen-tools     # Proposed private monorepo for Clear + Clipboard + Zipper
rustzen-desktop   # Proposed public Client/Tauri template and trial/prototype surface
```

External product naming:

```text
Rustzen Suite
├── Rustzen Clear
├── Rustzen Clipboard
└── Rustzen Zipper

Commercial entitlement: Rustzen Pro
```

## Intended boundaries

### `rustzen-tools`

- Private source monorepo.
- Contains three independently usable products: Clear, Clipboard, Zipper.
- One repository and shared workspace/tooling, but not one executable or one failure domain.
- Products keep independent bundle/binary identifiers, versions, signing/notarization inputs, updater channels, release artifacts, rollback artifacts, and product-specific cores.
- A change to one product must not require releasing the other two.
- Shared crates/packages require at least two real consumers and product-neutral behavior.
- Zipper remains compatible with its current Rust CLI/npm distribution. Moving it into the monorepo does not require converting it to Tauri.
- `Rustzen Pro` is a versioned entitlement contract; it does not imply a shared installer, updater, release cadence, or continuous network dependency.

Candidate layout, subject to review:

```text
rustzen-tools/
├── apps/
│   ├── clear/
│   ├── clipboard/
│   └── zipper/
├── crates/
│   ├── entitlement/       # only after two proven consumers
│   ├── release-contracts/ # schemas/types, not release authority
│   └── product-specific modules where ownership remains explicit
├── tooling/
├── Cargo.toml
└── package.json
```

The exact physical layout is not approved until source-SHA inventories and a disposable proof of concept demonstrate independent build/release behavior.

### `rustzen-desktop`

- Public Client/Tauri template and experimental trial repository.
- Not a commercial product and not part of the `Rustzen Suite` entitlement.
- Must contain no private `rustzen-tools` code, product behavior, commercial licensing enforcement, signing secrets, updater credentials, or internal product references.
- Demonstrates a minimal Client/Tauri reference structure, local-first defaults, commands, permission/capability guidance, validation, and release-readiness checklist.
- It may show extension interfaces and mock/example capabilities, but must not become a second implementation of Clear, Clipboard, Zipper, or Launcher.
- Publication claims must distinguish template/prototype readiness from production/release readiness.

## Verified current repository truth (2026-07-13)

- The parent workspace is not a Git repository; every child repository is independent.
- No `rustzen-tools` or `rustzen-desktop` child repository currently exists.
- `rustzen-hub` already owns `apps/site` and `apps/console`; the console was migrated from the old `rzen-platform`.
- `rustzen-admin` is the public Web/Rust reference template.
- `rustzen-core` is the public shared Rust library repository and accepts only proven product-neutral capabilities with at least two consumers.
- `rustzen-clear` is a Client/Tauri cleanup product and currently has unrelated uncommitted documentation changes on a branch whose upstream is gone.
- `rustzen-clipboard` is a clean Client/Tauri product on `main`.
- `rustzen-zipper` is a clean Rust CLI/npm product on `main`, not an equivalent Tauri app.
- `rustzen-launcher` exists as a clean Client/Tauri prototype. Its nearest guidance explicitly says it is not a release baseline, not reusable template, and not yet publishable.
- Launcher uses prototype identity `rustzen-launcher`, root `src-tauri`, mock UI data, no updater, no release workflow, `bundle.active = false`, and requires a prototype graduation review before publication.
- Workspace standards classify Clear, Clipboard, and Launcher as Client/Tauri; Zipper is Rust library/CLI. Structural changes must update manifests, commands, tests, CI/deploy paths, architecture/project maps, indexes, stale references, and rollback/migration decisions together.

## Required unresolved decisions

1. Should future `rustzen-desktop` be:
   - a new clean repository created from an approved template baseline; or
   - the graduated and renamed `rustzen-launcher` repository?
2. If Launcher is renamed, what happens to its launcher/search product idea, Git history, package name, bundle identifier, data paths, docs, and prototype references?
3. Is `rustzen-desktop` intended as a reusable starter template, a demonstration application, or both? What prevents demo behavior from becoming a de facto product?
4. Which code can be shared between public `rustzen-desktop`, public `rustzen-core`, and private `rustzen-tools` without leaking commercial/product-specific behavior?
5. Does `rustzen-tools` preserve Git history, tags, issues, releases, package URLs, npm compatibility, updater feeds, and artifact names for all three source repositories?
6. What measurable solo-maintainer cost will the monorepo remove, and which new release/CI coupling will it introduce?

## Round structure

### Round 1 — Naming and portfolio-boundary review

Review whether `rustzen-tools`, `Rustzen Suite`, `Rustzen Pro`, and `rustzen-desktop` form a coherent, non-conflicting taxonomy. Check ambiguity between repository, template, product family, entitlement, and existing Launcher. Require a decision matrix and reject misleading public positioning.

### Round 2 — Monorepo and template architecture stress test

Assume corrected Round 1 naming. Stress-test migration into private `rustzen-tools`, independent build/release/signing/updater behavior, Zipper CLI/npm preservation, public/private dependency direction, `rustzen-core` intake, entitlement outage/failure behavior, history and rollback, and the two possible origins for `rustzen-desktop`. Require reversible gates and explicit anti-goals.

### Round 3 — Final RFC acceptance

Review a revised execution plan for completeness and independent executability. Require source/destination ownership, exact preconditions, do-not-touch boundaries, dependencies, validation registry, migration/parity tests, done/reject criteria, rollback, and separate authorization for creation/cutover/archive.

## Reviewer warnings

- Repository consolidation may reduce routine maintenance, but repository count is not itself a success metric.
- A monorepo may contain heterogeneous apps and independent releases.
- A shared entitlement does not require one installer, updater, or release train.
- Public template code must not depend on private product source.
- `rustzen-launcher` cannot be called or renamed into a template without resolving its explicit graduation blockers.
- `rustzen-desktop` and `rustzen-tools` are proposed names only; neither exists today.
