/**
 * Asagity BuildX configuration (built on Vite)
 *
 * Provides:
 * - Dev server API proxy (/api → localhost:2048, /api-net → localhost:2050)
 * - Path alias (@/ → src/)
 * - Build optimization
 * - BuildX startup banner / log takeover (see scripts/buildx/)
 *
 * Security headers must be configured at the production edge (nginx / Cloudflare).
 */
import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import {
  buildBanner,
  collectAddresses,
  normalizeLogLine,
} from "./scripts/buildx/banner.mjs";
import { readBuildVersion } from "./scripts/buildx/meta.mjs";

/** Graceful shutdown plugin: custom message on Ctrl+C */
function gracefulExitPlugin() {
  return {
    name: "graceful-exit",
    configureServer(server: ViteDevServer) {
      const shutdown = () => {
        console.log("\n\x1b[36mBuildX stopped. See you next time!\x1b[0m");
        server.close();
        process.exit(0);
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    },
  };
}

/** i18n hot-restart plugin: restart the dev server when translation files change */
function i18nRestartPlugin() {
  return {
    name: "i18n-restart",
    configureServer(server: ViteDevServer) {
      const i18nDir = path.resolve(import.meta.dirname, "src/i18n");
      server.watcher.add(i18nDir);

      server.watcher.on("change", (file: string) => {
        if (file.startsWith(i18nDir)) {
          console.log(
            "\n\x1b[36mThe translation file has been modified, and the BuildX dev server has been restarted to apply the changes in real time.\x1b[0m"
          );
          server.restart();
        }
      });
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * Asagity BuildX banner plugin — takes over Vite's default dev output
 *
 * Mechanism: replace `logger.info` in configureServer to intercept the default
 * banner and URL lines; also print the banner once on httpServer "listening"
 * as a fallback (survives Vite changes). The port comes from the actual
 * listener (Vite auto-increments when busy), never from the configured value.
 * Banner and log helpers live in scripts/buildx/banner.mjs, shared with the
 * BuildX launcher.
 * ═══════════════════════════════════════════════════════════════════ */

/** Resolve the actual listening port: httpServer.address() → resolvedUrls → config → 2000. */
function resolveListenPort(server: ViteDevServer): number {
  const addr = server.httpServer?.address();
  if (addr && typeof addr === "object") return addr.port;
  const local = server.resolvedUrls?.local?.[0];
  if (local) {
    const match = local.match(/:(\d+)(?:\/|$)/);
    if (match) return Number(match[1]);
  }
  return server.config.server.port ?? 2000;
}

/* Banner and address collection moved to scripts/buildx/banner.mjs (pure functions, shared by dev / preview). */

/** BuildX log takeover: replace the default banner, rewrite [vite] prefixes to [BuildX]. */
function buildXPlugin() {
  return {
    name: "asagity-buildx",
    configureServer(server: ViteDevServer) {
      const { logger } = server.config;
      const originalInfo = logger.info.bind(logger);
      let printed = false;

      const printBanner = () => {
        if (printed) return;
        printed = true;
        originalInfo(
          buildBanner({
            version: readBuildVersion(),
            addresses: collectAddresses(),
            port: resolveListenPort(server),
            mode: "dev",
          })
        );
      };

      server.httpServer?.once("listening", printBanner);

      logger.info = (msg, opts) => {
        const text = typeof msg === "string" ? msg : "";
        const plain = text.replace(/\x1b\[[0-9;]*m/g, "");
        // Vite default startup banner → replace it wholesale (pass opts through to keep clear-screen semantics)
        if (/ready in/i.test(plain) && /vite|buildx/i.test(plain)) {
          printBanner();
          return;
        }
        // Vite default Local/Network lines → drop them (addresses are already in the banner)
        if (text.includes("➜") && (text.includes("Local") || text.includes("Network"))) return;
        originalInfo(normalizeLogLine(text), opts);
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), gracefulExitPlugin(), i18nRestartPlugin(), buildXPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },

  server: {
    port: 2000,
    proxy: {
      // ⚠️ Order matters: Vite matches proxy prefixes in definition order (first match wins).
      // "/api-net" and "/healthz-api" are string-prefix supersets of "/api" and "/healthz"
      // ("/api-net/..." starts with "/api"), so they must be registered first; otherwise the
      // mirrored paths get hijacked by the "/api" rule and fetchBackend/fetchShell .NET fallback dies.
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
      // WebSocket proxy
      "/ws": {
        target: "ws://localhost:2048",
        ws: true,
      },
    },
  },

  build: {
    // No source maps in production
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
