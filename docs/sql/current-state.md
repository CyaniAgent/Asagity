# 现状盘点（代码实测，2026-10）

## PostgreSQL（GORM）

- 6 个 model 文件：`auth / instance / user / drive / note / follow`。
- 联邦异构数据重度依赖 JSONB；关系完整性、备份生态是基本盘。

## Redis（go-redis），实际只用三处

| 用途 | 状态 |
|---|---|
| cache 层（`cache/redis.go`，lite 下有内存 fallback） | 在用 |
| EventBus 跨实例 Pub/Sub（`event/bridge.go`，单 channel） | 在用，杀鸡级 |
| Asynq 队列（`queue.go`，note service 传 `nil`） | **休眠中** |

## Bleve（`platform/search`）

- 笔记全文检索，CJK/拼音是已验证资产；嵌入式，零运维。

## C# 侧

- 无 EF / Dapper / Npgsql，零数据库访问。迁移只动 Go。

## 许可背景

- Redis 7.4 起转 RSAL/SSPL（8.x 补 AGPLv3 选项）；AGPL 项目继续用别扭。
- 这是换血派生的直接动因，而非性能。
