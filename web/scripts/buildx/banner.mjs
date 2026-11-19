/**
 * Asagity BuildX — startup banner and log normalization (pure functions,
 * shared by the dev and preview launch paths).
 *
 * The tagline "Asagity BuildX is built on Vite" is a deliberate attribution
 * to the technology base, not a leftover from Vite CLI output; the latter is
 * removed by normalizeLogLine and the BuildX launcher.
 */
import { networkInterfaces } from "node:os";

export const BUILDX_TITLE = "Asagity BuildX";
export const BUILDX_TAGLINE = "Asagity BuildX is built on Vite";

/** Color only on a TTY; plain text in pipes / CI keeps logs clean. */
export function createStyle(enabled = Boolean(process.stdout.isTTY)) {
  if (!enabled) return { reset: "", bold: "", accent: "", dim: "" };
  return {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    accent: "\x1b[38;2;57;197;187m", // #39C5BB
    dim: "\x1b[2m",
  };
}

/** Terminal display width: CJK wide characters count as 2 columns so the box aligns. */
function displayWidth(text) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const wide =
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x20000 && code <= 0x3fffd);
    width += wide ? 2 : 1;
  }
  return width;
}

/** IPv4 → 127.0.0.1:2000; IPv6 → [::1]:2000 (link-local %scope preserved). */
export function formatAddress(family, address, port) {
  const p = Number(port);
  const safePort = Number.isInteger(p) && p > 0 && p <= 65535 ? p : 2000;
  if (family === "IPv6") {
    const host = address.startsWith("[") ? address : `[${address}]`;
    return `${host}:${safePort}`;
  }
  return `${address}:${safePort}`;
}

/** Collect all non-loopback addresses; fall back to loopback so the banner always works. */
export function collectAddresses() {
  const v4 = new Set();
  const v6 = new Set();
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.internal) continue;
      if (entry.family === "IPv4") {
        v4.add(entry.address);
      } else {
        const isLinkLocal = /^fe[89ab]/i.test(entry.address);
        const netid = entry.netid ?? entry.scopeid;
        v6.add(isLinkLocal && netid ? `${entry.address}%${netid}` : entry.address);
      }
    }
  }
  if (v4.size === 0) v4.add("127.0.0.1");
  if (v6.size === 0) v6.add("::1");
  return { v4: [...v4], v6: [...v6] };
}

/**
 * Assemble the BuildX banner: title + version + attribution + addressed
 * endpoints + sign-off.
 */
export function buildBanner({
  version = "dev",
  addresses = collectAddresses(),
  port = 2000,
  style = createStyle(),
  mode = "dev",
} = {}) {
  const title = `${BUILDX_TITLE}  ${version}`;
  const subtitle = BUILDX_TAGLINE;
  const innerWidth = Math.max(displayWidth(title), displayWidth(subtitle)) + 2;
  const row = (text) => `│ ${text}${" ".repeat(Math.max(0, innerWidth - displayWidth(text)))} │`;
  const rule = (left, right) => `${left}${"─".repeat(innerWidth + 2)}${right}`;
  const paint = (text, code) => `${code}${text}${style.reset}`;
  const { v4 = [], v6 = [] } = addresses ?? {};

  return [
    "",
    paint(rule("╭", "╮"), style.accent),
    paint(row(title), style.accent + style.bold),
    paint(row(subtitle), style.dim),
    paint(rule("╰", "╯"), style.accent),
    "",
    `${style.bold}Asagity Client ${mode} mode is ready. Available at:${style.reset}`,
    ...v4.map((a) => `  IPv4   ${formatAddress("IPv4", a, port)}`),
    ...v6.map((a) => `  IPv6   ${formatAddress("IPv6", a, port)}`),
    "",
    `${style.accent}Good luck, have fun! _ (^v^) _${style.reset}`,
    "",
    `${style.bold}BuildX logs:${style.reset}`,
    "",
  ].join("\n");
}

const ANSI = /\x1b\[[0-9;]*m/g;

/** Strip Vite traces from runtime logs: replace the CLI banner line and [vite] prefixes. */
export function normalizeLogLine(line) {
  if (typeof line !== "string") return line;
  const plain = line.replace(ANSI, "");
  if (/^\s*vite\s+v?\d/i.test(plain) && /building.*for production/i.test(plain)) {
    return "Asagity BuildX — building for production...";
  }
  return line
    .replace(/\[vite\]/gi, "[BuildX]")
    .replace(/\bVITE\s+v?\d[\w.]*\s+ready in\b/gi, "BuildX ready in");
}
