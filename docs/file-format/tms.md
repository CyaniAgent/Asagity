# TMS (Termity Script)

> Termity 平台 Shell 批处理脚本规范（`.tms`）。文本格式，一行一条 Termity 命令。

## 1. 文件与执行模型

- 扩展名 `.tms`，纯文本，UTF-8 无 BOM，换行 LF。
- 上限：单文件 64KB，单行 1024 字符，最多 200 行可执行行（空行与 `#` 注释行不计）。
- 注释：行首（允许前导空格）`#` 为注释。行尾注释不支持（避免与 `echo` 内容冲突）。
- 头指令（可选，文件顶部 `@key value`，未知 key 报 `E1001`）：
  - `@name <string>` / `@version <semver>` / `@termity >=2.0`
  - `@permissions <none|login|confirm>`：脚本申请的最高权限，缺省 `login`。
  - `set -e`：任一步返回非零即停并报 `E0005`（缺省开启）。
- 内建（仅脚本可用，不在交互命令表）：
  - `echo <text>`：输出，支持 `$VAR` / `$?` / `$1..$9` 展开，未定义变量报 `E1007`。
  - `set NAME=value` / `set -e`：变量与严格模式。
  - `run <path|driveId>`：嵌套调用另一 `.tms`，深度上限 4，超限报 `E1009`。
  - `exit [0-255]`：结束脚本并返回码；交互式 `exit` 关窗语义在脚本内禁用（见 `E0004`）。
- 执行顺序：自上而下同步顺序执行；`shellFetch` 类后端调用单步超时 8s（对齐 `Termity.tsx:88 shellFetch`），整脚本 30s 超时报 `E2002`。

## 2. 命令白名单

白名单 = `Termity.tsx:18 getCommands` + `executeCommand switch` 的子集。分三档：

| 档 | 含义 | 命令 |
|---|---|---|
| T0 | 免登录可跑 | `help`、`time [--GMT=]`、`date [--GMT=] [--format=iso]`、`echo`、`set`、`exit [code]`（脚本内仅退脚本） |
| T1 | 需登录（`userStore.isLoggedIn`，否则 `E0003`） | `whoami`、`info`（后端优先 `/api/meta/instance` + `/api/meta/version`，离线回退本地）、`auth info`（后端优先 `/api/auth/me`）、`auth devices`、`auth tokens`、`auth linked`、`vnet status`、`vnet ping`（后端实测 `/api/shell/ping`）、`vnet config`（+ `/api/shell/meta`）、`func lang current`、`func Develop latest commit`、`func Develop latest release`、`func Develop {ver} commit|release`（走 C# 代理 `/api/shell/github/*`，不再直连 `api.github.com`） |
| T2 | 需 `@permissions confirm` + 执行前用户确认，否则 `E0002` | `func lang switch {locale}`、`func pdebug show|hide`、`func enable Develop [time=meta]`、`func disable Develop`、`auth logout [all]`、`run`（嵌套脚本继承调用方权限，不可提权） |

### 2.1 脚本内禁用（直接 `E0004`）

| 命令 | 原因（对齐当前代码） |
|---|---|
| `clear`（`Termity.tsx:580`） | 会清空 500 行历史，批处理中不可追溯 |
| 交互式 `exit` 关窗（`Termity.tsx:572` `close(windowId)`） | 脚本内 `exit` 只退脚本，不关窗 |
| `remote`（`Termity.tsx:683`，`remoteInDev` 占位） | 后端未实现，脚本调用一律 `E0004`（交互式为 `E0006`，见下） |
| 任意白名单外 root（如 `rm`、`curl`、`ssh`） | 一律 `E0001` |

`--help` 与无参子命令帮助（如 `vnet` / `auth` / `func` 无有效子命令即打印帮助，`docs/TermityCmdList.md:16`）在脚本内视为成功（返回 0）但建议 `dry-run` 阶段提示冗余。

## 3. 错误码

命名：`E` + 两位类型 + 两位信息。类型：`00` 常规，`10` 语法，`20` 执行/后端。

| 编码 | 名称 | 触发点（对齐代码） |
|---|---|---|
| `E0001` | No Such Command | 白名单外 root（`executeCommand default` / `unknownCmd`） |
| `E0002` | Permission Denied | T2 命令缺 `@permissions confirm` 或用户拒绝确认 |
| `E0003` | Login Required | T1 命令而 `isLoggedIn=false`（`loginRequired` 分支：`whoami:520`、`auth:591`、`func lang switch:344`） |
| `E0004` | Command Not Allowed In Script | 脚本内 `clear` / 关窗 `exit` / `remote` |
| `E0005` | Script Aborted | `set -e` 下某步非零即停，或用户取消确认 |
| `E0006` | Unsupported Operation | 交互式占位能力（如 `remote` 的 `remoteInDev`），脚本内请用 `E0004` |
| `E1001` | Invalid Header | 未知 `@key`、重复 `@permissions`、非法 `@termity` 范围 |
| `E1002` | Invalid Syntax | 行解析失败（空 root、非法引用、行尾反斜杠续行） |
| `E1003` | Invalid Argument | 缺参/多参/未知 flag（`func lang` 用法、`github/release` 缺 `tag` 对应后端 `INVALID_REQUEST`） |
| `E1004` | Invalid GMT Offset | `--GMT=` 解析失败（`parseGMTOffset:130` throw → `timeInvalidGMT`） |
| `E1005` | Invalid Date Format | `--format=` 非 `iso/iso8601`（`dateInvalidFormat:506`） |
| `E1006` | Invalid Locale | `func lang switch` 非 `zh-CN/zh-TW/en-US/ja-JP`（`Termity.tsx:340`） |
| `E1007` | Undefined Variable | `$VAR` 未 `set` 即展开 |
| `E1008` | File Too Large | 超 64KB / 200 行 / 单行 1024 字符 |
| `E1009` | Nesting Too Deep | `run` 嵌套超 4 层或自引用循环 |
| `E2001` | Backend Error | HTTP 非 2xx（含 `githubApiError`、`API {status}`，C# `GITHUB_UPSTREAM_ERROR` 502） |
| `E2002` | Backend Timeout | 单步 8s / 整脚本 30s 超时（`AbortSignal.timeout`，C# `GITHUB_UPSTREAM_TIMEOUT` 504） |
| `E2003` | Network Unreachable | `fetch` 抛错（`authDevicesError` 分支） |
| `E2004` | Endpoint Not Implemented | 后端 404/501（如 `GET /api/auth/devices` 未实现，`Termity.tsx:627`） |
| `E2005` | Upstream Error | 网关上游失败（GitHub 502 等，需与 `E2001` 区分：`E2001` 指本平台后端错误，`E2005` 指代理的上游错误） |

返回码映射：脚本 `exit [code]` 原样返回；命令失败默认返回其错误码后两位（如 `E1004` → 4），`set -e` 下直接终止。

## 4. 示例

### 示例 1：`hello.tms`（T0，免登录基线）

```tms
@name hello
@version 1.0.0
@termity >=2.0
@permissions none
# 基线自检：只用 T0 命令
echo Termity Script hello
time
date --format=iso
help
exit 0
```

### 示例 2：`netcheck.tms`（T1，需登录，后端实测）

```tms
@name netcheck
@version 1.0.0
@termity >=2.0
@permissions login
set -e
# 对齐 Termity.tsx vnet 分支：status 读双后端心跳 + /api/shell/vnet，
# ping 走 /api/shell/ping 实测 RTT，config 追加 /api/shell/meta
vnet status
vnet ping
vnet config
info
echo netcheck done, last_exit=$?
exit 0
```

### 示例 3：`release-check.tms`（T1，需登录，GitHub 经 C# 代理）

```tms
@name release-check
@version 1.0.0
@termity >=2.0
@permissions login
set -e
# 对齐 func Develop 分支：经 /api/shell/github/* 代理，不直连 api.github.com
whoami
func Develop latest commit
func Develop latest release
auth info
echo release check done
exit 0
```
