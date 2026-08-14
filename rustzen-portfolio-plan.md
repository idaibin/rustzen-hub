# Rustzen Portfolio Simplification Plan

Status: Draft for Round 3 review
Date: 2026-07-13
Owner: repository owner
Execution model: sequential, review-first, cross-repository changes isolated by clean worktrees

## 1. Decision

Do not reduce the current portfolio to three physical Git repositories now.

Adopt three portfolio families while preserving current repository, deployment, process, database, release, and rollback boundaries:

1. Personal assets: `aicraft`, `feeds-hub`, `blog`.
2. Rustzen engineering and local-management family: `rustzen-hub`, `rustzen-admin`, `rustzen-core`, plus internal `rustzen-analytics`, `rustzen-inspect`, and `rustzen-report`.
3. Rustzen desktop suite: `rustzen-clear`, `rustzen-clipboard`, and `rustzen-zipper`, with one possible commercial entitlement but independent products and release channels.

`rustzen-platform` and `rustzen-desktop` are deferred names, not approved repositories or runtimes.

## 2. Repository decision matrix

| Repository | Decision now | Exit or reconsideration condition |
| --- | --- | --- |
| `aicraft` | Retain | Outside this consolidation scope |
| `feeds-hub` | Retain | Outside this consolidation scope |
| `blog` | Retain | Outside this consolidation scope |
| `rustzen-hub` | Retain site + console monorepo | Reconsider only after `apps/console` ownership is documented |
| `rustzen-admin` | Confirm as public Web/Rust template | Must remain independently usable and free of private-only dependencies |
| `rustzen-core` | Retain and shrink carefully | Archive only after public/API consumer audit, migrations, deprecation, and parity |
| `rustzen-analytics` | Retain internal independent system | Merge/archive only after a named replacement and data/runtime parity |
| `rustzen-inspect` | Retain internal multi-process system | Its server/agent and deployment contracts remain protected |
| `rustzen-report` | Defer retirement decision | Requires production-use audit, replacement, data migration, `/opt/rustzen-report` transition, and rollback |
| `rustzen-clear` | Retain independent Tauri product | Future monorepo only after shared-foundation and release-parity gates |
| `rustzen-clipboard` | Retain independent Tauri product | Same gate as Clear |
| `rustzen-zipper` | Retain CLI/npm product | Must preserve CLI/npm/binary contract; Tauri conversion is a separate product decision |

## 3. Architecture boundaries

- Branding does not determine Git layout.
- One entitlement does not determine installer, updater, version, or release cadence.
- A shared crate does not determine runtime or database ownership.
- Internal repositories must not appear in public Rustzen organization-facing content.
- Each product owns its schema, migrations, database files, backup, restore, retention, and corruption recovery.
- Cross-product direct database access is prohibited by default.
- Prefer libraries, specifications, and build-time reuse over shared long-running services.
- Existing protected binary names, paths, services, environment variables, ports, and packaging contracts are immutable until a repository-specific migration explicitly replaces them.

## 4. Source and worktree preconditions

Before any phase that writes code or moves files:

1. Run in every target child repository:

   ```bash
   git status --short --branch
   git rev-parse HEAD
   git remote -v
   git branch -vv
   git tag --points-at HEAD
   ```

2. Classify every dirty path as `task-owned`, `related-existing`, `unrelated-existing`, or `unknown`.
3. Record one immutable source SHA per repository.
4. After classifying divergence and unmerged commits, approve one source SHA and create the clean task worktree and task branch from that exact SHA. Record why ahead/diverged commits are included or excluded.
5. Never copy from the current dirty worktrees in `rustzen-hub`, `rustzen-admin`, `rustzen-core`, or `rustzen-clear`.
6. Use one authoritative source for a capability at every point. Bidirectional synchronization is forbidden.
7. Reject execution if the approved source SHA and checked-out SHA differ. Never modify `main` or commit from an unowned detached HEAD.

Reject the phase if any source is identified only by a mutable branch name or if unrelated dirty work would be included.

## 5. Phased execution plan

### Phase 0 — Freeze the decision surface

Impact: `structure-impact`, documentation only.
Dependencies: none.

Objective: record the portfolio families, decisions, public/internal visibility, and explicit deferrals without changing repositories or runtime behavior.

Owned scope:

- Workspace governance records and project map.
- A sanitized public description that does not name internal repositories.

Do not touch:

- Product code, manifests, deployment files, databases, release workflows, repository visibility, licensing implementation.

Validation:

- Search public surfaces for prohibited internal names.
- Confirm project map and engineering standards agree.
- Independent documentation review.

Done when:

- The repository decision matrix has an owner and approval.
- `rustzen-platform` and `rustzen-desktop` are explicitly marked deferred.

Reject when:

- The document implies that portfolio families are new repositories, runtimes, or releases.

### Phase 1 — Establish reproducible baselines and maintenance measurements

Impact: read-only inventory.
Dependencies: Phase 0.

Objective: replace “too many repositories” with measurable recurring work.

Required evidence per repository:

- immutable source SHA and branch state;
- project class and nearest `AGENTS.md`;
- build/test/lint/release command sources;
- median and p95 CI duration where available;
- release frequency;
- dependency-update frequency and effort;
- cross-repository atomic changes;
- duplicated workflows/scripts/configuration;
- shared code with at least two real consumers;
- rollback frequency and recovery procedure;
- unknown items marked `Not verified`.

Phase 1 must also create an approved validation registry per repository and source SHA containing:

- exact working directory;
- exact command and arguments;
- source file that defines the command;
- prerequisites;
- whether the command mutates files or external state;
- expected result or artifact;
- applicable contract category.

Missing commands remain `Not verified`; Phase 6 cannot start for that repository until its registry is approved.

Validation:

- A reviewer can reproduce every inventory claim from a path, manifest, workflow, command, or Git SHA.
- No secret values or private identifiers enter public artifacts.

Done when:

- Every future consolidation candidate has a benefit ledger: work eliminated, work centralized, new coupling, CI/release impact.

Reject when:

- Reduced repository count is the primary benefit.

### Phase 2 — Inventory contracts before standardization

Impact: `contract-impact`, read-only first.
Dependencies: Phase 1.

Objective: make current behavior testable before changing shared infrastructure.

Create repository-local inventories for:

- executable names and arguments;
- service/unit names;
- install, config, data, log, upload, and artifact paths;
- ports, protocols, health checks, environment variables;
- process topology, startup/restart behavior, upgrade order, supported version skew;
- package, bundle, updater, signing, notarization, channel, and artifact identities;
- rollback artifact and command;
- schema owner, readers/writers, SQLite journal mode, retention, vacuum, backup, restore, downgrade, corruption recovery.

Special gates:

- `rustzen-inspect`: verify server/agent skew and separate rollback.
- `rustzen-report`: verify `/opt/rustzen-report` and service/install dependencies.
- `rustzen-analytics`: separate ingest availability from aggregation/report recovery.
- `rustzen-hub`: map `apps/site` versus `apps/console`, auth/config/deploy ownership, and service dependencies.
- Desktop: map independent bundle/binary IDs, signing inputs, updater feeds, channels, and rollback artifacts.
- Zipper: preserve CLI flags, npm install wrapper, binary naming, tests, and release assets.

Done when:

- Every protected contract is either verified or explicitly `Not verified` with an owner and verification action.

Reject when:

- A proposed standard changes a protected value incidentally.

### Phase 3 — Low-risk standardization pilots

Impact: `structure-impact` only inside selected governance/tooling scopes.
Dependencies: Phase 2.

Objective: reduce repeated maintenance without source or runtime consolidation.

Pilot in two representative repositories before wider adoption:

- common document and validation-record templates;
- consistent local command names whose implementations remain repository-owned;
- formatting/lint baselines with explicit local exceptions;
- versioned, immutable, opt-in CI validation workflow without write/release authority;
- dependency, secret, license, and prohibited-reference scanning;
- common release metadata schema, not common release execution;
- SQLite ownership/backup/restore checklist and test convention;
- common `contract-impact` and `structure-impact` labels.

Rules:

- Pin shared CI/tooling to an immutable tag or commit SHA.
- Consumers can remain on a known-good version and independently revert.
- Validation and mutation/release workflows stay separate.
- Public repositories cannot depend on inaccessible private automation.

Validation:

- Pilot repositories pass their existing local checks before and after adoption.
- Reverting the shared tooling version restores prior behavior.
- CI duration and maintenance effort do not materially regress.

Before results are generated, approve candidate-specific thresholds for maximum median/p95 CI regression, minimum recurring maintenance reduction, maximum additional release steps, maximum unrelated build/test scope, maximum rollback-time regression, and zero coordinated release requirement for unrelated products.

Done when:

- Two pilots pass and show measured maintenance reduction.

The two pilots qualify the shared standard only; they do not authorize blanket rollout. Every additional consumer must independently pass version pinning, local validation, permission review, public/private dependency review, CI comparison, and rollback to its prior local implementation.

Reject when:

- The shared workflow needs portfolio-wide write/release permissions, unpinned branch references, or synchronized toolchain upgrades.

### Phase 4 — `rustzen-core` API and consumer audit

Impact: `contract-impact`; no removals in the audit task.
Dependencies: Phase 2.

Objective: retain only justified shared foundations without breaking published consumers.

For every exported crate/module/API:

- list exact internal manifest references and call sites;
- distinguish active consumers, examples, and planned consumers;
- inspect public package/tag exposure and possible external consumers;
- classify product-neutral versus product-specific semantics;
- record current compatibility and versioning obligations.

Decision rules:

- New APIs require at least two real consumers, stable product-neutral semantics, and reduced coupling.
- Existing published APIs with fewer than two internal consumers are not automatically deleted.
- Removal requires a deprecation/versioning decision, consumer migration, destination owner, compatibility assessment, and release notes.
- Product-specific behavior returns to one owning product; it is not moved into another generic shared layer.

Repository-defined validation:

```bash
just check
cargo test --workspace --all-features
cargo fmt --all -- --check
```

Done when:

- Every API has a retain, deprecate, relocate, or investigate decision with evidence.

Reject when:

- Public compatibility is inferred only from known local repositories.

### Phase 5 — Desktop suite entitlement proof

Impact: `contract-impact`; product family only, no monorepo.
Dependencies: Phase 2.

Objective: prove that one entitlement can serve independent products without suite-wide failure.

Define a versioned entitlement specification and test vectors for:

- offline/online/hybrid validation;
- acceptable offline duration;
- activation/device limits;
- clock skew;
- cached entitlement and expiry;
- format/version compatibility;
- revocation and service outage behavior;
- failure policy when the licensing client fails;
- backwards compatibility across independently released products.

Rules:

- Each application retains independent startup, version, signing, updater, channel, artifact, and rollback identity.
- Licensing outage must follow an explicit local-first failure policy and must not silently disable every app.
- A licensing-client release cannot force coordinated product releases.
- This phase does not select price, payment provider, legal license text, or source visibility.

Validation:

- Shared protocol test vectors run independently in Clear and Clipboard before Zipper adoption.
- Each product can remain on the previous protocol/client version.
- Zipper CLI/npm behavior remains unchanged unless a separate product RFC approves GUI work.

Done when:

- At least two products pass the same entitlement vectors while retaining independent releases and rollback.

Reject when:

- Continuous network access, one shared updater, one release version, or one installer becomes an accidental requirement.

### Phase 6 — Repository-specific resilience verification

Impact: `contract-impact`, one repository per task.
Dependencies: Phase 2; may run after relevant Phase 3/4/5 pilot.

Objective: prove current build, package, deploy, backup, restore, restart, and rollback behavior before any structural move.

Use only exact commands from the approved Phase 1 validation registry. Current confirmed examples:

- `rustzen-hub`: `npm run lint` and `npm run build`. Any workspace-scoped command is `Not verified` until recorded in the registry.
- `rustzen-admin`, `rustzen-analytics`, `rustzen-inspect`, `rustzen-report`, `rustzen-clear`, `rustzen-clipboard`: exact validation commands are currently `Not verified` for this cross-repository RFC and must be read from the source-SHA root `justfile` into the registry before Phase 6. Runtime/deployment restore tests are also `Not verified` until fixtures and safe test environments exist.
- `rustzen-core`: commands in Phase 4.
- `rustzen-zipper`:

  ```bash
  cargo fmt --check
  cargo build --locked
  cargo test --locked
  cargo clippy --locked -- -D warnings
  npm test
  npm run ci
  ```

Done when:

- Source, package, runtime, and restore evidence exist where applicable.
- Failure in one product does not stop unrelated products.

Reject when:

- Only source-level tests exist for a packaging, deployment, updater, or restore claim.

### Phase 7 — Future monorepo eligibility proof of concept

Impact: `structure-impact`; disposable clean worktree/repository only.
Dependencies: Phases 1–6 relevant to the candidate.

Entry criteria:

- homogeneous repository visibility;
- at least two substantial proven shared components;
- frequent atomic changes currently span the candidate repositories;
- independent build, test, release, signing, update, and rollback paths remain possible;
- path-filtered CI and caching are demonstrated;
- protected deployment contracts remain unchanged;
- history/release preservation has a defined strategy;
- measured benefit exceeds migration and continuing coordination cost.
- no candidate-impacting deployment, data, packaging, signing, updater, process, compatibility, or rollback contract remains `Not verified`;
- candidate-specific quantitative thresholds were approved before proof-of-concept results are generated.

An unresolved contract may be excluded only when review evidence proves the candidate cannot affect it and an enforceable do-not-touch boundary is recorded.

Proof-of-concept rules:

- Existing repositories remain authoritative.
- No production release, package publication, installer, deployment, or archive comes from the proof of concept.
- Import source/history only from recorded SHAs.
- Run candidate-specific parity tests and compare CI/build/release metrics.

Done when:

- An independent review confirms lower recurring maintenance with no new release train or rollback coupling.

Reject and discard when:

- Branding, entitlement, language, ownership, or repository count is the main justification;
- public and internal code would share one visibility boundary;
- rollback would revert unrelated products;
- Zipper must become Tauri to fit the layout;
- a shared daemon or direct cross-product database access is introduced.

### Phase 8A — Cutover (future, not authorized)

Impact: `structure-impact` and `contract-impact`.
Dependencies: accepted Phase 7 proof, separate explicit user authorization.

Required before cutover:

- one authoritative source and one-way cutover plan;
- functional, packaging, deployment, data, and rollback parity;
- migrated consumers and integrations;
- preserved tags, releases/assets, issues/discussions, package links, provenance, and discoverable history;
- verified snapshots, migration procedure, rollback procedure, and rollback trigger thresholds.

Cutover authorization is separate and explicit. The post-cutover rollback window begins only after the authoritative-source switch.

### Phase 8B — Archive (future, separately authorized)

Impact: `structure-impact`.
Dependencies: successful Phase 8A and an expired post-cutover rollback window.

Archive may begin only when old deployments and consumers are absent, old artifacts and history remain discoverable, and an independent review confirms the old repository is no longer required.

Archive authorization is separate from cutover authorization and is never part of source movement.

## 6. Independent review gates

Every implementation phase must be its own reviewable change set:

1. Precondition review: source SHAs, dirty-tree ownership, scope, contracts.
2. Implementation review: path-limited diff and no unrelated changes.
3. Verification review: repository-defined commands and runtime evidence proportional to risk.
4. Completeness review: manifests, commands, tests, CI/deploy paths, docs, indexes, stale references, rollback.
5. Delivery review: exact staged paths and `git diff --cached`; commit/push only after explicit authorization.

Reject any phase that cannot be rolled back independently.

## 7. Explicit non-goals

- No big-bang rewrite or immediate repository merge.
- No unified Admin/Analytics/Inspect/Report/Hub runtime or second control plane.
- No shared daemon for code-centralization convenience.
- No shared desktop release train, installer, updater feed, version, or executable requirement.
- No Zipper Tauri conversion for structural consistency.
- No direct cross-product database access.
- No speculative shared crate or shared workflow.
- No public exposure of internal repository names or implementation details.
- No private-only dependency that breaks the public Admin template.
- No archive, deletion, transfer, visibility change, production deployment, license change, payment integration, or public announcement in this plan.
- No claim that AGPL prohibits commercial use.

## 8. What to do now

Execute only Phases 0–2 as documentation and read-only inventory work. Then choose one Phase 3 pilot and the Phase 4 `rustzen-core` audit. Phase 5 may proceed as an interface specification after the product and legal decisions are made.

Do not start a monorepo proof of concept until the measurements and contract inventories pass their gates. Do not plan any archive until a proof of concept, parity migration, and rollback window have succeeded.
