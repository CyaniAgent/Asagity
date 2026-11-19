/**
 * Asagity BuildX — version metadata
 *
 * Single source of truth: the "version" field in web/package.json (rewritten
 * by CI dump-dev-version; same origin as the backend APP_VERSION, see
 * docs/architecture/versioning.md §4.1). Never assemble a version string here
 * — the banner must match the project version verbatim.
 */
import { readFileSync } from "node:fs";

const PACKAGE_JSON_URL = new URL("../../package.json", import.meta.url);

export function readBuildVersion() {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_URL, "utf8"));
    return typeof pkg.version === "string" && pkg.version ? pkg.version : "dev";
  } catch {
    return "dev";
  }
}
