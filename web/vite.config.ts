/**
 * Vite 配置 — 替代 next.config.ts
 *
 * 提供：
 * - 开发服务器 API 代理（/api → localhost:2048，/api-net → localhost:2050）
 * - 路径别名（@/ → src/）
 * - 构建优化
 *
 * 安全 headers 需要在生产部署层配置（nginx / Cloudflare）。
 */
import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 优雅退出插件：Ctrl+C 时输出自定义关闭信息 */
function gracefulExitPlugin() {
  return {
    name: "graceful-exit",
    configureServer(server: ViteDevServer) {
      const shutdown = () => {
        console.log("\n\x1b[36mDebug service stopped. See you next time!\x1b[0m");
        server.close();
        process.exit(0);
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    },
  };
}

/** 翻译文件热重启插件：修改 i18n 文件时自动重启开发服务器 */
function i18nRestartPlugin() {
  return {
    name: "i18n-restart",
    configureServer(server: ViteDevServer) {
      const i18nDir = path.resolve(__dirname, "src/i18n");
      server.watcher.add(i18nDir);

      server.watcher.on("change", (file: string) => {
        if (file.startsWith(i18nDir)) {
          console.log(
            "\n\x1b[36mThe translation file has been modified, and the development server has been restarted to apply the changes in real time.\x1b[0m"
          );
          server.restart();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), gracefulExitPlugin(), i18nRestartPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    port: 3000,
    proxy: {
      // ⚠️ 顺序敏感：Vite 按定义顺序做前缀匹配（first match wins）。
      // "/api-net"、"/healthz-api" 是 "/api"、"/healthz" 的字符串前缀超集
      // （"/api-net/..." 以 "/api" 开头），必须先注册；否则镜像路径会被
      // "/api" 规则劫持到 Go 引擎，fetchBackend/fetchShell 的 .NET 回退全灭。
      // Go verse-engine (:2048) — primary API + health + WebSocket.
      // .NET Verse.Api (:2050) exposes the same /api/* surface,
      // mirrored here under /api-net/* + /healthz-api for dual listening.
      "/api-net": {
        target: "http://localhost:2050",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-net/, "/api"),
      },
      "/healthz-api": {
        target: "http://localhost:2050",
        changeOrigin: true,
        rewrite: () => "/healthz",
      },
      "/api": {
        target: "http://localhost:2048",
        changeOrigin: true,
      },
      "/healthz": {
        target: "http://localhost:2048",
        changeOrigin: true,
      },
      // WebSocket 代理
      "/ws": {
        target: "ws://localhost:2048",
        ws: true,
      },
    },
  },

  build: {
    // 生产环境不生成 source maps
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "vendor-react-dom";
          if (id.includes("node_modules/react")) return "vendor-react";
          if (id.includes("node_modules/zustand")) return "vendor-zustand";
        },
      },
    },
  },
});
