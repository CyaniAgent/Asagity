# 迁移路线

## 今天就能做

- `docker-compose.yaml` 中 `redis:` → `valkey/valkey`。Go `go-redis` 直连无感，C# 无影响。

## 小迭代

1. `queue/` 包 Asynq → River，顺手解掉 note service 里那个 `nil`。
2. 自研检索层架子：双腿接口 + RRF 融合 + scope 前置过滤（关键词腿暂接 Bleve）。
3. 关键词腿迁 PG FTS（`zhparser` / `pg_jieba` 二选一，先 spike）。

## 大动作（立项制）

- pgvector 列 + 回填链路（River job 驱动）。
- embedding 模型与推理位置定稿后，语义腿开工。
- SurrealDB：仅当 BSL 过会且有人力时启动（先 spike：CRUD + Live Query + 向量索引 + .NET 连通冒烟）。

## 待拍板

1. BSL 许可是否可接受？（唯一不可逆决策）
2. Asynq 是否彻底退役给 River？
3. NATS 是否立项二期（还是永远备选）？
4. embedding 模型与推理位置。
