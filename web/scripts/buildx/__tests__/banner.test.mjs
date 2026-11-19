import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILDX_TAGLINE,
  buildBanner,
  formatAddress,
  normalizeLogLine,
} from "../banner.mjs";

const plainStyle = { reset: "", bold: "", accent: "", dim: "" };
const addresses = { v4: ["127.0.0.1"], v6: ["::1", "fe80::1%eth0"] };

test("banner shows BuildX title, version and the Vite attribution tagline", () => {
  const out = buildBanner({
    version: "2026.204+73f2b407",
    addresses,
    port: 2000,
    style: plainStyle,
  });
  assert.match(out, /Asagity BuildX/);
  assert.match(out, /2026\.204\+73f2b407/);
  assert.ok(out.includes(BUILDX_TAGLINE));
});

test("addresses carry the port; IPv6 is bracketed with scope preserved", () => {
  assert.equal(formatAddress("IPv4", "127.0.0.1", 2000), "127.0.0.1:2000");
  assert.equal(formatAddress("IPv6", "::1", 2000), "[::1]:2000");
  assert.equal(formatAddress("IPv6", "fe80::1%eth0", 2048), "[fe80::1%eth0]:2048");
  assert.equal(formatAddress("IPv4", "127.0.0.1", "bad"), "127.0.0.1:2000");
});

test("banner lines include every address", () => {
  const out = buildBanner({ version: "dev", addresses, port: 2050, style: plainStyle });
  assert.ok(out.includes("127.0.0.1:2050"));
  assert.ok(out.includes("[::1]:2050"));
  assert.ok(out.includes("[fe80::1%eth0]:2050"));
});

test("runtime logs lose the Vite prefix", () => {
  assert.equal(normalizeLogLine("[vite] hmr update /src/App.tsx"), "[BuildX] hmr update /src/App.tsx");
  assert.equal(normalizeLogLine("VITE v8.3.6 ready in 320 ms"), "BuildX ready in 320 ms");
  assert.equal(normalizeLogLine("vite v8.3.6 building for production..."), "Asagity BuildX — building for production...");
  assert.equal(normalizeLogLine("vite v8.3.8 building client environment for production..."), "Asagity BuildX — building for production...");
  assert.equal(normalizeLogLine("plain message"), "plain message");
});
