# wazero Spike 验证结论

> 日期：2026-09-25。目的：在写实现计划前，验证“WASM 沙箱优先”路线在 verse-engine（Go）技术栈上是否走得通。
> Spike 代码（一次性，可复现）：`/tmp/aabp-spike/{guest,host}`（本机实验目录，未入库）。

## 环境

- Go 1.27.1（`GOOS=wasip1 GOARCH=wasm` 编译 guest）
- `github.com/tetratelabs/wazero v1.12.0`（纯 Go，无 CGO）
- guest 体积约 2.6MB（Go 编译，未优化）；host 冷启动约 1.2s（含运行时初始化，实例复用后更低）

## 实验设计

- guest 做四件事：WASI stdout 输出；调用宿主函数 `env.log(ptr, size)`；越权读 `/etc/hostname`；读环境变量。
- host 只给：stdio + `env.log` 一个函数；默认**不挂载任何 FS、不给环境变量、不给网络**。
- 对照组：`--grant-dir` 把宿主目录挂载为 guest 的 `/sandbox`，验证授权是按路径作用域生效的。

## 结果（三次运行全过）

| 断言 | deny-all | 挂载 /sandbox 后 |
|---|---|---|
| guest 正常运行，WASI stdout 可回收 | ✅ | ✅ |
| 宿主函数被调用且内存传参正确 | ✅ `"guest: hello via host function"` | ✅ |
| 越权读 `/etc/hostname` 被拒绝 | ✅ `Bad file number` | ✅ 依然拒绝 |
| 环境变量不可见 | ✅ | ✅ |
| `/sandbox/allow.txt` | ✅ 拒绝 | ✅ 可读，内容正确 |

## 结论

1. **路线成立**：wazero 可直接嵌入 verse-engine（同为 Go，无 CGO 依赖），deny-by-default 与按路径授权均符合 AABP L1 要求。
2. **Bridge 原型可用**：`env.log` 即最小 host function；`spec.md` 的 IDL 就是把这类函数系统化（tools/resources/events）。
3. **L2（SQL 交互）可行路径**：每个 App 一个命名空间 SQLite 文件，宿主以 scoped mount 或宿主函数形式暴露；guest 内嵌 SQLite（如 wasm 版 sqlite）或全走宿主函数，二选一，`trust.md` 定。
4. **注意点**：
   - guest↔host 传参需经线性内存（spike 用 `unsafe` + 共享 buffer + `(ptr, size)` 约定，IDL 必须把这套内存约定标准化，参考 WIT canonical ABI 思路）。
   - `wazero` 根包**没有**导出 `Module` 类型（v1.12），host 侧用 `github.com/tetratelabs/wazero/api` 的 `api.Module`。
   - Go 编译的 guest 体积偏大（2.6MB），多 App 常驻时需实例复用/缓存策略；TinyGo 可作为优化选项（未验证）。

## 后续

- 本结论作为实现计划的前提输入；`trust.md` / `spec.md` / `permissions.md` 按三级信任（见 `decisions.md` 决策 4）编写。
- 非管理员 L3 调试的容器化假服务规则，记入 `lifecycle.md`（待写）。
