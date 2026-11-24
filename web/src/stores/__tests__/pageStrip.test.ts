import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePageStripStore } from "@/stores/pageStrip";

const reset = () => {
  usePageStripStore.setState({
    columns: [{ id: "col-1", display: "stack", tabs: [], activeTabId: null }],
    activeColumnId: "col-1",
    activeTabId: null,
    flashTabId: null,
  });
};

const findTab = (id: string) => usePageStripStore.getState().columns.flatMap((c) => c.tabs).find((t) => t.id === id)!;

describe("usePageStripStore · 页面条带与 Tab 顶栏", () => {
  beforeEach(reset);

  it("新 tab 默认自适应宽度开启", () => {
    const id = usePageStripStore.getState().openTab({
      appId: "topic", icon: "tag", titleKey: "sidebar.topics", view: { kind: "route", refId: "/topic" },
    });
    const tab = findTab(id);
    expect(tab?.autoWidth).toBe(true);
    expect(tab?.width).toBe("1/3");
    expect(tab?.minimized).toBe(false);
  });

  it("同目标复用已有 tab，不重复开页", () => {
    const input = { appId: "topic", icon: "tag", titleKey: "sidebar.topics", view: { kind: "route" as const, refId: "/topic" } };
    const first = usePageStripStore.getState().openTab(input);
    const second = usePageStripStore.getState().openTab(input);
    expect(second).toBe(first);
    expect(usePageStripStore.getState().columns.flatMap((c) => c.tabs)).toHaveLength(1);
  });

  it("最小化只影响 tab，不删除；激活时自动恢复", () => {
    const id = usePageStripStore.getState().openTab({
      appId: "chat", icon: "chat", titleKey: "sidebar.chat", view: { kind: "route", refId: "/chat" },
    });
    usePageStripStore.getState().toggleMinimize(id);
    expect(findTab(id)?.minimized).toBe(true);
    usePageStripStore.getState().activateTab(id);
    expect(findTab(id)?.minimized).toBe(false);
  });

  it("宽度设置与前进后退边界", () => {
    const id = usePageStripStore.getState().openTab({
      appId: "topic", icon: "tag", view: { kind: "route", refId: "/topic" },
    });
    const tab = () => findTab(id);
    expect(() => usePageStripStore.getState().back(id)).not.toThrow();
    expect(tab().history.index).toBe(0);
    expect(() => usePageStripStore.getState().forward(id)).not.toThrow();
    expect(tab().history.index).toBe(0);
    usePageStripStore.getState().setWidth(id, "fixed", 640);
    expect(tab().width).toBe("fixed");
    expect(tab().fixedWidth).toBe(640);
    usePageStripStore.getState().setAutoWidth(id, false);
    expect(tab().autoWidth).toBe(false);
  });

  it("flashTab 3 秒后自动清除", () => {
    vi.useFakeTimers();
    const id = usePageStripStore.getState().openTab({
      appId: "topic", icon: "tag", view: { kind: "route", refId: "/topic" },
    });
    usePageStripStore.getState().flashTab(id);
    expect(usePageStripStore.getState().flashTabId).toBe(id);
    vi.advanceTimersByTime(3001);
    expect(usePageStripStore.getState().flashTabId).toBeNull();
    vi.useRealTimers();
  });
});
