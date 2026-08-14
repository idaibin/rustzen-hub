# Phase 0 Inventory for RFC v3

Status: complete for the source revisions listed below
Recorded: 2026-07-14
Authority: `rustzen-portfolio-plan-v3.md`

This inventory closes the read-only gate before Admin integration work. Old
repository names are migration provenance only; the target module IDs are
`monitor`, `insights`, and `reports`.

## Source Revisions

| Scope | Revision | Branch at inspection | Validation source |
| --- | --- | --- | --- |
| Admin | `bac70e7286b63077b3f055e205ce017e4f4f48f0` | `feat/shadcn-admin-rebuild` | root `justfile` |
| Core | `1bc279a208bcdbca4df0208aef6020ab5942a62f` | `feat/backend-foundation` | root `justfile` |
| Monitor source | `ad06fecddba9a7dd6f3270d27aa9c1385a17cc0a` | `main` source revision | root `justfile` |
| Insights source | `0e3f1e9dd876301aaa9fc2a928c1f6d8903f35bb` | `main` source revision | root `justfile` |
| Reports source | `69930c9b1e26e7580503e956566b315872167a33` | `main` source revision | root `justfile` and documented frontend/backend commands |
| Clear source | `d6ed0e034c05f7d574074263cd117612845a14a5` | `docs/codex-cache-cleanup-guide` | source `justfile` and Tools manifest |
| Clipboard source | `99d8715742daaf83b9db4313a30561179f50bca6` | `main` | source `justfile` and Tools manifest |
| Zipper source | `5a5785142c5b4a883879ffa82b23c449a310db02` | `main` source revision | `npm run ci` and Tools manifest |

## Core Consumers

Workspace-wide manifest and lockfile search found one real external consumer:
Admin. Admin currently consumes:

- `rz-core` from `crates/auth`, `crates/storage`, and `apps/server` for role
  policy, query helpers, logging, SQLite connection and maintenance;
- `rz-config` from `crates/runtime` for runtime path resolution.

Analytics has a local crate named `rustzen-core`, but it is a repository-local
auth crate and is not a dependency on the independent Core repository. No Tools
product consumes the independent Core repository at the recorded revisions.

Phase 1 must move the concrete Admin-owned implementations into Admin and reduce
all `github.com/rustzen/rustzen-core`, `rz-core`, and `rz-config` manifest and
source references to zero before Core can be considered read-only.

## Admin Dirty Worktree Classification

No file is `unknown`.

### Related existing: shadcn rebuild

- `apps/web/src/routes/manage/{deploy,dict,log,task}.tsx`
- `apps/web/src/routes/system/{menu,role,user}.tsx`
- `apps/web/src/components/app/`
- `apps/web/src/components/form/`

These files are the required UI baseline. Phase 1 may integrate new routes and
shared components around them, but must not replace or revert their changes.

### Related existing: current backend hardening

- `.env.example`
- `apps/server/src/features/manage/task/service.rs`
- `crates/config/src/lib.rs`
- `docs/architecture.md`
- `docs/guides/backend.md`

These changes affect runtime, maintenance, or architecture boundaries used by
Phase 1. They must be preserved and reviewed as related existing work.

### Task-owned governance preparation

- `LICENSE.md`, `NOTICE.md`, `CONTRIBUTING.md`, `TRADEMARKS.md`,
  `THIRD_PARTY_NOTICES.md`
- license and `publish` metadata in the touched Cargo and npm manifests

These changes are independent from the module implementation and must remain a
separate delivery group.

## Monitor Extraction

Source evidence includes `nodes`, `node_metrics`, node health and metric agent
routes, Controller node/agent services, and the node/monitor frontend routes.

| Decision | Scope |
| --- | --- |
| Preserve core | node registration; authenticated heartbeat; latest CPU, memory, and disk snapshot; online/offline/error state; retention cleanup; node list and detail |
| Reuse from Admin | Admin JWT/session/role system, permission middleware, operation logging, config conventions, update ownership |
| Implement as new boundary | `rz monitor controller` and `rz monitor agent`; versioned local IPC/auth contract; separate Monitor SQLite database; fixed Agent protocol with no arbitrary command execution |
| Do not migrate | alert policy center, deploy/bootstrap control plane, SSH, CORS/project management, report scheduler, topology, batch commands, duplicate users/roles/menus/dicts/tasks/logs/dashboard |

Source tables retained conceptually are only `nodes` and the latest/retained
metric samples. The old sixteen-migration database is not copied wholesale.

## Insights Extraction

Source evidence includes `/api/analytics/track`, project/API-key routes,
`projects`, `project_api_keys`, raw `events`, daily/period rollups, ingestion,
aggregation, and retention workers.

| Decision | Scope |
| --- | --- |
| Preserve core | project and Project Key; allowed origins; `POST /api/insights/track`; page-view and API-request events; PV, UV, request count, error count, average duration, P95; project overview; retention/aggregation/cleanup |
| Reuse from Admin | Admin auth, roles, permissions, task visibility, shared HTTP response conventions |
| Implement as new boundary | `rz insights worker`; separate Insights SQLite database; bounded ingest and aggregate loop; Admin-to-worker versioned IPC |
| Do not migrate | `/api/analytics/track` compatibility for now; tracker script; full visitor profile/timeline; arbitrary event dimensions; funnels; channels; push devices; report center; duplicate users/roles/menus/dicts/tasks/deploy/logs/dashboard |

The explicit current decision is not to call or expose
`/api/analytics/track`. A compatibility route requires a later real-consumer
inventory and separate approval.

## Reports Extraction

Source evidence includes template rendering, manual job creation, jobs and job
results, uploaded/generated files, and template/job frontend routes.

| Decision | Scope |
| --- | --- |
| Preserve core | report template definition; validated data input; one manual generation request; queued/running/succeeded/failed state; generated file storage and download; expiry cleanup; template list, generation form, result list |
| Reuse from Admin | Admin auth, role/permission middleware, operation logging, common response and path-safety rules |
| Implement as new boundary | `rz reports worker`; separate Reports SQLite database; versioned Admin-to-worker IPC; bounded file root |
| Do not migrate | separate accounts/users/systems; Dataset editor; Flow editor; Cron/Periodic schedules; WebSocket live workbench; work/operation log pages; template marketplace; duplicate system management |

Only template, job, result/file, and cleanup records are retained conceptually;
the old full schema and browser-workflow orchestration are not copied wholesale.

## Approved Admin Boundary

The one complete `rz` artifact exposes four server processes:

```text
rz admin
rz monitor controller
rz insights worker
rz reports worker
```

Each process owns one SQLite database and its own migrations. Module failures
must not terminate Admin or another worker. The Release unit remains one full
artifact and one version; there is no module-only version, deployment, dynamic
activation, long-lived mixed version, or default zero-downtime architecture.

Initial permission defaults:

| Capability family | owner | admin | viewer |
| --- | --- | --- | --- |
| view/list/status | allow | allow | allow |
| create/update/run manual report | allow | allow | deny |
| delete/cleanup/update/apply/rollback | allow | deny unless explicitly existing Admin policy allows it | deny |

Every backend route must still carry an exact capability and an allow/deny test.

## Product Identity and Release Baseline

Tools `manifests/products.json`, `manifests/ownership.json`, and the per-product
history manifests record product IDs, source revisions, build commands, signing
secret boundaries, update feeds, release tags, and release owners. Clipboard,
Zipper, and Clear remain independently versioned, built, signed, updated,
released, and rolled back.

The local migration evidence currently proves independent checks and
non-production rehearsals. Zipper npm remains at the old authority and is
explicitly excluded from publication in this execution. Therefore Zipper cannot
pass the single-release-authority or archive gate yet.

## Recent Maintenance and Automation Baseline

Commit counts from 2026-06-14 through inspection: Admin 18, Core 25, Monitor
source 57, Insights source 51, Reports source 13, Clear 45, Clipboard 77,
Zipper 7, Tools 87. These repositories are active enough that migration must use
fixed source revisions rather than assume dormant code.

All inspected GitHub Actions are manual `workflow_dispatch` entry points. Local
commands are the primary gate; no Action is authorized to run automatically.

## Phase 0 Gate Result

- Every extraction item has an owner, source revision, decision, and validation
  command source.
- Admin dirty files have no `unknown` ownership.
- Core consumers are bounded to Admin.
- Product identity and release boundaries are recorded in Tools manifests.
- Zipper npm publication and final archive remain explicit later blockers.

Phase 1 may begin on the existing `feat/shadcn-admin-rebuild` branch while
preserving the classified changes above.
