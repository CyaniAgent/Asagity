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
import { networkInterfaces } from "node:os";
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

/* ═══════════════════════════════════════════════════════════════════
 * Asagity 启动横幅插件 — 替换 dev 模式下 Vite 默认启动输出
 *
 * 机制：Vite CLI 在 `await server.listen()` 之后才抓取 `logger.info`
 * 引用并打印「VITE … ready in …」，而 `server.printUrls()` 在调用时
 * 现取 `config.logger.info` —— 因此在 configureServer 里替换
 * `logger.info` 这一个函数，即可同时接管「默认横幅」与「Local/
 * Network 地址行」，插入我们自己的 banner（地址行吸收到 banner 中
 * 按 IPv4/IPv6 逐一列出）。
 *
 * 兜底：若未来 Vite 改版导致探测不中，过滤条件不命中 → 默认输出
 * 原样打印——降级为「没替换」，绝不吞掉正常日志。
 * ═══════════════════════════════════════════════════════════════════ */

/** 仅 TTY 上色；重定向到管道/CI 时输出纯文本，避免 ANSI 污染日志。 */
const bannerStyle = {
  reset: process.stdout.isTTY ? "\x1b[0m" : "",
  bold: process.stdout.isTTY ? "\x1b[1m" : "",
  accent: process.stdout.isTTY ? "\x1b[38;2;57;197;187m" : "", // #39C5BB Miku Green
};

/**
 * Inter 风格暂代 logo（尚无统一 logo，先仿 Inter 的平直匀笔字形）：
 * pyfiglet `ansi_regular` 生成的块状大写 ASAGITY，产物硬编码、零运行时依赖。
 */
const ASAGITY_ART = [
  " █████  ███████  █████   ██████  ██ ████████ ██    ██",
  "██   ██ ██      ██   ██ ██       ██    ██     ██  ██",
  "███████ ███████ ███████ ██   ███ ██    ██      ████",
  "██   ██      ██ ██   ██ ██    ██ ██    ██       ██",
  "██   ██ ███████ ██   ██  ██████  ██    ██       ██",
];

/** 收集本机全部非回环地址（多网卡逐一列出）；v6 链路本地附 %网卡名 scope 保证可用。 */
function collectAddresses(): { v4: string[]; v6: string[] } {
  const v4 = new Set<string>();
  const v6 = new Set<string>();
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.internal) continue;
      if (entry.family === "IPv4") {
        v4.add(entry.address);
      } else {
        // fe80::/10 链路本地地址需 scope id 才可连接（netid 为运行时字段，类型未声明）
        const isLinkLocal = /^fe[89ab]/i.test(entry.address);
        const netid = (entry as { netid?: string }).netid;
        v6.add(isLinkLocal ? `${entry.address}%${netid ?? entry.scopeid}` : entry.address);
      }
    }
  }
  if (v4.size === 0) v4.add("127.0.0.1"); // 无网卡兜底：回环永远可达
  if (v6.size === 0) v6.add("::1");
  return { v4: [...v4], v6: [...v6] };
}

/** 组装 Asagity 启动横幅：终端图标画 + 连接方式 + 祝福语 + 日志分界线。 */
function buildAsagityBanner(): string {
  const { v4, v6 } = collectAddresses();
  const welcome =
    "Welcome to Asagity Client Develop mode! The following connection methods are available:";
  const { reset, bold, accent } = bannerStyle;

  // 终端图标：圆角窗框 + `>_` 提示符 + Inter 风格字形
  const artW = Math.max(...ASAGITY_ART.map((l) => l.length));
  const inner = 1 + /* 内衬 */ 2 + /* ">_" */ artW + 1; /* 内衬 */
  const paint = (s: string) => `${accent}${s}${reset}`;
  const offset = " ".repeat(Math.max(0, Math.floor((welcome.length - (inner + 2)) / 2)));

  return [
    "",
    offset + paint(`╭${"─".repeat(inner)}╮`),
    ...ASAGITY_ART.map((line, i) =>
      offset + paint(`│ ${i === 0 ? ">_" : "  "}${line.padEnd(artW, " ")} │`)
    ),
    offset + paint(`╰${"─".repeat(inner)}╯`),
    "",
    `${bold}Welcome to Asagity Client Develop mode! The following connection methods are available:${reset}`,
    ...v4.map((a) => `${accent}IPv4:${reset} ${a}`),
    ...v6.map((a) => `${accent}IPv6:${reset} ${a}`),
    "",
    `${accent}Good luck, have fun! _ (^v^) _${reset}`,
    "",
    `${bold}Below are the logs related to the Client:${reset}`,
    "",
  ].join("\n");
}

/** dev 启动输出替换：接管默认横幅与地址行，改打 Asagity banner（仅 dev，build/preview 不受影响）。 */
function asagityBannerPlugin() {
  return {
    name: "asagity-banner",
    configureServer(server: ViteDevServer) {
      const { logger } = server.config;
      const originalInfo = logger.info.bind(logger);

      logger.info = (msg, opts) => {
        const text = typeof msg === "string" ? msg : "";
        // Vite 默认启动横幅 → 整体替换（透传 opts 保留原清屏语义）
        if (text.includes("ready in") && text.includes("VITE")) {
          originalInfo(buildAsagityBanner(), opts);
          return;
        }
        // Vite 默认 Local/Network 地址行 → 吸收（地址已在 banner 中逐一列出）
        if (text.includes("➜") && (text.includes("Local") || text.includes("Network"))) return;
        originalInfo(msg, opts);
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), gracefulExitPlugin(), i18nRestartPlugin(), asagityBannerPlugin()],

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
