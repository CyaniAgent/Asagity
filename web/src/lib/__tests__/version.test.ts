import { describe, it, expect } from "vitest";
import { formatVersionDisplay, parseBuildVersion, initAppVersion } from "@/lib/version";
import { useInstanceStore, DEFAULT_VERSION } from "@/stores/instance";
import { version as PACKAGE_VERSION } from "../../../package.json";

/**
 * 回归锚点：季度代号含字母（Q4），早前正则 [\d.]+ 永远匹配不上
 * dev/eta/beta 分支，全部掉进 stable 兜底（显示裸 tag）。
 */
describe("formatVersionDisplay", () => {
  it("renders the CI commit-count dev version as the semantic Build form", () => {
    // 双层区分：真版本号 2026.193+da1b434a（机器可读）
    // → 解释性展示 Ver. 2026 Build 193 (da1b434a)（用户可读）
    expect(formatVersionDisplay("2026.193+da1b434a")).toBe("Ver. 2026 Build 193 (da1b434a)");
    expect(formatVersionDisplay("v2026.193+da1b434a")).toBe("Ver. 2026 Build 193 (da1b434a)");
  });

  it("does not mistake quarterly stable tags for the count-based dev form", () => {
    // 2026.Q4.1 含字母段且无 +buildmetadata，必须走 stable 分支
    expect(formatVersionDisplay("2026.Q4.1")).toBe("Ver. 2026.Q4.1");
    expect(formatVersionDisplay("2026.S4.1")).toBe("Ver. 2026.S4.1");
  });

  it("renders the legacy dev tag as the canonical Ver. …Dev commit … form", () => {
    expect(formatVersionDisplay("v2026.Q4-dev.255+1a2b3c4d")).toBe(
      "Ver. 2026.Q4.Dev commit 1a2b3c4d",
    );
  });

  it("renders eta / beta previews", () => {
    expect(formatVersionDisplay("v2026.Q4-eta.1")).toBe("Ver. 2026.Q4 Eta Preview");
    expect(formatVersionDisplay("v2026.Q4-beta.3")).toBe("Ver. 2026.Q4 Beta Preview");
  });

  it("renders stable tags with the Ver. prefix only", () => {
    expect(formatVersionDisplay("v2026.Q4")).toBe("Ver. 2026.Q4");
    expect(formatVersionDisplay("v2026.Q4.1")).toBe("Ver. 2026.Q4.1");
    expect(formatVersionDisplay("2026.Q4")).toBe("Ver. 2026.Q4");
  });

  it("keeps the plain dev sentinel readable", () => {
    expect(formatVersionDisplay("dev")).toBe("Ver. Dev");
    expect(formatVersionDisplay("")).toBe("Ver. Dev");
  });
});

describe("parseBuildVersion", () => {
  it("splits the count-based dev tag into the three semantic keys", () => {
    expect(parseBuildVersion("2026.204+73f2b407")).toEqual({
      updateYear: "2026",
      commitsTotal: "204",
      latestCommitHash: "73f2b407",
    });
    expect(parseBuildVersion("v2026.193+da1b434a")).toEqual({
      updateYear: "2026",
      commitsTotal: "193",
      latestCommitHash: "da1b434a",
    });
  });

  it("returns null for quarterly / legacy / sentinel tags", () => {
    for (const tag of ["2026.Q4.1", "v2026.Q4", "2026.Q4-dev.255+1a2b3c4d", "2026.Q4-eta.1", "dev", ""]) {
      expect(parseBuildVersion(tag)).toBeNull();
    }
  });
});

describe("initAppVersion (package.json 单一信源)", () => {
  it("exposes an honest pre-mount default", () => {
    expect(DEFAULT_VERSION).toBe("Ver. Dev");
  });

  it("hydrates the store from package.json in semantic display form", () => {
    initAppVersion();
    const shown = useInstanceStore.getState().version;
    expect(shown).toMatch(/^Ver\. /); // 解释性语义化前缀
    expect(shown).toBe(formatVersionDisplay(PACKAGE_VERSION)); // 与 package.json 真版本号同源
  });
});
