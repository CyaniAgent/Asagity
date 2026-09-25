# AABP (Asagity App Bridge Protocol)

> 第三方 App 与 Asagity 核心隔离互操作的可插拔式规范（对标 Extism/WASM 式插件体系）。

## 命名关系（必读）

| 名称 | 指代 | 说明 |
|---|---|---|
| **AABP** | 本规范 | 描述 App 与核心之间的能力模型、IDL、权限、隔离与生命周期 |
| **App Bridge Service** | 运行时实现 | verse-engine 内的宿主实现（能力注册表、网关、沙箱管理） |
| **AAP / `.aap`** | 包格式 | 第三方 App 的分发格式，见 [`../file-format/aap.md`](../file-format/aap.md) |
| **Verse.Modules** | 官方核心模块 | 随服务端编译，一律 L3 全局交互（见“三级信任”） |

## 与现有文档的关系

- 包格式与 manifest 字段：[`../file-format/aap.md`](../file-format/aap.md)（`permissions` / `injection` / `exports` / `signature` 的定义方）
- 架构位置：`core/Arch.mermaid` 的 AppEnv 子图（AppSandbox 语义由本规范细化）
- App 管理命令：`verse app list/enable/disable`（生命周期执行方）

## 规划文档清单

| 文档 | 内容 | 状态 |
|---|---|---|
| `decisions.md` | 六项基线决策与依据（本目录已落地） | ✅ |
| `spec.md` | 能力模型（tools / resources / events）、统一 IDL、传输无关映射 | 📝 待写 |
| `permissions.md` | 权限语义（Chrome MV3 式最小权限 + 安装时 consent） | 📝 待写 |
| `trust.md` | 三级信任：沙箱 / SQL / 全局 + manifest `trust.level` 声明 + 非管理员 L3 假服务规则 | 📝 待写 |
| `frontend.md` | iframe sandbox + postMessage Bridge；官方直挂为例外 | 📝 待写 |
| `lifecycle.md` | 安装/启用/禁用/更新/卸载与 `verse app` 的对接（含 L3 假服务启动） | 📝 待写 |
| `spike-wazero.md` | wazero 最小 guest 验证结论（deny-by-default + 授权作用域 + host function） | ✅ |

## 非目标（本期不做）

- 实时媒体类重 App（如示例 `asagity-livekit`）：纯 WASM 沙箱装不下，归**官方级**（直连核心），sidecar 逃生舱留待二期。
- AAP 包格式本身的重写：只修订与隔离冲突的章节（`backend/` 改 WASM target 声明，`injection` 改 iframe 挂载声明）。
