import { describe, it, expect, beforeEach } from "vitest";
import { useFreeWindowStore } from "@/stores/freeWindow";

describe("useFreeWindowStore · 活跃窗口机制", () => {
  beforeEach(() => {
    useFreeWindowStore.setState({
      windows: [],
      focusedId: null,
      isTermityAuthOpen: false,
      isAuthOpen: false,
    });
  });

  it("开窗即成为活跃窗口", () => {
    const id = useFreeWindowStore.getState().openFromContext("system_info");
    const state = useFreeWindowStore.getState();
    expect(state.windows).toHaveLength(1);
    expect(state.focusedId).toBe(id);
  });

  it("focus 切换活跃窗口并刷新 lastFocusedAt", () => {
    const first = useFreeWindowStore.getState().openFromContext("system_info");
    const second = useFreeWindowStore.getState().openFromContext("welcome_timeline");
    // 把第一个窗口的使用时间人为调旧，验证 focus 会 bump
    useFreeWindowStore.setState((s) => ({
      windows: s.windows.map((w) => (w.id === first ? { ...w, lastFocusedAt: 1 } : w)),
    }));

    useFreeWindowStore.getState().focus(first);

    const state = useFreeWindowStore.getState();
    expect(state.focusedId).toBe(first);
    expect(state.windows.find((w) => w.id === first)?.lastFocusedAt).toBeGreaterThan(1);
    expect(state.windows.find((w) => w.id === second)?.lastFocusedAt).toBeGreaterThan(1);
  });

  it("关闭活跃窗口回退到上一个窗口，全关则清空", () => {
    const first = useFreeWindowStore.getState().openFromContext("system_info");
    const second = useFreeWindowStore.getState().openFromContext("welcome_timeline");

    useFreeWindowStore.getState().close(second);
    expect(useFreeWindowStore.getState().focusedId).toBe(first);

    useFreeWindowStore.getState().close(first);
    const state = useFreeWindowStore.getState();
    expect(state.windows).toHaveLength(0);
    expect(state.focusedId).toBeNull();
  });

  it("单例窗口重复打开只聚焦旧实例", () => {
    const id = useFreeWindowStore.getState().openFromContext("system_info");
    const again = useFreeWindowStore.getState().openFromContext("system_info");
    const state = useFreeWindowStore.getState();
    expect(again).toBe(id);
    expect(state.windows).toHaveLength(1);
    expect(state.focusedId).toBe(id);
  });
});
