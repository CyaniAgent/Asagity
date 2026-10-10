# Asagity 数据库方案（docs/sql）

> 本目录沉淀数据库选型思路：现状盘点 → 候选评估 → 目标架构 → 迁移路线。
> 适用后端：Go 核心 + C# 插件/API（C# 侧经查**零数据库访问**，迁移只动 Go）。

## 一句话结论

**PG 留守 + Redis 换血**：`PostgreSQL (+ pgvector + CJK 分词) + Valkey + River + 自研混合检索层`。
SurrealDB 可行但附条件（BSL 许可待过会）；Chroma 现阶段不引入。

## 文档索引

| 文档 | 内容 |
|---|---|
| `current-state.md` | 现状盘点：PG / Redis / Bleve / Asynq 的真实用法（代码实测） |
| `options.md` | 候选评估：SurrealDB、Chroma、Valkey、NATS、pgvector、River + 明确不纳入项 |
| `target-architecture.md` | 目标公式、数据流向、三块硬骨头（pgvector 优化储备、CJK、embedding 管线） |
| `migration.md` | 迁移排序：今天就能做 / 小迭代 / 大动作 + 待拍板事项 |

## 术语

- **向量腿**：语义检索路径（pgvector）；**关键词腿**：精确检索路径（PG FTS / Bleve）。
- **RRF**：Reciprocal Rank Fusion，两腿结果融合算法。
- **embedding 管线**：文本→向量模型的异步生产链路（River 驱动）。
