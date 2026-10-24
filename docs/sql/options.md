# 候选评估

## 采用

### Valkey（替 Redis，零成本）
- Linux 基金会 BSD fork，协议兼容至 Redis 7.2，主流发行版已默认替换。
- 迁移 = 改一行 compose；Go `go-redis` 直连无感，C# 无影响。
- 结论：**今天就能做**。

### River（替 Asynq，PG 原生 Go 任务队列）
- enqueue 可与业务写**同事务**（原子性是 Asynq 给不了的），自带管理 UI。
- 关键加分：同样支持 **SQLite**，与 Developing Lite 模式咬合，lite 下队列也不需外部服务。
- Asynq 休眠（传 `nil`）正是零包袱窗口期；复活 Asynq 反而会被锁死在 Redis 上。
- 在新架构中定位：**向量管线的发动机**（`note.created → job → embedding → pgvector`），而非向量插件。

### pgvector（向量腿，不建新库）
- HNSW 生产级（50M 以下无压力），0.7+ 有 halfvec/bit 做 binary quantization。
- 联邦单实例量级下**裸上即可**，优化（量化/分区/加内存）记入 backlog，不提前还债。
- 注意：`vector` 类型 HNSW 有 2000 维上限，超维用 halfvec；HNSW 构建慢且吃 RAM。

## 有条件可行

### SurrealDB（替 PG 的激进选项）
- 契合点：文档 + 图 + 全文 + 向量 + 时序单引擎；联邦 JSON 与图谱是其强项；Go / .NET 均有官方 SDK；Live Queries 可替代 EventBridge。
- 成本：重写整个 repository 层（无 GORM 等价物）+ SurrealQL 学习；1.x→2.x→3.x 版本 churn 快，服务端与 SDK 版本必须卡矩阵；多节点 HA 需实测再承诺；C# 实体要继承 `Record` 基类（保持 C# 不直连 DB 即可规避）。
- **许可**：引擎 BSL 1.1（source-available，自托管可用，禁转售 DBaaS；SDK 为 Apache 2.0）。AGPL 项目可用，但属意识形态决策，需过会。
- 结论：技术成立，BSL 过会 + 有人力时才动。

## 不引入

### Chroma
- 自托管单节点无 HA；sparse/hybrid 检索系 Cloud-only（open-core 争议）；Go/C# 客户端为社区维护。
- 致命项：向量来源（embedding 管线）本来就要自建；需求既已存在，SurrealDB 原生向量或 pgvector 任选其一即可，**不值得为它单建一个有状态服务**。

### NATS（备选，不立项）
- 一个二进制可吃 cache（KV）+ EventBridge（Core NATS）+ queue（JetStream），Go/.NET 均为一等客户端。
- 但当前 EventBridge 只是单 channel pub/sub，属杀鸡；queue 已有 River 方案。结论：多实例/边缘部署真立项时再换。

### CockroachDB / YugabyteDB
- 联邦单实例扛不起分布式 SQL 的运维重量，不匹配。

## 参考

- SurrealDB 3.1（DiskANN / 成熟度）：https://surrealdb.com/3.1
- SurrealDB .NET SDK（兼容矩阵 v2.0.0–v3.2.1）：https://surrealdb.com/docs/reference/dotnet
- SurrealDB 许可：https://surrealdb.com/license（BSL 1.1）
- Valkey / Redis 许可 fork 背景：Redis 7.4 RSAL/SSPL，Valkey 为 Linux 基金会 BSD fork
- River：https://riverqueue.com/（PG + SQLite 双后端）
- pgvector：https://github.com/pgvector/pgvector（HNSW，0.7+ halfvec/bit 量化）
- Chroma 自托管短板与 Cloud-only 争议：单节点无 HA，sparse/hybrid 仅 Cloud 可用
