# AABP 基线决策记录

> 日期：2026-09-25。规划前调研 + 六问确认的结果，锁定后不再反复。

## 决策

1. **对标形态 = Extism/WASM 式**：宿主定义接口，App 侧任意语言编译接入。
2. **后端隔离 = WASM 沙箱优先**：wazero（纯 Go、无 CGO），deny-by-default，能力按实例授予。
3. **Bridge 通信 = 统一 IDL + 传输无关**：一份接口定义（WIT 风格），WASM 走 host function，将来 sidecar 走 Unix socket/gRPC。
4. **信任分级 = 三级**（2026-09-25 修订，原两级方案作废）：
   - **L1 沙箱环境**：仅通过权限等配置与核心**定向交互**（Bridge 受限调用 + 事件订阅，无 DB）。
   - **L2 SQL 交互**：App 需要 SQLite 时选用；App 与核心仍定向交互（配置声明），App 对**自己的 App SQLite 数据库全局交互**（该库与核心库物理隔离、按 App 命名空间切分）。
   - **L3 全局交互**：与核心、App SQLite 数据库完整交互。
   - 分级由插件开发者在 `manifest.json` 中声明（`trust.level: sandbox | sql | global`，拟定，`trust.md` 定稿）。
   - 非实例管理员的开发者选 L3 并调试时，服务端按其写入的交互代码**选择并启动相应的假服务**（容器化 mock，替代真实核心依赖）；远期以本地化 Asagity App SDK 适配该环境。
   - 官方嵌入开发的插件/App **无一例外 L3**。
5. **前端隔离 = iframe sandbox + postMessage Bridge**：与后端隔离模型对称。现行 `aap.md` 的全局注册（组件/路由/store）仅保留给官方。
6. **命名 = AABP（规范）+ App Bridge Service（运行时）**：`AABS` 不用（名实错位：规范不是 Service）。

## 调研依据

- Extism / WASM Components + WIT：语言无关插件 + 默认沙箱 + 接口先行。
- wazero + WASI 2.0：capability-based，无 ambient authority；wazero 可直接嵌入 verse-engine。
- HashiCorp go-plugin：进程隔离的参照系（崩溃隔离），暂不采用，留作重 App 二期选项。
- Chrome MV3：manifest 声明权限 + 最小权限 + 安装时 consent + sandboxed pages。
- MCP：Host/Client/Server 三分 + 能力协商 + JSON-RPC 传输无关（Bridge 的形状参考）。

## 待决事项（规划阶段解决）

- IDL 具体语法：WIT vs protobuf（二选一）。
- 能力原语清单：tools / resources / events 是否够用。
- 签名基础设施：官方签名密钥管理与验证链。
- `manifest.json` 需新增字段：`bridge`（IDL 版本/能力声明）、`sandbox`（WASM target、授权上限）、`trust.level`（sandbox | sql | global，见决策 4）。
- 非管理员开发者 L3 调试用的假服务：按交互代码选择并启动容器化 mock 的规则与目录约定。
