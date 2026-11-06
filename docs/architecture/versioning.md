# 版本号治理方案（Versioning）

> 状态：**Dev 双层版本（真版本号 ↔ 解释性语义化展示）已落地（§4.1–§4.2）；
> `/VERSION` 发版事实源（方案 A）与命名 `Q4` vs `S4` 待拍板（§5）**
> 分析/实施日期：2026-11-07 · 范围：全仓版本号读写链路（Go / C# / web / 构建与发布）

## 1. 结论（TL;DR）

1. **现状确实严重不统一**：全仓 **7 个版本消费点、0 个写入点**——包括生产
   docker 在内，所有环境公开展示的都是缺省值 `"Ver. Dev"`，季度制版本体系
   （`v2026.Q4[-dev.N+sha]`）设计完整但没有任何载体能产出它。
2. **双层版本模型（§4.1，已落地）**：机器链路只认**真版本号**——Dev 由
   `scripts/version.sh` 从 git 派生 `{年份}.{commit 总数}+{短哈希}`
   （如 `2026.193+da1b434a`），经 `APP_VERSION` 注入各环节；前端只做
   **解释性语义化**转换——展示为 `Ver. 2026 Build 193 (da1b434a)`。
   Stable 走方案 A 的 `/VERSION` 事实源（待落地）。
3. **命名争议（§5）**：正式版固定季末发布（3/6/9/12 月），首发 2026 年
   12 月——写 `Ver. 2026.Q4` 还是 `Ver. 2026.S4`？复核后**维持推荐 Q4**：
   12 月仍在 Q4 区间内，季末节奏对 Q/S 影响完全等价，日期客观决定版本、
   迁移成本为零、无歧义；S 赛季叙事保留在主题命名层（「2026.Q4 赛季」
   混用已自然成立）。唯一需要先拍板的是标签语义（发布时点 vs 服役期，
   §5.1）。

## 2. 现状分析

> ⚠️ 本章为 **2026-11-07 实施前的基线快照**：§2.2 的「写入方 = 0」已由
> §4.2 注入链修复（versetool / CI / compose / `.env.example` 均已写入）。

### 2.1 消费点（7 处）

| # | 位置 | 读取方式 | 缺省值 |
|---|---|---|---|
| 1 | Go `config.go` `envOrDefault("APP_VERSION", "dev")` | env | `"dev"` |
| 2 | C# `InstanceService.cs` | `configuration["APP_VERSION"]` | `"dev"` |
| 3 | C# `ShellModule.cs` | `Environment.GetEnvironmentVariable` | `"dev"` |
| 4 | 前端 `fetchAppVersion()`（ClientLayout 启动时） | GET `/api/meta/version` | — |
| 5 | 前端 `useInstanceMeta`（Welcome / Termity） | GET `/api/meta/version`（**第二条获取路径**） | — |
| 6 | 前端 `stores/instance.ts` 初始值 | 硬编码 | `"Ver. 2026.Q4.Dev"` |
| 7 | `internal/mock/mock.go` | 字面量 | `"mock"` |

### 2.2 写入方 = 0（证据）

| 应该注入的地方 | 实际 |
|---|---|
| `.env.example` | 无 `APP_VERSION` |
| `container/docker/docker-compose.yaml` | 无 |
| `.github/workflows/ci.yml`（7 个 job） | 无 |
| versetool `Spawn` 注入 | 只有 `ASAGITY_MODE` / `SERVER_PORT` / `LITE_SQLITE_PATH` |
| Dockerfile | 无 |
| git tag | **全仓 0 个 tag** |
| `VERSION` 文件 | 不存在 |
| `web/package.json` `"version": "0.1.0"` | 孤儿字段，全前端无人引用 |

### 2.3 不统一点（5 项）

1. **公开展示恒为 `"Ver. Dev"`**：`APP_VERSION` 无人设置，缺省 `"dev"` 贯穿
   开发与生产；`version.ts` 注释里设计完整的 `v2026.Q4-dev.255+1a2b3c4d`
   格式没有任何链路能产出。
2. **同一应用四个版本身份互相矛盾**：`package.json` 说 `0.1.0`、前端 store
   预设说 `2026.Q4.Dev`、测试 fixture 说 `v2026.Q4`、运行时实际输出 `dev`。
3. **前端缺省值三处各不相同**：instance store `"Ver. 2026.Q4.Dev"` /
   SystemInfo 兜底 `"Ver. Dev"` / 后端 mock `"mock"`——拉取失败时不同角落
   显示不同版本（`useInstanceMeta.ts` 注释已记载「两处写入赛跑导致裸 tag
   闪现」的实际 bug，证明分裂正在造成伤害）。
4. **SystemInfo 的 Go/.NET 双卡片走两条链路**：`/api/meta/version` vs
   `/api-net/meta/version`，且 C# 内部两种读取机制（IConfiguration vs 裸
   环境变量）——配置提供器与 shell 环境不同步时两卡片显示不同版本。
5. **`package.json` 的 `0.1.0` 与季度制体系完全脱节**，且无人消费，纯误导。

## 3. 方案对比

| | 方案 A：`VERSION` 文件（**推荐**） | 方案 B：`git describe --tags` | 方案 C：Go 常量 + codegen |
|---|---|---|---|
| 事实源 | 根目录 `/VERSION` 单文件 | git tag 历史 | `version.go` 常量 |
| 无 `.git` 场景（源码包 / docker context） | ✅ 天然支持 | ❌ 需 fallback（fallback 一多即回到现状） | ✅ |
| 跨语言分发 | 一行文本，各链路直接读 | 需 shell/CI 包装 | 需生成与同步链路 |
| 版本变更留痕 | ✅ git diff 可评审 | ✅ tag | ✅ |
| 现状成本 | 新建 1 文件 + 注入链 | 需先建立 0 → N 的 tag 体系 | codegen 成本高，web 需构建期外带 |
| 结论 | **采用** | 作为辅助（build metadata `+sha`） | 不采用 |

**推荐 A 为主、B 为辅**：`VERSION` 是唯一权威；versetool/CI 注入时若在 git
仓库则附加 `+<sha>` build metadata（正好命中 `version.ts` 现成的
`dev.N+sha` 解析分支）；发版 checklist 或 CI job 校验 `VERSION` ↔ git tag
一致。

## 4. 方案 A 实施设计

### 4.1 双层版本模型：真版本号 ↔ 解释性展示

**原则**：机器链路（`APP_VERSION` env → `/api/meta/version` → 日志 / tag）
只认**真版本号**（客观、可机读、单一生成器）；用户界面只展示**解释性语义化**
（单一转换入口 `web/src/lib/version.ts`）。两层之间禁止旁路——任何组件不得
自行拼接版本展示字符串。

| 层 | 格式 | 示例 |
|---|---|---|
| 真版本号 · Dev（git 派生） | `{年份}.{CI 提取的 commit 总数}+{短哈希}` | `2026.193+da1b434a` |
| 真版本号 · Stable（发版冻结） | `/VERSION` 文件（方案 A，待落地） | `2026.Q4.1` |
| 展示 · Dev（解释性语义化） | `Ver. {年份} Build {总数} ({短哈希})` | `Ver. 2026 Build 193 (da1b434a)` |
| 展示 · Stable | `Ver. ` + 真版本号 | `Ver. 2026.Q4.1` |

**Dev 真版本号生成器 `scripts/version.sh`**（versetool `runner.appVersion()`
为同优先级的 Go 镜像实现），优先级从高到低：

1. `APP_VERSION` 环境变量——显式覆盖（发版 / CI 注入）
2. `/VERSION` 文件——方案 A 事实源（文件存在时生效，当前跳过）
3. git 派生——`{UTC 年份}` + `git rev-list --count HEAD` +
   `git rev-parse --short=8 HEAD`
4. 兜底 `dev`——前端展示 `Ver. Dev`

**年份取构建时 UTC 年**（发布时点语义，§5.1）；`+{哈希}` 为 semver 的
build metadata 段。历史记法 `v2026.Q4-dev.N+sha` 的解析分支保留（旧 tag
不迁移），新旧并行。

> 转换链路：`scripts/version.sh` → `APP_VERSION` → 后端
> `/api/meta/version` 原样返回真版本号 → `formatVersionDisplay()` →
> instance store → 欢迎面板 / SystemInfo 显示
> `Ver. 2026 Build 193 (da1b434a)`。

### 4.2 注入链（✅ = 2026-11-07 已实现）

| 环节 | 做法 | 状态 |
|---|---|---|
| 生成器 | `scripts/version.sh`（env > `/VERSION` > git 派生 > `dev`） | ✅ |
| versetool | `runner.appVersion()` 镜像同优先级，**engine 与 api 两个 Spawn 均注入** `APP_VERSION` | ✅ |
| CI | `version` job（`fetch-depth: 0`，commit 总数需完整历史）跑生成器 → job output + step summary，供 release/artifact 消费 | ✅ |
| docker-compose | `APP_VERSION: ${APP_VERSION:-dev}`；`.env` 可写 `scripts/version.sh` 输出 | ✅ |
| `.env.example` | 注释说明与可选手动覆盖示例 | ✅ |
| web | 无需构建期注入——运行时 fetch `/api/meta/version` 后经 `formatVersionDisplay()` 转换 | ✅ |
| C# | 经 spawn env `APP_VERSION`（`IConfiguration` 与裸 env 同源） | ✅ |
| Dockerfile build-arg | `ARG APP_VERSION`（方案 A 发版镜像） | ⏳ 方案 A |
| release tag 校验 | `VERSION` ↔ git tag ↔ README 一致（发版 checklist） | ⏳ 方案 A |

### 4.3 兼容性核验

- 季度段（`Q4` / `S4`）走 `[0-9A-Za-z.]` 字符类的既有分支——对 `Q4` /
  `S4` / 未来 `S1` 均兼容，**技术上无差别，纯命名决策**。
- Dev 计数制新分支正则 `^(\d{4})\.(\d+)\+([0-9a-fA-F]+)$` 只匹配「纯数字
  年份 + 纯数字计数 + `+哈希`」，与含字母的季度格式**无交集**
  （`2026.Q4.1` 不含 `+` 且计数段非纯数字，互不误判）——已有测试锚定。

### 4.4 一致性小项（与主方案无关也应做）

1. C# 两处读取统一为 `IConfiguration`（消掉 §2.3-4 的双机制）。
2. 前端三处缺省值收敛为单一导出常量（如 `DEFAULT_VERSION = "Ver. Dev"`）。
3. `package.json` version 由 `sync-version` 脚本同步（§4.2）。
4. `.env.example` 补 `APP_VERSION` 说明——✅ 已完成（2026-11-07，见 §4.2）。

### 4.5 迁移影响清单

`VERSION` 文件为增量；需同步改写的现有 `Q4` 资产见 §5.3 表（选 Q4 则**零
改写**）。

## 5. 命名争议：`Ver. 2026.Q4` vs `Ver. 2026.S4`

### 5.1 背景与事实核对

**发布节奏**：正式版固定在每年 **3 / 6 / 9 / 12 月**发布（季末发布，
end-of-quarter release train），首发正式版计划 2026 年 12 月。

**历法核对**——「常规 1/4/7/10 月」是季度的**起始月**，不是发布惯例；
季度是 3 个月区间，落在区间内任一时点发布都归属该季：

| 发布月 | 日历季度 | 动漫历赛季 | Q 记法 | S 记法 |
|---|---|---|---|---|
| 3 月 | Q1（1–3 月） | Winter | `2027.Q1` | `2027.S1` |
| 6 月 | Q2（4–6 月） | Spring | `2027.Q2` | `2027.S2` |
| 9 月 | Q3（7–9 月） | Summer | `2027.Q3` | `2027.S3` |
| 12 月 | **Q4（10–12 月）** | Fall | **`2026.Q4`** | **`2026.S4`** |

由此得到两个结论：

1. **12 月发布 = Q4 依然成立**：12 月在 Q4 区间内，发布月 → 季度仍是
   纯函数（3→Q1、6→Q2、9→Q3、12→Q4），§5.4 推荐理由 #1「日期自动
   定版、延期自纠错」完整保留（延期至 1 月 → 自动 `2027.Q1`）。
2. **季末发布不构成 Q vs S 的新判据**：S 记法下 12 月同样归 S4
   （Fall ≡ 10–12 月），两种记法的映射结构完全相同——发布节奏带来的
   任何观感问题（如每年 1–2 月运行中的版本仍标着上年 `Q4`/`S4`，即
   「标签滞后一个季度」）在 Q 与 S 下**等价存在**，谁也不比谁好。

**但节奏暴露了一个更早需要拍板的问题——标签语义**（与 Q/S 之争正交）：

| 语义 | 版本 = | 12 月发布的标签 | 评价 |
|---|---|---|---|
| **发布时点** | 构建/发布于何时 | `2026.Q4` | 业界主流（Ubuntu 24.04、Windows 21H2 均按发布时点命名），**本文默认采用** |
| 服役期 | 主要服役于何时 | 次年 `2027.Q1`？ | Q 与 S **都别扭**（S4 = 10–12 月同样盖不住次年 1–3 月）；若坚持此语义，该换的是整套体系而非 Q→S——例如 **CalVer** `2026.12`（发布月即版本，零滞后零歧义），需另开评审 |

本节在**发布时点语义**下讨论 Q vs S；若团队拍板改服役期语义，§5.4 的
推荐作废，转 CalVer 路线重评。

### 5.2 双方论点

**支持 `Q4`（Quarter）：**

- **日期客观决定版本**：Q4 ≡ 10–12 月，无需定义、无需开会。若发布延期到
  1 月，版本自动变为 `2027.Q1`——自纠错；S 记法届时要再议一次「算
  2026.S4 还是 2027.S1」。
- **国际零歧义**：季度记法是通用商业惯例，外部用户/合作方无需查表。
- **迁移成本为零**：全仓已有 36 处 `2026.Q4` 资产（13 个文件，见 §5.3），
  选 Q4 不动一行。
- **与既有文档混用已成立**：仓库本就写「2026.Q4 **赛季**」——Q 表版本、
  赛季表主题文化的分层表达自然共存，无需改版本号即可享受赛季叙事。

**支持 `S4`（Season）：**

- **产品文化契合**：项目身份贴近游戏/番剧文化，中文游戏受众对「S 赛季」
  （S1/S2 赛季）天然熟悉，`S4` 作为对外版本更有产品个性。
- **与主题体系同构**：主题按「赛季」轮换，版本与主题同用 S 记法可统一
  叙事。
- 技术上完全可行（§4.3 正则兼容，无任何代码障碍）。

### 5.3 两种记法的代价对比

| 维度 | `2026.Q4` | `2026.S4` |
|---|---|---|
| 现有资产 | **36 处 / 13 文件，零改写** | 0 处，需全量切换（见下） |
| 歧义风险 | 无 | **与 fix-plan 的 `Sprint` 撞名**（`tasks.md` 中 `Sprint` 出现 70 次）；外部可能读作 Sprint 4 / Service pack；需一句脚注定义「S = 与历法季度对齐的第 4 季」 |
| 日期→版本映射 | 自动、客观 | 需维护定义（S 的起点与编号规则） |
| 延期自纠错 | ✅ 自动跨年为 `2027.Q1` | ❌ 需人工裁决归属 |
| 国际受众 | 通用惯例 | 需解释 |
| 中文受众 | 通用 | 更有「赛季」亲切感 |
| 产品个性 | 中性 | 强 |

需切换的 `Q4` 资产（若选 S4，共 36 处 / 13 文件）：`version.ts` 格式文档与
注释 ×12、`version.test.ts` 断言 ×6、`stores/instance.ts` 缺省值、`useInstanceMeta`
注释、`service_test.go` fixture ×3、`theme.go` 注释、theme CSS 变量
`--season-period`、`docs/design-tokens.md` 标题、`docs/DESIGN.md` ×2、
`docs/cli/termity-base-cli.md`、`README.md` ×2、`README_CN.md` ×2、
`web/README.md`。

### 5.4 推荐：**`2026.Q4`**

决定性理由按权重排序：

1. **日期决定版本，而非产品规划决定日期**——Q 记法把「发哪天 = 哪版」
   变成恒等式，消灭一次未来必然发生的归属争议（延期场景）。
2. **零迁移成本 vs 36 处改写**：S4 的全部收益是叙事个性，全部成本是
   清点与改写 13 个文件里的 36 处资产 + 6 条测试断言。
3. **Sprint 撞名是实打实的混淆源**：本仓工程文档大量使用 Sprint 编号
   （fix-plan 52 任务分 5 个 Sprint），`S4` 在同一语境下歧义不可消除。
4. **赛季叙事不必挤进版本号**：「2026.Q4 赛季 · Yukinoshita Glacier」
   已是仓库现行表达——S 的文化诉求由**主题命名层**承载即可，版本号保持
   工具属性。

**季末发布复核（2026-11-07 补充）**：3/6/9/12 月的发布节奏经 §5.1 核对
**不改变本推荐**——12 月仍属 Q4（Q1–Q4 区间见 §5.1 表），S 记法下同样
归 S4，节奏对两种记法的影响完全等价；真正待拍板的是标签语义（发布时点
vs 服役期），本文默认发布时点语义。

若团队最终拍板要 `S4`（产品个性优先），技术无障碍，但须在**首个公开 tag
之前**完成 §5.3 的全量切换，并在 `version.ts` 文档头加一行 S 记法定义。

### 5.5 决策约束

**首个公开 tag 冻结记法**：`v2026.Q4.1` 一旦对外发布，改记法等于 fork
版本历史（旧 tag 与新 tag 断裂）。因此本节须在正式版打 tag 前拍板，
并写入发版 checklist：`VERSION` ↔ git tag ↔ README 三者一致。

## 6. 相关文档

- [scripts/version.sh](../../scripts/version.sh) — Dev 真版本号生成器（§4.1）
- [docs/design-tokens.md](../design-tokens.md) — 主题赛季制（`2026.Q4` 现行用法）
- [docs/fix-plan/tasks.md](../fix-plan/tasks.md) — Sprint 编号体系（§5.3 撞名依据）
- [web/src/lib/version.ts](../../web/src/lib/version.ts) — 版本格式解析与展示（事实上的格式规范）
- [docs/core/versetool.md](../core/versetool.md) — versetool（方案 A 的注入点之一）
