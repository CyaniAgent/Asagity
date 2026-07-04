import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "@/stores/theme";

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({
      preference: "system",
      systemPreference: "dark",
    });
  });

  it("has default state", () => {
    const state = useThemeStore.getState();
    expect(state.preference).toBe("system");
  });

  it("setPreference updates preference", () => {
    useThemeStore.getState().setPreference("light");
    // Read directly from state, not through getter
    expect(useThemeStore.getState().preference).toBe("light");
  });

  it("toggle cycles from dark to system to light", () => {
    useThemeStore.setState({ preference: "dark" });
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().preference).toBe("system");

    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().preference).toBe("light");

    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().preference).toBe("dark");
  });

  it("setPreference to dark changes state", () => {
    useThemeStore.getState().setPreference("dark");
    expect(useThemeStore.getState().preference).toBe("dark");
  });

  it("setPreference to system changes state", () => {
    useThemeStore.getState().setPreference("system");
    expect(useThemeStore.getState().preference).toBe("system");
  });
});
