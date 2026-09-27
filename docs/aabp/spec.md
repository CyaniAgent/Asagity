# AABP 能力模型与统一 IDL（Spec）

> App 与核心之间“能调什么、怎么调、怎么传”的唯一权威定义。包格式见 `aap.md`，信任与审批见 `trust.md`。

## 1. 目标与范围

- 本规范定义：角色模型、能力原语（tools / resources / events）、接口定义语言（IDL）、内存包络与 ABI、传输映射、能力协商、版本规则、错误模型。
- 不定义：`.aap` 包格式（`../file-format/aap.md`）、信任分级与审批（`trust.md`）、前端隔离（`frontend.md`）、生命周期（`lifecycle.md`）。

## 2. 角色模型

| 角色 | 指代 | 职责 |
|---|---|---|
| Host | App Bridge Service（verse-engine 内） | 实现能力、执行 scope 检查、审计、管理沙箱实例与授权 |
| Guest | App（WASM 模块） | 声明所需能力，只经 Bridge 调用核心 |
| Sidecar（远期） | 重 App 独立进程 | 同一套 IDL，走 Unix socket / gRPC（见 §7） |

调用方向：Guest→Host 为**调用**（tools/resources）；Host→Guest 为**事件推送**（events）与错误回传。不存在 Guest 直连核心任何通道。

## 3. 能力原语

- **tools（调用）**：有副作用或需计算的操作，如 `notes.create`、`drive.upload-init`。语义：同步请求/响应，幂等键由调用方携带（`call_id`），超时由 Host 强制执行。
- **resources（读取）**：受 scope 约束的数据读取，如 `notes.get`、`profile.get`。语义：只读、无副作用、可缓存（TTL 由 Host 声明）。
- **events（订阅）**：Host 向 Guest 的单向推送，如 `note.created`、`reaction.added`。语义：at-least-once 投递、Guest 侧背压丢弃（不阻塞核心 EventBus）、退订即停。

首批核心能力目录由 Bridge Service 的能力注册表维护（随 Verse.Modules 演进），本规范只定机制；新增能力必须走“加法发布”（见 §8）。

## 4. IDL 选型决策

**决定：接口用类 WIT 风格书写语义，线上编码用 protobuf；WIT Component Model 列为远期迁移路径。**

```wit
// 语义书写示例（人类可读，不直接进工具链）
interface notes {
  // scope: notes:read
  get: func(id: string) -> result<note, aabp-error>;
  // scope: notes:write
  create: func(input: create-input) -> result<note, aabp-error>;
}
```

```proto
// 线上传输：同一语义的 protobuf 表达（sidecar / 存储 / 调试通用）
message AabpCall {
  string call_id = 1;   // 幂等键
  string target  = 2;   // "notes.get" 等能力标识
  bytes  payload = 3;   // 对应能力的 protobuf 消息
}
message AabpResult {
  string call_id = 1;
  bytes  payload = 2;   // 成功载荷
  AabpError error = 3;  // 失败时填充（见 §9）
}
```

理由：

1. Extism 官方的编码建议即“选成熟、支持广的编码 + Web 标准 IDL 描述接口”——protobuf 同时满足 sidecar gRPC 就绪与多语言 codegen。
2. Go Guest 现状：标准 Go 只能产出 wasip1 core module，WIT Component 工具链对 Go 尚不成熟；protobuf 则在 Guest/Host 两侧零障碍。
3. 远期一旦 Go 组件工具链成熟，可整体迁移到 WIT + Canonical ABI；本规范的内存包络（§5）已按 canonical 思路设计，迁移成本收敛在编解码层。

## 5. 内存包络与 ABI（WASM 传输）

spike（`spike-wazero.md`）验证过的最小约定标准化如下：

- 所有复杂参数一律序列化为 protobuf，经**线性内存**传递，签名统一为 `(ptr: u32, len: u32)`。
- 内存所有权：调用方分配、调用方释放；被调方只读。Host 提供 `aabp.free(ptr, len)`，Guest 提供对称导出（Host 回调/push 时使用）。
- Host 函数表（MVP，`aabp` 命名空间）：
  - `aabp.invoke(ptr, len) -> (u64 packed)`：统一调用入口，返回结果包络指针（高 32 位 ptr、低 32 位 len）。
  - `aabp.log(level, ptr, len)`：分级日志（进审计）。
  - `aabp.event_next(ptr, len) -> u64`：Guest 拉取事件（Host 也可经 Guest 导出的 `aabp.on_event` 主动 push，按 Guest 能力二选一）。
- 空指针/越界/超大载荷（默认上限 1MiB，可配置）一律判失败并记审计，不抛陷阱给核心。

## 6. 能力协商（握手）

实例化 Guest 前必须完成握手，任一步失败即拒绝加载并给出可读错误：

1. Guest 声明：manifest 的 `bridge.idl_version` + 所需能力清单（含 scope）。
2. Host 核算：对照 `trust.level`（L1/L2/L3 天花板）与实例策略，输出**授予清单**（只会比声明少，不会多）。
3. 版本匹配：`idl_version` 主版本必须一致；次版本向前兼容（只加不改，见 §8）。
4. 动态授权（`trust.md` §4）不改变天花板，只在天花板内做单次放行。

## 7. 传输映射

| 传输 | 适用 | 编码 | 说明 |
|---|---|---|---|
| WASM host function（§5） | 本期唯一实现 | protobuf + 内存包络 | wazero 嵌入 verse-engine |
| Unix socket / gRPC | 远期 sidecar | 同一套 protobuf（`AabpCall`/`AabpResult`） | 切换传输不换 IDL |
| HTTP 网关 | — | — | **不采用**（与“传输无关但宿主内聚”冲突，见 decisions） |

## 8. 版本与兼容

- IDL 版本 semver：`MAJOR` 破坏性变更（删能力/改语义），`MINOR` 只加能力，`PATCH` 只修文档与错误文案。
- 兼容铁律：已发布的能力**只加不改不删**；废弃走 `deprecated` 标记 + 至少一个大版本过渡期。
- Guest 声明的 `idl_version` 主版本必须等于 Host 支持的主版本，否则拒绝加载（错误码 `VERSION_MISMATCH`）。

## 9. 错误模型

```proto
enum AabpCode {
  OK = 0;
  PERMISSION_DENIED = 1;  // scope 不足 / 等级天花板 / 被动态拒绝
  NOT_FOUND = 2;
  INVALID_ARG = 3;
  VERSION_MISMATCH = 4;
  QUOTA_EXCEEDED = 5;
  UNAVAILABLE = 6;        // 能力未注册 / 依赖未就绪
  INTERNAL = 7;
}
message AabpError { AabpCode code = 1; string message = 2; string trace_id = 3; }
```

- `PERMISSION_DENIED` 必须附带缺失的 scope（帮开发者补声明，对应 Snap devmode 式“拒绝日志而非静默失败”）。
- 所有错误回传 Guest，同时进审计日志（关联 `app id + 版本 + trace_id`）。

## 10. 安全绑定（与 trust.md 的接口）

- 每次 `invoke` 前 Host 做 scope 检查：声明 ∩ 授予 ∩ 等级天花板；deny 恒优先；检查失败即 `PERMISSION_DENIED`。
- L2 的 SQLite 访问只允许命名空间内路径（Bridge 派生，App 不可见真实路径）。
- L3 非管理员调试走容器化假服务时，Bridge 注入 `env=dev-mock` 标记，能力行为与 prod 一致但数据全假（`lifecycle.md` 细化）。
- 官方 L3 同样强制声明 + 审计（可审计而非免检）。

## 与其他文档的关系

- 信任分级/审批/动态授权/审计：`trust.md`；包格式与签名：[`../file-format/aap.md`](../file-format/aap.md)
- 前端隔离：`frontend.md`（待写）；生命周期：`lifecycle.md`（待写）；验证结论：`spike-wazero.md`
- 基线决策：`decisions.md`（本文落实了其中“IDL 二选一”待决项 → protobuf，见 §4）

## 参考

- Component Model Canonical ABI：https://component-model.bytecodealliance.org/advanced/canonical-abi.html
- Extism 关于编码与 IDL 的建议：https://extism.org/blog/（"Choose a well-known encoding; web-standard IDL"）
- wit-bindgen：https://github.com/bytecodealliance/wit-bindgen
- WASI levels（wasmCloud interfaces）：https://wasmcloud.com/docs/overview/interfaces/
