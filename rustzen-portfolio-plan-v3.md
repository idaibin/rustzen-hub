# Rustzen 三仓库整合方案（RFC v3）

状态：已确认目标架构，实施仍需按阶段授权
日期：2026-07-13
取代：`rustzen-portfolio-plan-v2.md` 中关于 `rustzen-core`、`rustzen-desktop-template` 和 `rustzen-launcher` 的规划

## 1. 最终架构

只保留三条核心仓库边界：

```text
rustzen-hub       # 官网、授权后台、下载入口、发布与授权契约权威
rustzen-admin     # 公开的最小 Web/Rust 工程模板
rustzen-tools     # 私有产品 Monorepo：Clear + Clipboard + Zipper
```

对外产品关系：

```text
Rustzen Suite
├── Rustzen Clear
├── Rustzen Clipboard
└── Rustzen Zipper

Rustzen Pro       # Suite 的统一商业权益，不是应用或统一版本
```

取消以下长期仓库规划：

- 不创建 `rustzen-desktop-template`。
- `rustzen-launcher` 不进入目标架构；后续只可在单独授权后归档或删除。
- 取消独立 `rustzen-core`；其真实消费者所需代码分别并入所属仓库。
- 旧 Analytics、Inspect、Report 不再作为独立对外产品或目标仓库维护；核心能力分别以 Insights、Monitor、Reports 模块进入 Admin，不能整体搬迁。

## 2. 关键原则

1. 仓库数量减少不是目的；目标是降低个人开发者的重复维护成本。
2. 不为“未来可能复用”提前创建共享仓库或抽象层。
3. `rustzen-admin` 与 `rustzen-tools` 不共享私有源码依赖；少量重复基础代码可接受。
4. Tools 内三产品统一源码管理与授权客户端，但继续独立构建、签名、更新、发布和回滚。
5. Hub 拥有授权与发布服务契约；Tools 只能消费版本化契约。
6. 所有结构删除都必须同步处理 manifest、路由、数据库迁移/种子、测试、CI、文档、截图、部署和索引。

## 3. `rustzen-admin` 与三个接入模块

`rustzen-admin` 继续保持当前 Web/Rust Admin 工程模板和现有系统管理基线。本方案不删除 Admin 自身已有的 Dashboard、Deploy、Dict、Task、Log、Menu、User、Role、Status 等模块。

需要压缩的是计划接入 Admin 的三个内部能力。旧仓库名与新模块名映射如下：

| 旧来源 | Admin 内新名称 | 稳定模块 ID |
|---|---|---|
| `rustzen-inspect` | Monitor | `monitor` |
| `rustzen-analytics` | Insights | `insights` |
| `rustzen-report` | Reports | `reports` |

Video 暂不接入，也不进入本方案。三个模块不再作为三套完整后台系统迁入，而是各自提取一个最小、可验证的核心闭环。旧仓库名只用于迁移追溯，新的菜单、权限、API、二进制和文档统一使用新名称。

### 3.1 Monitor 最小核心

保留：

- 节点注册和最近心跳；
- CPU、内存、磁盘等基础指标的最新快照；
- 节点在线、离线和异常状态；
- Monitor Agent 与 Controller 间的最小认证协议；
- 数据保留期限和定期清理；
- 一个节点列表和一个节点详情页。

不接入：策略中心、复杂控制面、报表、拓扑、批量命令、长周期多维查询和复杂图表。Agent 只保留安装/升级自身、采集与心跳，不扩展成远程运维平台。

Monitor 采用一个程序、两个运行模式：

```text
rz monitor controller   # Admin 所在节点：注册、心跳、指标、状态和 Agent 分发
rz monitor agent        # 受管节点：采集、心跳以及自身受控升级
```

Controller 与 Agent 共用协议、配置模型和版本规则，但运行时是不同机器上的独立进程。Controller 与 Admin 来自同一个 `rz` 文件，但由不同 Service 分别启动为独立进程。

代码层面只有一个顶层 `rz` CLI 和一套版本。Monitor 的 Controller 与 Agent 是 `rz monitor` 下的两个运行模式，不再维护旧 `server`、`agent` 两套工程。Agent-only 只是同一源码通过编译 Feature 裁剪出的同名 `rz` 制品，不形成第二套源码、协议或版本线。

节点部署优先级：

1. 首选从同一源码和版本构建 Agent-only 精简 `rz`，关闭 Admin、Controller、Insight、Report、Web、数据库查询和无关依赖；传输到节点后执行 `rz monitor agent`。
2. 如果当前工具链不能安全生成 Agent-only 制品，则传输完整 `rz`，但节点只允许执行 `rz monitor agent --config <path>`。
3. 禁止向受管节点传输整个发布目录、前端资源、Controller 数据库或 Admin 配置；节点部署单位只能是二进制、最小配置和必要的校验/服务文件。

无论采用精简制品还是完整二进制，协议版本、Agent 版本和制品 SHA-256 必须登记。Controller 下发前校验目标 OS、架构、版本、签名/哈希和可用空间；使用临时文件下载、校验后原子替换，失败时保留上一版本并恢复运行。Agent 不接受任意命令执行，只支持固定的采集、心跳、健康和自身升级协议。

### 3.2 Insights 最小核心

保留：

- 项目与 Project Key；
- 来源白名单；
- `POST /api/insights/track` 事件上报；迁移时是否为旧 `/api/analytics/track` 提供临时兼容由真实调用方清单决定；
- 页面访问和 API 请求两类基础事件；
- 按项目和时间范围查看 PV、UV、请求数、错误数、平均耗时和 P95；
- 一个项目概览页和必要的明细入口；
- 原始数据保留、聚合和清理策略。

不接入：完整用户画像、用户行为时间线、任意维度分析、复杂漏斗、渠道体系、独立报表中心、重复的用户/角色/菜单/字典/任务/部署模块，以及大量排行和装饰性 Dashboard。

### 3.3 Reports 最小核心

保留：

- 报表模板定义；
- 数据输入契约；
- 手动生成一次报表；
- 最小后台任务状态：等待、运行、成功、失败；
- 生成文件的存储、下载、过期清理；
- 一个模板列表、一个生成表单和一个任务结果页。

不接入：独立账号/系统管理、复杂 Dataset 编辑器、可视化流程编排、Cron/Periodic 双套调度、WebSocket 实时工作台、操作/工作日志展示、复杂模板市场和独立部署体系。定时生成只有出现真实需求后再增加。

### 3.4 统一权限

统一使用 Admin 的认证和授权体系。内置角色代码固定为：

- `owner`：系统所有者，拥有 Admin 和三个模块的全部权限，包括模块配置、数据保留策略和权限管理；
- `admin`：管理员，可执行 Monitor、Insights、Reports 的日常管理和写操作，但不能改变 Owner 身份或所有权级安全配置；
- `viewer`：只读用户，只能访问 Admin 和三个模块的查看接口，不允许配置、删除、执行或重试任务。

模块权限使用统一前缀：`monitor:*` / `monitor:view`、`insights:*` / `insights:view`、`reports:*` / `reports:view`。默认映射为：Owner 拥有 `*`，Admin 拥有三个模块的 `*`，Viewer 拥有 `*:view`。所有后端路由必须执行真实权限校验，前端菜单隐藏不能替代授权。

### 3.5 进程、数据与故障隔离

对外是一个 Admin 产品和一个安装包，但运行时采用多个独立进程：

```text
rz admin serve          # 登录、权限、系统管理、统一 API/UI 入口
rz monitor controller  # 节点心跳、指标接收与 Agent 分发
rz insight serve       # 事件写入、聚合与保留清理
rz report serve        # 报表生成、文件管理与清理
```

发布物只有一个 `rz` 二进制，但 systemd 或等价 Supervisor 使用不同子命令启动四个独立进程，分别停止、健康检查、限制资源和有限重启。Admin 不把模块核心逻辑以内嵌线程方式运行。模块间通过版本化的 loopback HTTP、Unix Socket 或明确 IPC 契约通信，不直接调用对方内部代码。

同一个 `rz` 同时提供固定的服务运行入口和运维入口：

```text
bin/
└── rz
```

基础命令：

```bash
rz start [all|admin|monitor|insight|report]
rz stop [all|admin|monitor|insight|report]
rz restart [all|admin|monitor|insight|report]
rz status [all|admin|monitor|insight|report]
rz logs <admin|monitor|insight|report> [--follow]
rz doctor
rz version
```

在 Linux 上，`rz start/stop/restart/status/logs` 内部适配 `rz-admin.service`、`rz-monitor.service`、`rz-insight.service` 和 `rz-report.service`；四个 Unit 的 `ExecStart` 都指向同一个 `rz`，但参数不同。用户不直接使用 `systemctl`。只读命令不提权，启停、安装和升级命令在需要时明确请求一次管理员权限。CLI 只能接受固定服务枚举，禁止把用户输入拼接成任意 Shell 命令。

```ini
ExecStart=/opt/rz/bin/rz admin serve
ExecStart=/opt/rz/bin/rz monitor controller
ExecStart=/opt/rz/bin/rz insight serve
ExecStart=/opt/rz/bin/rz report serve
```

因此磁盘上是一个文件，操作系统中是四个 PID、四个 Service 和四个独立故障域。某个子命令进程崩溃不会直接终止其他三个进程。

Agent 节点只安装 `rz` 和一个 Monitor Agent Service。节点侧使用：

```bash
rz monitor agent install --config <path>
rz monitor agent status
rz monitor agent logs [--follow]
rz monitor agent uninstall
```

这些子命令同样封装底层服务管理；Controller 远程部署使用固定协议，不通过 SSH 拼接 `systemctl` 命令。

数据按模块分库并由对应进程独占写入：

```text
data/admin.db
data/monitor.db
data/insights.db
data/reports.db
```

Admin 只持有 `admin.db`；不得跨库直接 Join，也不得绕过模块服务写入模块数据库。跨模块页面只聚合各模块公开的摘要接口，并设置超时、并发上限和失败降级。

故障行为：

- 任一 Worker 崩溃，只对应模块返回 `MODULE_UNAVAILABLE`，Admin 登录和另外两个模块继续工作；
- Admin 首页显示模块健康状态，但不因一个模块超时阻塞整个页面；
- Supervisor 可按退避策略重启失败 Worker，连续失败后停止重启并保留诊断信息；
- Reports 的失败任务不得阻塞 Insights 写入，Insights 聚合失败不得阻塞 Monitor 心跳；
- 三个模块之间禁止同步依赖链；共享任务队列也必须按模块分区和限制并发；
- 数据库损坏、磁盘写满和异常大请求必须被限制在对应模块的数据目录、配额和进程资源边界内。

统一权限不等于共享故障域。Admin 负责签发短期内部身份上下文；Worker 独立验证调用来源、角色和模块权限。

### 3.6 三模块统一接入规则

- 统一复用 Admin 的认证、权限、用户、角色、菜单、字典、任务、日志、配置、部署和 UI 组件，不复制各旧系统的同类模块。
- 每个模块拥有一个 Admin 适配层、一个独立 Worker、一个权限前缀、一个独立数据库和清晰的数据保留策略。
- 模块故障不得阻断 Admin 登录及其他模块；耗时任务只能在对应 Worker 内执行。
- 查询只保留完成核心闭环必需的固定查询；不接入通用查询构建器、任意筛选器和重复 Dashboard。
- 展示只保留列表、详情、状态和最小趋势；不能为了迁移旧页面而保留无明确用户决策价值的图表。
- 先迁移契约和核心服务，再重新实现最小 UI；不整体复制旧仓库前后端。

### 3.7 统一发布与滚动热更新

保留 Admin 现有 Deploy Version 管理能力，但将原来的 Server/Web 分开更新收缩成一个 `rz` 文件更新。Web 静态资源和四个模块的数据库迁移编译进 `rz`，日常升级只上传一个经过签名的可执行文件：

```text
rz-<version>-<target>
```

首次安装可以提供一个包含 `rz`、四个 Unit 和安装脚本的初始化压缩包；安装完成后的日常升级不再上传完整包。运行目录只保留三个子目录，日志使用 journald：

```text
/opt/rz/
├── bin/
│   ├── rz -> rz-1.2.0
│   ├── rz-1.1.0
│   └── rz-1.2.0
├── config/
│   └── rz.toml
└── data/
    ├── admin.db
    ├── monitor.db
    ├── insights.db
    └── reports.db
```

更新流程：

1. Upload：Admin 页面或 `rz update upload` 接收一个版本化 `rz` 文件，保存为候选版本，不影响运行进程。
2. Verify：读取二进制内嵌 Release Manifest，校验签名、SHA-256、目标 OS/架构、磁盘空间、当前版本和协议兼容范围。
3. Stage：以 `bin/rz-<version>` 写入并设置只读/可执行权限，执行配置、端口、权限和内嵌迁移预检；不得修改 `bin/rz` 链接。
4. Backup：分别备份 `admin.db`、`monitor.db`、`insights.db`、`reports.db` 及必要文件，记录恢复点。
5. Coordinate：启动独立的 `rz update worker` 进程保存更新状态。它不能依赖 Admin 请求持续在线，因此可以在 Admin 最后重启时继续完成或恢复流程。
6. Switch：在更新状态中记录旧版本，然后原子切换 `bin/rz` 链接。
7. Roll：依次重启 Monitor → Insight → Report → Admin；每个进程通过启动、健康、数据库和最小业务探针后才能继续下一个。内嵌 Web 随 Admin 最后重启生效。
8. Converge：四个进程最终必须报告同一个 Release ID；混合版本只允许存在于滚动更新窗口。
9. Observe：在观察窗内保留上一版本和备份，禁止立即清理。

用户命令：

```bash
rz update list
rz update inspect <version>
rz update apply <version>
rz update status
rz update rollback
rz update cleanup
```

Admin UI 调用同一套 Update Service，不直接执行 Shell。`rz update worker` 通过固定状态机管理 systemd，所有中间状态落盘，进程或机器重启后可以继续判断当前版本、已完成步骤和恢复动作。

更新权限沿用 Admin 的高风险部署边界：`owner` 可上传、应用、回滚和清理；`admin`、`viewer` 默认只能查看版本与状态。任何角色都不能通过自定义参数注入路径、Unit 名称或 Shell 命令。

滚动更新必须满足：

- 相邻 Release 的 Admin↔Worker IPC 至少兼容 N/N-1，保证短暂混合版本可通信；
- 数据库迁移按模块归属，优先使用 Expand/Contract：先增加兼容结构，旧字段删除推迟到后续版本；
- 不可逆迁移没有已验证的数据恢复方案时禁止热更新；
- 一个模块健康检查失败时立即停止后续重启，不影响尚未重启的进程；
- 回滚时按更新记录将 `bin/rz` 原子切回上一版本文件，只重启已经升级的进程，并按模块执行已验证的数据恢复；
- 更新失败不得删除候选包、上一版本、诊断日志或数据库备份；
- 单实例模式允许对应模块在重启时短暂不可用，但 Admin 和其他模块继续运行；需要真正零中断时必须为该模块增加双实例和本地负载切换，这不是默认部署要求。

Agent 更新与服务端 Release 分开：Controller 按 OS/架构分批下发 Agent-only `rz`，先 Canary、再批量；节点校验哈希后原子替换并重启 `rz monitor agent`，失败恢复上一制品。不得在服务端更新时无差别同时升级所有节点。

## 4. 取消 `rustzen-core`

当前 Admin README 已声明依赖 `rustzen-core` 的 `rz-core`。实施时必须先完成依赖清单，再按所有权内聚：

- Admin 实际使用的配置、SQLite、认证、日志和运行时能力并入 `rustzen-admin/crates/` 或 `apps/server`。
- Clear、Clipboard、Zipper 共用且已验证的私有能力进入 `rustzen-tools/shared/`。
- 只被一个产品使用的代码进入 `rustzen-tools/products/<name>/`。
- Admin 与 Tools 之间不使用本地路径、私有 Git 或未发布的交叉依赖。

只有未来出现至少两个独立、长期、真实的公开消费者，且 API 已稳定时，才重新评估公共 crate；本方案不预留独立 Core 仓库。

`rustzen-core` 的归档/删除必须满足：

1. 所有消费者和版本约束已清点；
2. Admin 与其他真实消费者完成替换并通过原有验证；
3. 文档、CI、发布、包索引和工作区引用清零；
4. 旧提交、Tag 和 Release 的保留方式明确；
5. 获得单独归档或删除授权。

## 5. `rustzen-tools` 私有 Monorepo

首阶段仍采用联邦式 Monorepo，不强制统一 Cargo/npm Workspace 或锁文件：

```text
rustzen-tools/
├── products/
│   ├── clear/          # 自有 Cargo/npm/Tauri 结构、锁文件和发布流程
│   ├── clipboard/      # 自有 Cargo/npm/Tauri 结构、锁文件和发布流程
│   └── zipper/         # 自有 Rust CLI/npm 结构、锁文件和发布流程
├── shared/             # 至少两个真实产品消费者后才准入
├── tooling/            # CI、构建和发布编排
├── manifests/
│   ├── products.*
│   ├── ownership.*
│   └── ci-impact.*
└── docs/
```

每个产品继续拥有独立的：

- 版本和产品标签；
- 包名、二进制名、Bundle ID 和数据目录；
- 签名/公证凭据和更新密钥；
- 更新 Feed、渠道和制品；
- 构建、测试、打包和发布命令；
- 源码切换、发布权恢复和客户端恢复方案。

根工具只计算影响范围、调用产品本地命令和汇总证据，不能把三产品变成共同版本或同步发布列车。Zipper 不转换为 Tauri。

共享代码准入需要：至少两个真实消费者、产品中立语义、明确负责人、独立测试、稳定接口、消费者清单和变更策略。Rustzen Pro 的授权策略权威仍在 Hub；Tools 只保存客户端和版本化 schema 快照。

## 6. `rustzen-hub`

Hub 保持以下职责：

- Rustzen 官网和 Rustzen Suite 产品介绍；
- Clear、Clipboard、Zipper 的独立下载入口；
- Rustzen Pro 购买、激活和授权后台；
- 产品 ID、Feature ID、授权协议和运行策略的权威定义；
- 发布元数据、下载索引和兼容性信息；
- 隐私、权限、数据路径和安全说明。

Hub 不存放产品源码，不成为桌面公共运行时，不要求三产品同步发布。

## 7. Rustzen Pro 契约

授权使用稳定的 `product_id`、`feature_id`、`contract_version` 和 `policy_version`。每产品版本必须引用一份 Hub 中已批准的 Entitlement Runtime Policy，明确：

- 离线宽限时长和时钟容忍度；
- 缓存签名、验证、过期和损坏行为；
- 宽限期后、撤销后和协议不兼容时的付费能力行为；
- 用户数据的读取、导出和删除规则；
- 激活、刷新、后端故障和恢复行为；
- 客户端与后端支持的协议范围。

基本保证：后端故障不能破坏本地免费能力和用户数据；未知 Feature 默认锁定；付费状态失效不能删除用户自有数据；不要求持续联网；不要求三产品共同发版。

## 8. 实施阶段

### Phase 0：只读清单

- 记录 Admin、Core、Clear、Clipboard、Zipper 的分支、HEAD、upstream 和工作区状态；
- 列出 Core 的全部真实消费者；
- 列出旧 Inspect、Analytics、Report 的真实来源、入口、契约、数据表、任务和页面；
- 对三个旧模块逐项标记“保留核心、由 Admin 复用、删除、不迁移、尚未验证”；
- 标记 Admin 当前未提交文件为 `related-existing`、`unrelated-existing` 或 `unknown`；
- 建立三个产品的身份、构建、签名、更新和发布清单；
- 记录最近 30 天维护、CI 和发布基线。

通过条件：所有删除与迁移对象有明确所有者、来源 SHA 和验证命令。未知项未关闭时不得进入写操作。

### Phase 1：Admin 接入边界固化

在独立任务分支或临时 worktree 中执行，不能覆盖当前 `feat/shadcn-admin-rebuild` 的未提交工作。Admin 现有功能不是本阶段删除目标。

顺序：

1. 冻结 Admin 现有功能回归清单；
2. 为三个接入模块分别批准最小能力、接口、权限、数据库和页面清单；
3. 将 Admin 所需 Core 能力并入 Admin；
4. 先定义 Admin 与三个 Worker 的 IPC、认证、超时和健康契约，再增加最小列表/详情 UI；
5. 明确拒绝旧模块中重复的认证、系统管理、查询和展示代码；
6. 更新 manifest、模块导出、命令、CI、架构文档和 README；
7. 执行 Admin 原有功能回归及三个模块各自的核心闭环和进程故障注入验证。

验收：Admin 原有回归通过；三个模块只出现已批准的核心接口、数据和页面；任一 Worker 被终止时 Admin 与另外两个模块继续可用；旧系统重复基础设施及未批准查询/展示引用为零。

拒绝条件：Admin 现有模块被误删、三个模块整体搬迁、重复认证/系统管理被引入、模块逻辑以内嵌线程运行、共享数据库形成故障域、模块故障阻断 Admin、数据库无法从空状态创建、未提交工作被覆盖。

### Phase 2：Tools 一次性 PoC

需要单独授权。只在可删除的私有测试仓库导入 Clipboard，证明历史映射、独立构建、CI 影响图和非生产发布演练；不修改原仓库权威。

通过后按 Clipboard → Zipper → Clear 分别迁移。Clear 当前工作区和 upstream 问题解决前不得进入源码导入。

### Phase 3：逐产品源码与发布切换

每产品分别经历：影子导入 → 构建等价 → 发布演练 → 单一源码权威 → 旧发布镜像或短暂停发 → 单一发布权威 → 旧仓库只读。

源码权和发布权分别批准；任何时刻不能有两个人工可写源码权威或两个生产发布者。一个产品失败不回退其他已验证产品。

### Phase 4：旧仓库处理

当 Admin 已脱离 Core、三产品完成各自迁移、所有外部链接/Release/资产有保留方案后，再逐仓库决定只读、归档或删除。每个仓库单独授权，默认只读优先于删除。

## 9. 验证矩阵

Admin：

- 空数据库启动和迁移；
- 登录成功/失败、JWT 过期、允许/拒绝权限；
- 当前用户以及现有 Admin 页面回归；
- Rust 单测、前端 lint/typecheck/build；
- 部署脚本与服务配置；
- Monitor：Controller/Agent 双模式、Agent-only 制品、心跳、最新指标、离线判定、原子升级/恢复、保留清理和最小列表/详情；
- Insights：事件写入、白名单、PV/UV/API 聚合、时间范围和清理；
- Reports：模板、手动生成、状态流转、文件下载和过期清理；
- 权限：`owner`、`admin`、`viewer` 默认映射以及每条后端路由的允许/拒绝测试；
- 隔离：分别终止 Monitor Controller、Insights Worker、Reports Worker，验证 Admin 登录、健康页和其他两个模块不受影响；
- 数据：四个数据库独立迁移、独立备份、独立损坏演练，不允许跨库直接写入；
- 恢复：Supervisor 退避重启、连续失败熔断和人工恢复流程；
- 更新：单包上传、签名校验、Stage 不影响当前版本、四进程滚动重启、Admin 最后重启、Release ID 收敛；
- 更新故障：分别在 Monitor、Insight、Report、Admin 健康门禁注入失败，验证停止后续步骤、`bin/rz` 链接恢复、已升级进程回滚和数据库恢复；
- 更新中断：在切换链接、任一进程重启和 Admin 自身重启时终止 Update Worker 或重启机器，验证状态机可恢复且不会出现双 Current；
- Agent：按架构选择制品、Canary、哈希校验、原子替换、失败回滚和分批限流；
- `rustzen-core`、`rz-core`、重复系统管理和未批准旧模块引用搜索为零。

Tools：

- 每产品从干净环境独立安装、构建、测试和打包；
- 产品本地变更不运行其他产品发布流程；
- shared 变更验证全部消费者；未知路径运行完整矩阵；
- 旧安装升级、新版本读取原数据、Feed 和包 URL 兼容；
- 生产签名与更新凭据按产品隔离；
- Rustzen Pro 离线、超时、过期、撤销、未知 Feature 和协议边界测试。

Hub：

- 授权协议和 Runtime Policy 有版本与兼容范围；
- 下载入口指向各产品独立制品；
- 后端故障不锁死免费能力或用户数据；
- 公开页面不出现内部仓库名或已取消产品规划。

## 10. 明确不做

- 不创建 Desktop Template 或新的 Core 仓库。
- 不把 Launcher 加入 Suite 或 Tools。
- 不接入 Video，不把旧 Analytics、Inspect、Report 整体迁入 Admin。
- 不删除 Admin 自身现有 Dashboard、Deploy、Dict、Task、Log、Menu、User、Role、Status；是否精简它们属于另一项决策。
- 不迁入三个旧系统重复的认证、用户、角色、菜单、字典、任务、日志、部署和复杂 Dashboard。
- 不把三个模块编译进 Admin 主进程，不让它们共享一个 SQLite 文件或形成同步调用链。
- 不把三个产品合成一个应用、安装器、版本或发布流程。
- 不因进入 Monorepo 就统一锁文件或 Workspace。
- 不在未保护当前脏工作区的情况下删除 Admin 代码。
- 不自动删除或归档任何现有仓库。

## 11. 当前授权边界

本方案确认架构和删除目标，但不自动授权仓库级写操作。

当前可执行的是只读 Phase 0 和方案维护。以下均需单独明确授权：

- 实际删除 Admin 模块、迁移 Core 代码或数据库迁移；
- 创建 `rustzen-tools` 或复制产品历史；
- 切换源码或发布权威；
- 修改 OIDC、签名、更新 Feed、注册表和凭据；
- 归档或删除 Core、Launcher、旧 Analytics、Inspect、Report 及产品旧仓库。
