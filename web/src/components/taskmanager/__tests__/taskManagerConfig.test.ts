import { describe, it, expect } from "vitest";
import { buildAppCatalog, SHORTCUTS, sortApps, type AppEntry } from "@/components/taskmanager/taskManagerConfig";

describe("taskManagerConfig · 统一应用目录", () => {
  it("包含三快捷方式、页面菜单与欢迎页更多菜单", () => {
    const catalog = buildAppCatalog();
    const ids = catalog.map((e) => e.id);
    expect(SHORTCUTS.every((s) => ids.includes(s.id))).toBe(true);
    expect(ids).toContain("menu-topic");
    expect(ids).toContain("menu-settings");
    expect(ids).toContain("more-system-info");
    expect(ids).toContain("more-termity");
  });

  it("去重后无相同 labelKey+目标的重复项", () => {
    const catalog = buildAppCatalog();
    const keys = catalog.map((e) => `${e.labelKey}|${e.launch.kind === "route" ? e.launch.to : e.launch.kind === "window" ? e.launch.viewType : "disabled"}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("把欢迎页窗口动作映射为 window 启动", () => {
    const entry = buildAppCatalog().find((e) => e.id === "more-system-info");
    expect(entry?.launch).toEqual({ kind: "window", viewType: "system_info" });
  });

  it("按本地化显示名去重（路由项优先于 coming-soon 项）", () => {
    const names: Record<string, string> = {
      "sidebar.announcements": "公告",
      "announcement.announcements": "公告",
    };
    const catalog = buildAppCatalog((key) => names[key] ?? key);
    expect(catalog.filter((e) => (names[e.labelKey] ?? e.labelKey) === "公告")).toHaveLength(1);
  });

  it("按本地化显示名做 A-Z 排序", () => {
    const entries: AppEntry[] = [
      { id: "z", icon: "home", labelKey: "z", launch: { kind: "disabled" }, group: "app" },
      { id: "a", icon: "home", labelKey: "a", launch: { kind: "disabled" }, group: "app" },
      { id: "m", icon: "home", labelKey: "m", launch: { kind: "disabled" }, group: "app" },
    ];
    const sorted = sortApps(entries, (key) => key, "en-US");
    expect(sorted.map((e) => e.id)).toEqual(["a", "m", "z"]);
    expect(entries.map((e) => e.id)).toEqual(["z", "a", "m"]); // 不修改入参
  });
});
