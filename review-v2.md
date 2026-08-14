# ChatGPT Pro 三轮独立审查记录（v2）

日期：2026-07-13
审查会话：ChatGPT AI Review Project，对话 ID 末尾 `6f0c`
输入包 SHA-256：`cd3a1a7ae7d96f196d2bab9b904b14f4a0c98705aae926a24696d2b0079a3d69`
最终 RFC SHA-256：`f04dde34dd478820863f4ca59bd0df06622655ff3cb34acfc952d3b57a1909d0`（第三轮整改后）

## Round 1：命名与产品边界

外部判定：`needs changes`。

采纳结论：

- 私有源码仓库使用 `rustzen-tools`，但不得成为对外品牌或通用杂物仓库。
- 对外产品家族使用 Rustzen Suite；商业权益称 Rustzen Pro plan/entitlement。
- 裸名 `rustzen-desktop` 有产品/运行时歧义，改为 `rustzen-desktop-template`。
- 模板新建新历史，不把 `rustzen-launcher` 重命名或复制为模板。
- Launcher 保持独立原型，不加入本次 Suite 或迁移范围。

## Round 2：架构与迁移压力测试

外部判定：`needs changes`；无 P0。

采纳结论：

- `rustzen-tools` 第一阶段采用联邦式 Monorepo，不统一 Cargo/npm Workspace 或锁文件。
- 使用 `products/` 容纳 Tauri 与 CLI/npm 异构产品；Zipper 不转换为 Tauri。
- 为每个产品分别维护源码权与发布权状态机，Clipboard → Zipper → Clear 逐个推进。
- CI 使用声明式影响图和始终存在的聚合检查，未知路径 fail closed。
- 区分源码回退、发布权恢复、停止分发和客户端恢复。
- Rustzen Pro 增加离线、故障、撤销、版本范围与数据保护矩阵。
- 公开模板采用公开来源创建，私有产品和 Launcher 均不是输入。
- Clear 的未提交改动与失效 upstream 在可复现来源建立前阻断迁移。

## Round 3：完整 RFC 终审

外部判定：`needs changes`；无 P0。第三轮完成后不再追加外部轮次，Codex 逐项整改。

强制项及本地修正：

1. G4 后旧发布流程与旧仓库只读冲突：新增 `LEGACY_RELEASE_MIRROR`、`LEGACY_PUBLISHER_DISABLED`，要求停发或确定性单向镜像，完整只读延后到 G5。
2. Rustzen Pro 有“按策略”等占位语义：新增版本化 Entitlement Runtime Policy 必填字段、每产品引用条件和完整协议边界矩阵。
3. RFC 批准可能被解释为授权创建 PoC：第 12 节拆成只读 Phase A 与逐项单独授权 Phase B；G1、G4、模板创建/公开均显式要求授权。
4. G3 可能修改生产 OIDC、Feed 或凭据且无法仅靠删 Workflow 回滚：默认隔离测试环境，生产配置需单独授权，并记录外部系统前后状态与恢复验证。
5. 首个产品无法先证明三产品 30% 收益：G6 拆为 Clipboard 试点、双产品架构和最终组合三阶段。
6. 指标公式不可复现：新增 measurement registry、固定 runner/工具链/缓存、至少五次 median/p95、零基线与人工指标规则。
7. 历史映射只定义单向：补充 commit/tree/subtree、工具版本、参数和记录哈希，并要求双向查询与树等价验证。
8. 模板自身许可证与公开动作没有正式门禁：增加许可证、版权、NOTICE、贡献政策、公开可见性和发布动作的单独批准。

## 最终本地结论

命名方案可用，架构方向可执行，但仍是“候选 RFC”，不是迁移授权。可立即进行的只有只读清单、基线和文档草案；创建仓库、复制源码、切换权威、修改发布/凭据、公开模板和归档旧仓库均需逐项授权。

本次未创建正式仓库、未移动源码、未改发布配置、未提交或推送。现有工作区改动保持原样。
