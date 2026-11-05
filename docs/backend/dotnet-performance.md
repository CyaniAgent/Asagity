# .NET 层性能与内存优化

> 目标：`.NET`（Verse.Api + Verse.Modules）**极速启动、低内存占用**，避免笔记本/小机器上“内存爆满”。
> 测量环境：Linux x64、.NET 10.0.112、单机（数据均为本机实测值）。

## 1. 实测基线与优化结果

| # | 配置 | 启动到可服务 | RSS | 峰值 | 线程 |
|---|---|---|---|---|---|
| A | Debug 构建 + Server GC（Web SDK 默认） | 2202 ms | 120.2 MB | 120.2 MB | 27 |
| B | Debug + Workstation GC | 1965 ms | 119.6 MB | 119.6 MB | 19 |
| C | Debug + Workstation GC + InvariantGlobalization | 1853 ms | 112.9 MB | 112.9 MB | 19 |
| D | **R2R 发布 + DbContext 池化 + Invariant** | **1247 ms** | 118.3 MB | 118.3 MB | 27 |
| E | **D + Workstation GC**（dev/lite 默认） | **1114 ms** | 117.1 MB | 117.1 MB | 19 |
| F' | **databaseless 模式**（内存 SQLite，R2R + WSGC） | — | **63.7 MB** | — | 15 |

结论：

- **启动 −50%**（2.2 s → 1.1 s）：主要来自 ReadyToRun（AOT 预编译，免 JIT）。
- **内存 −47%**（117 MB → 64 MB）：只要不加载 EF Core（databaseless 不碰磁盘）。
- **lite/production 模式的 ~117 MB 是 ASP.NET Core + EF Core 的地板**，GC 形态只影响线程数（27 → 19），不改变量级。
- EF Core 是最大的内存块（**≈55 MB**）：模型构建 + provider 装载。

## 2. 已落地的措施

| 措施 | 位置 | 收益 |
|---|---|---|
| **ReadyToRun 发布**（`PublishReadyToRun` + `PublishReadyToRunComposite`） | `Verse.Api.csproj` | 启动 2.2 s → 1.25 s |
| **DbContext 池化**（`AddDbContextPool`，池上限 64） | `VerseDataServiceCollectionExtensions` | 降低分配与 GC 抖动；避免默认 1024 池的空闲占用 |
| **InvariantGlobalization**（+ `UseSystemResourceKeys`） | `Verse.Api.csproj` | 省 ICU 依赖；格式一律显式 `InvariantCulture` |
| **按模式切换 GC** | `versetool` 注入 `DOTNET_gcServer` | dev/lite：Workstation GC（−8 线程）；production：Server GC（吞吐优先） |
| **堆上限** | `DOTNET_GCHeapHardLimitPercent=60`（dev/lite） | 容器/笔记本上防止 GC 无限扩张 |
| **databaseless 用共享缓存内存 SQLite** | `Verse.Data` | 不落盘、不依赖外部进程，DI 仍可解析 |
| **直接跑 dll 而非 `dotnet run`** | `versetool` | 省去 restore/build 启动开销，也避免孤儿进程 |
| **RSS 可见** | `versetool status` 新增 RSS 列 | 内存问题可观测，而非靠猜 |

## 3. 明确不做的事（以及原因）

| 方案 | 结论 | 原因 |
|---|---|---|
| **Native AOT** | ❌ 不做 | EF Core 官方明确不建议 NativeAOT 投产；且 AOT 禁用反射式 ORM/动态加载，与 App 生态（动态模块）冲突 |
| **PublishTrimmed** | ❌ 不做 | EF Core 依赖反射实例化实体，裁剪会破功；收益（磁盘体积）不值这个风险 |
| **Server GC 全局强制** | ❌ 不做 | 小实例下 Server GC 纯增内存（多 heap + 多线程）无收益；故按模式切换 |
| **自包含发布** | ❌ 不做 | 每实例多几十 MB 磁盘与更新负担，运行时已随 SDK 存在 |
| **把 .NET 换成 Go** | ❌ 不做 | 违反技术栈红线（核心服务 Go / API+模块 .NET） |

## 4. 进一步的杠杆（按性价比排序，待实施）

1. **按模式决定进程拓扑**：databaseless 模式**不启动 Go 引擎**（WS/事件总线随之关闭），单进程 ≈ 64 MB。当前 mock 仍在 Go（审计 S7 待迁 .NET）。
2. **EF Core 编译模型**（`dotnet ef dbcontext optimize`）：预编译模型可再省启动时间与模型内存。
3. **System.Text.Json 源生成器**：为 DTO 建 `JsonSerializerContext`，去掉反射序列化（同时是未来 AOT 化的前置）。
4. **容器内存限额**：给 API 容器设 `memory: 512m`，配合 `GCHeapHardLimitPercent` 双保险。
5. **池上限可配**：`DataOptions.DbContextPoolSize` 已可配，建议按并发量而非默认 1024 设定。

## 5. 复现方式

```bash
# 发布 R2R 产物
cd core/src && dotnet publish Verse.Api -c Release -o /tmp/r2r \
  -p:PublishReadyToRun=true -p:PublishReadyToRunComposite=true

# 测量启动与内存
ASAGITY_MODE=lite VERSE_API_PORT=2160 dotnet /tmp/r2r/Verse.Api.dll &
# 另开终端观察
grep VmRSS /proc/<pid>/status
```

日常开发统一用 `versetool start dev`，它已注入上述 GC 参数并优先使用 R2R 产物（发布失败自动回退 Debug 构建）。
