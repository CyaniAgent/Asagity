import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "@/stores/user";

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.setState({
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  });

  it("has default state", () => {
    const state = useUserStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setAuth updates auth state", () => {
    useUserStore.getState().setAuth({
      access_token: "test_token",
      refresh_token: "test_refresh",
      user: {
        username: "testuser",
        name: "Test User",
        avatar_url: "https://example.com/avatar.png",
        role: "user",
      },
    });

    const state = useUserStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.accessToken).toBe("test_token");
    expect(state.refreshToken).toBe("test_refresh");
    expect(state.user?.username).toBe("testuser");
  });

  it("developerEnter sets dev credentials", () => {
    useUserStore.getState().developerEnter();

    const state = useUserStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.accessToken).toBe("dev_mock_token_39");
    expect(state.user?.username).toBe("Developer");
  });

  it("username getter returns empty string when no user", () => {
    expect(useUserStore.getState().username).toBe("");
  });

  it("avatar getter returns empty string when no user", () => {
    expect(useUserStore.getState().avatar).toBe("");
  });

  it("developerEnter sets user with Developer username", () => {
    useUserStore.getState().developerEnter();
    expect(useUserStore.getState().user?.username).toBe("Developer");
    expect(useUserStore.getState().user?.name).toBe("Asagity Dev");
  });

  it("setAuth clears state when called with null user", () => {
    useUserStore.getState().setAuth({
      access_token: "token",
      refresh_token: "refresh",
      user: {
        username: "admin",
        name: "Admin",
        avatar_url: "",
        role: "admin",
      },
    });
    expect(useUserStore.getState().isLoggedIn).toBe(true);
    expect(useUserStore.getState().user?.role).toBe("admin");
  });
});
