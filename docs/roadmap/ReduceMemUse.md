# 前端内存优化计划

## 一、构建期内存优化 (Build-time)

| # | 措施 | 说明 | 风险 |
|---|------|------|------|
| 1 | `experimental.webpackMemoryOptimizations: true` | Next.js 15+ 内置，降低构建峰值内存，代价是编译时间略增 | 低 |
| 2 | `experimental.preloadEntriesOnStart: false` | 禁用启动时预加载所有页面 JS 模块，改为按需加载 | 低 |
| 3 | 关闭生产 Source Maps | `productionBrowserSourceMaps: false` + `enablePrerenderSourceMaps: false`，减少构建期内存分配 | 低 |
| 4 | `pnpm analyze` 审计依赖 | 用 Bundle Analyzer 找出未使用/过重的包（如 `echarts` 全量引入、`@dnd-kit` 未使用部分） | 无 |

## 二、运行期内存优化 (Runtime)

| # | 措施 | 说明 | 风险 |
|---|------|------|------|
| 5 | 路由级代码分割 | 当前 `page.tsx` 已用 `next/dynamic`，但 `MainLayout` 内的子组件（`ContextMenu`、`NetworkStatus`、`SplashScreen`）未懒加载 — 改为 `dynamic` 导入 | 低 |
| 6 | Zustand store 瘦身 | `useMusicStore` 持久化整个 playlist（含 ArrayBuffer 音频数据），应 `partialize` 排除大数据字段；`useFreeWindowStore` 的 `currentPost`/`currentUser` 在关闭窗口后不清空 — 添加 `close()` 时重置 | 中 |
| 7 | React.memo 防级联渲染 | `PostItem`、`Icon`、`Sidebar` 等高频渲染组件用 `React.memo` 包裹，避免父组件 state 变化导致整棵树重绘 | 低 |
| 8 | 事件监听器清理 | `Welcome.tsx` 的 `mousemove`、`MainLayout.tsx` 的 `mousedown` 已有 cleanup，但需检查 `system.ts` 的 `setInterval` 心跳在组件卸载后是否仍在运行 — 应在 `MainLayout` 的 `useEffect` return 中调用 `stopHeartbeat` | 中 |
| 9 | AbortController 取消请求 | `fetchHostInfoWithTimeout` 已有 AbortController，但 `fetchMe`、`refreshAccessToken` 等未使用 — 统一添加信号取消 | 中 |

## 三、Bundle 体积瘦身

| # | 措施 | 说明 | 风险 |
|---|------|------|------|
| 10 | ECharts 按需引入 | 当前 `import * as echarts from "echarts"` 全量引入约 800KB，改为 `echarts/core` + 按需注册组件 | 中 |
| 11 | `@fluentui/react-icons` tree-shaking | 当前 100+ 图标全量注册到 `iconMap`，每个图标独立导入会增加 module 数量 — 评估是否改用 `@iconify/react` 按需加载 | 中 |
| 12 | 移除未使用依赖 | `package.json` 中 `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities`、`lucide-react`、`@iconify/react` 可能未实际使用 — `pnpm analyze` 后清理 | 低 |

## 四、监控与持续优化

| # | 措施 | 说明 |
|---|------|------|
| 13 | 添加 `bundlesize` 配置 | 在 `package.json` 设置 JS/CSS 大小预算（如 JS < 300KB, CSS < 50KB） |
| 14 | 生产构建内存监控 | `next build --experimental-debug-memory-usage` 记录构建期 heap 使用 |
| 15 | Chrome DevTools heap snapshot | 定期在生产环境用 `--inspect` 抓取 heap profile，定位内存泄漏 |

## 五、执行优先级

```
Phase 1 (低风险立即做): #1, #2, #3, #5, #12
Phase 2 (需测试验证):   #6, #7, #8, #9
Phase 3 (需重构):       #4, #10, #11
Phase 4 (持续):         #13, #14, #15
```

---
*Created by CyaniAgent - 2026-07-06*
