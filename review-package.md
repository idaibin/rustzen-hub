# Rustzen portfolio consolidation review package

## Review contract

Codex is the executor. ChatGPT is an independent architecture reviewer. This package contains no secrets and requests review only; do not assume compatibility constraints beyond those stated here.

Return:

1. Findings ordered by severity.
2. Incorrect assumptions and missing decisions.
3. Concrete verification gates.
4. A revised recommendation where needed.
5. Verdict: `pass`, `needs changes`, or `blocked`.

## Objective

Produce a credible, executable, verifiable, independently reviewable migration plan for a solo developer who wants to reduce maintenance across the Rustzen portfolio.

The desired public/product framing is:

- Personal assets remain independent: `aicraft`, `feeds-hub`, `blog`.
- Rustzen engineering/local management capability becomes simpler to maintain.
- Rustzen desktop products share foundations while remaining independently usable.

No implementation, repository deletion, transfer, archive, public announcement, deployment, license change, or Git mutation is authorized by this review.

## Prior proposal under review

The prior conversation proposed:

1. Reduce Rustzen to `rustzen-hub`, `rustzen-platform`, and `rustzen-desktop`.
2. Merge Admin, Analytics, Inspect, and Report into `rustzen-platform` as a Rust workspace with a daemon and isolated worker processes.
3. Merge Clear, Clipboard, and Zipper into `rustzen-desktop` as a monorepo with three independent apps and shared crates.
4. Move or dissolve `rustzen-core` into the consolidated workspaces unless reuse justifies independence.
5. Use separate SQLite databases per high-volume subsystem.
6. Use one commercial license to unlock the desktop suite.
7. Keep product source private or source-available rather than relying on AGPL to prohibit commercial reuse.

## Verified current repository truth (2026-07-13)

The parent `/Users/daibin/Projects/repo-github` is not a Git repository. Each child is independent.

### Governance and public-surface constraints

- `docs/project-map.md` currently classifies:
  - `rustzen-admin`: public Web/Rust admin engineering template.
  - `rustzen-core`: public shared Rust components/crates.
  - `rustzen-zipper`: public release-packaging CLI and macOS app experiment.
  - `rustzen-analytics`, `rustzen-inspect`, `rustzen-report`: internal references that must not be introduced into public Rustzen organization-facing content.
- `rustzen-hub` already contains both `apps/site` (public website) and `apps/console` (admin console/API). It is not merely a static product landing repository.
- Workspace standards require structural changes to update manifests, commands, tests, CI/deploy paths, architecture/project-map docs, indexes, stale-reference searches, and rollback/migration decisions together.
- Shared capabilities may enter `rustzen-core` only after at least two real consumers exist, product meaning is absent, the API is stable, and coupling is reduced.

### Engineering/local-management repositories

- `rustzen-admin`: Web/Rust reference monorepo (`apps/server`, `apps/web`, shared crates, deploy); currently a public engineering template and consumes pushed/tagged `rustzen-core` capabilities.
- `rustzen-analytics`: separate Web/Rust analytics product/reference with high-volume event ingestion, aggregation, report generation, and SQLite persistence.
- `rustzen-inspect`: permanent multi-process exception with server, agent, frontend, shared crates, separate server/agent runtime behavior, protected deployment paths, and SQLite-only runtime.
- `rustzen-report`: protected legacy/current Web/Rust layout and protected `/opt/rustzen-report` deployment contract.
- These are not currently interchangeable modules. Inspect includes node agents and distributed runtime behavior; Analytics includes ingestion and aggregation; Report has its own protected production contract; Admin is a reusable template.

### Desktop/product repositories

- `rustzen-clear`: Tauri client with product-specific cleanup runtime; current worktree has documentation changes.
- `rustzen-clipboard`: Tauri, GUI-first, local-first client; clipboard capture/storage/privacy behavior lives in its product core.
- `rustzen-zipper`: currently a compact Rust CLI plus npm package, not a mature Tauri desktop app. Its release contract includes CLI flags, npm wrapper/install scripts, platform binaries, tests, and GitHub release assets.
- A desktop monorepo therefore cannot assume three equivalent Tauri apps at migration start.

### Current dirty/branch risks

- `rustzen-hub`: branch diverged (`ahead 1, behind 1`) with modifications in site and console files.
- `rustzen-admin`: feature branch, ahead, with substantial unrelated backend/frontend/docs modifications.
- `rustzen-core`: feature branch with a modified library file.
- `rustzen-clear`: branch whose upstream is gone, with uncommitted docs changes.
- `rustzen-analytics`, `rustzen-inspect`, `rustzen-report`, `rustzen-clipboard`, and `rustzen-zipper` were clean at inspection time.
- Any execution plan must use clean temporary worktrees/checkouts and explicit source SHAs; it must not migrate from these dirty worktrees.

## Questions for the three rounds

### Round 1: feasibility and boundary correction

Evaluate the prior proposal against the verified facts. Focus on whether repository consolidation actually reduces solo-maintainer cost without erasing distinct product/runtime boundaries. Challenge the assumption that Admin + Analytics + Inspect + Report should become one runtime product, and the assumption that Clear + Clipboard + Zipper should immediately become one repository.

Require a decision for each existing repository: retain, merge, convert to template/library, archive after migration, or defer. Separate product positioning from physical Git layout.

### Round 2: adversarial architecture and migration review

Assume Round 1 recommendations have been adopted. Stress-test:

- blast radius and release coupling;
- protected deployment/runtime contracts;
- database isolation, retention, backup, restore, and schema ownership;
- daemon/worker failure containment and whether process isolation is warranted;
- updater/signing/licensing boundaries for independent desktop apps;
- public/private/internal visibility constraints;
- history preservation and rollback;
- CI duration, dependency graphs, versioning, and solo-maintainer overhead;
- whether `rustzen-core` has two proven consumers or should shrink rather than disappear;
- criteria that must be met before creating a new consolidated repository.

Reject a big-bang rewrite. Require reversible phases and explicit stop/go gates.

### Round 3: final plan acceptance

Review the final proposed plan as if it were an implementation RFC. It must be independently executable and reviewable, with:

- named phases and dependencies;
- source and destination repository/path ownership;
- exact preconditions and do-not-touch boundaries;
- contract-impact and structure-impact markers;
- validation commands sourced from each repository (or marked `Not verified` pending implementation);
- migration fixtures or parity tests;
- data migration/rollback strategy;
- packaging/release verification;
- done criteria and reject criteria per phase;
- explicit non-goals;
- a final repository decision matrix;
- a clear answer to what should be done now versus deferred.

## Reviewer warning

Do not treat the prior summary as authoritative. In particular:

- AGPL does not prohibit commercial use.
- Multiple SQLite files do not automatically provide fault isolation or eliminate locking; ownership, connections, backup consistency, retention, and cross-database queries must be designed.
- Multiple binaries inside one package do not automatically isolate failures; lifecycle supervision, IPC contracts, resource limits, migrations, and restart policy matter.
- A monorepo does not require one installer, one release cadence, or one executable.
- A product family, Git repository boundary, deployment unit, process boundary, and database boundary are separate decisions.
