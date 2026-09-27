# AABP 信任分级（Trust Levels）

> 以“相对开放、尽量安全”为目标改良的三级模型：默认拒绝、最小权限、渐进开放、用户知情、管理员裁决、不可自提权、可审计可撤销。

## 1. 设计原则

| 原则 | 含义 | 对标 |
|---|---|---|
| 默认拒绝 | 未声明即无权；WASM 沙箱无环境授权（ambient authority） | Deno、WASI |
| 最小权限 + 层级 scope | 权限写成 `域:动作` 层级（如 `notes:read`），只申请用到的 | Mastodon OAuth scopes |
| 渐进开放 | L1 可经审核晋升 L2/L3，而非永远锁死；升级要重新 consent + 重签发 | Snap store 审核、Flathub 权限要求 |
| 动态授权 | 运行时的单次敏感操作由核心代为弹窗确认，记入授权库，可撤销 | Flatpak Portals |
| deny 优先 | allow 与 deny 冲突时 deny 生效 | Deno `--deny-*` |
| 不可自提权 | App 代码运行时永远无法给自己加权，只能用户/管理员在外部收窄或放宽 | Deno |
| 分环境 | dev 环境用假服务 + 拒绝日志（devmode 式），prod 环境 strict | Snap devmode |
| 可审计可撤销 | 每次授权留痕；`verse app disable` 即 kill-switch | — |

## 2. 三级定义

| | L1 沙箱环境 | L2 SQL 交互 | L3 全局交互 |
|---|---|---|---|
| 适用 | 纯展示/小工具 | 需要持久化的 App | 深度集成 |
| 与核心交互 | 仅定向：Bridge 受限调用 + 事件订阅 | 同 L1（仍须配置声明） | 完整交互 |
| 数据 | 无 DB | 拥有**按命名空间隔离的 App SQLite 库**，App 对自库全局，库与核心库物理隔离 | 同 L2 + 经审批的核心数据域 |
| 网络/FS/时钟 | 全禁（除 IDL 显式授予） | 同 L1 | 按审批授予 |
| 用户 consent | 安装时确认权限清单 | 安装时确认 + SQLite 命名空间告知 | 安装时确认 + 显式风险警告 |
| 审批 | 自动（签名有效即行） | 自动（签名有效即行） | **实例管理员批准** |

## 3. manifest 声明

```json
"trust": {
  "level": "sandbox | sql | global",
  "permissions": ["notes:read", "drive:write"],
  "deny": ["profile:write"],
  "justification": "为什么需要这些权限（展示给用户与管理员）"
}
```

- `level` 必填；`permissions` 为层级 scope；`deny` 显式黑名单（deny 恒优先）。
- L2 的 SQLite 命名空间由 Bridge 按 `app id` 自动派生，App 不可自选路径（防越界）。
- 官方嵌入开发的插件/App **无一例外 L3**，但同样要在 manifest 中声明（可审计，而非免检）。

## 4. 动态授权（开放性的关键）

- L1/L2 的 App 在安装清单之外，偶发需要一次敏感操作时，**不直接放行**：由核心弹出受信 UI（App 碰不到的界面）请用户确认，单次有效并记入授权库。
- 用户可在设置中查看/撤销任何动态授权；撤销即时生效（对应 Flatpak Permission Store 语义）。
- 动态授权永远**不能突破本级天花板**（L1 动态授权也拿不到 DB），升级必须走第 5 节流程。

## 5. 晋升与降级

```
L1 --申请--> L2/L3：补 justification → 签名复核 → 管理员批准 → 重签发 manifest → 用户重新 consent
L3 --违规/过期--> 降级/隔离：Bridge 拒调 + 事件退订 + verse app disable
```

- 晋升是**换发授权**，不是运行时自升级（不可自提权）。
- L3 授权建议带有效期与定期复核；高危 scope 收紧时触发重新 consent。

## 6. 分环境：dev vs prod

| | dev（调试） | prod（生产） |
|---|---|---|
| L1/L2 | 真 Bridge + 真自库 | 同左 |
| L3（非管理员开发者） | **容器化假服务**：服务端按其交互代码选择并启动对应 mock，替代真实核心依赖；拒绝走 devmode 式**日志而非静默失败**，帮开发者补齐声明 | 不适用 |
| L3（管理员/官方） | 真核心（本地） | 真核心 strict |

- 远期以本地化 Asagity App SDK 替代“容器化假服务”的适配成本（见 `decisions.md` 待决事项）。

## 7. 审计与撤销

- 授权事件（授予/拒绝/动态确认/撤销/晋升/降级）全部进审计日志，关联 `app id + 版本 + 授权人`。
- `verse app disable <name>` 为 kill-switch：停沙箱实例、断 Bridge、保留数据快照以备取证。
- 审计日志对实例管理员可查；用户可查与自己相关的 consent 记录。

## 8. 与其他文档的关系

- 包格式与签名：[`../file-format/aap.md`](../file-format/aap.md)
- 能力原语与 IDL：`spec.md`（待写）；权限语义细则：`permissions.md`（待写）
- 生命周期与 `verse app` 对接：`lifecycle.md`（待写）；前端隔离：`frontend.md`（待写）
- 基线决策：`decisions.md`（决策 4，已按本文修订）

## 参考

- Extism plug-in system：https://extism.org/docs/concepts/plug-in-system/
- wazero docs：https://wazero.io/docs/
- MCP architecture：https://modelcontextprotocol.io/specification/draft/architecture
- Chrome 扩展权限声明：https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- Flatpak 沙箱权限与 Portals：https://docs.flatpak.org/en/latest/sandbox-permissions.html
- Snap confinement（strict/classic/devmode）：https://snapcraft.io/docs/explanation/security/snap-confinement
- Deno 安全与权限：https://docs.deno.com/runtime/fundamentals/security
- Mastodon OAuth scopes：https://docs.joinmastodon.org/api/oauth-scopes
