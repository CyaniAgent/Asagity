#!/usr/bin/env node
/**
 * Asagity BuildX — frontend compiler runner entry point
 *
 * "Asagity BuildX is built on Vite": internally calls the Vite JS API
 * (createServer / build / preview), but every user-facing line is produced by
 * BuildX. The Vite CLI never runs, so startup, build and exit output carry no
 * Vite CLI branding.
 */
import { build, createLogger, createServer, preview } from "vite";
import { fileURLToPath } from "node:url";
import { readBuildVersion } from "./buildx/meta.mjs";
import {
  buildBanner,
  collectAddresses,
  createStyle,
  normalizeLogLine,
} from "./buildx/banner.mjs";

const CONFIG_FILE = fileURLToPath(new URL("../vite.config.ts", import.meta.url));
const command = process.argv[2] || "dev";
const version = readBuildVersion();

/**
 * Fallback: Vite's dependency optimizer and friends bypass the logger and
 * write `[vite]` straight to console. Normalize them here at the entry point
 * so post-startup logs are also free of Vite CLI traces. The attribution
 * tagline has no `[vite]` marker and is left untouched.
 */
for (const method of ["log", "info", "warn", "error", "debug"]) {
  const original = console[method].bind(console);
  console[method] = (...args) =>
    original(...args.map((arg) => (typeof arg === "string" ? normalizeLogLine(arg) : arg)));
}

/** Vite log bridge: replace the CLI banner and [vite] prefixes, pass everything else through. */
function buildxLogger() {
  const raw = createLogger("info", { allowClearScreen: false });
  const strip = (msg) => (typeof msg === "string" ? msg.replace(/\x1b\[[0-9;]*m/g, "") : "");
  return {
    info(msg, opts) {
      const plain = strip(msg);
      if (/^\s*vite\s+v?\d/i.test(plain) && /building.*for production/i.test(plain)) {
        console.log(`Asagity BuildX ${version} — building for production...`);
        return;
      }
      raw.info(normalizeLogLine(msg), opts);
    },
    warn(msg, opts) {
      raw.warn(normalizeLogLine(msg), opts);
    },
    error(msg, opts) {
      raw.error(normalizeLogLine(msg), opts);
    },
    warnOnce(msg) {
      raw.warnOnce(normalizeLogLine(msg));
    },
    clearScreen() {},
    get hasWarned() {
      return raw.hasWarned;
    },
    hasErrorLogged(err) {
      return raw.hasErrorLogged(err);
    },
  };
}

async function dev() {
  const server = await createServer({
    configFile: CONFIG_FILE,
    customLogger: buildxLogger(),
    server: { host: "::", port: 2000 },
  });
  await server.listen();
  // The banner is printed by the BuildX plugin in vite.config.ts on httpServer "listening".
}

async function buildProduction() {
  await build({ configFile: CONFIG_FILE, customLogger: buildxLogger() });
  console.log(`Asagity BuildX ${version} — build complete.`);
}

async function previewBuild() {
  const server = await preview({
    configFile: CONFIG_FILE,
    customLogger: buildxLogger(),
    preview: { host: "::", port: 2000 },
  });
  const addr = server.httpServer?.address();
  const port = addr && typeof addr === "object" ? addr.port : 2000;
  console.log(
    buildBanner({
      version,
      addresses: collectAddresses(),
      port,
      style: createStyle(),
      mode: "preview",
    })
  );
}

const runners = { dev, build: buildProduction, preview: previewBuild };
const run = runners[command];
if (!run) {
  console.error(`Asagity BuildX ${version} — unknown command: ${command}`);
  console.error("Usage: node scripts/buildx.mjs <dev|build|preview>");
  process.exit(1);
}

Promise.resolve(run()).catch((err) => {
  console.error(err);
  process.exit(1);
});
