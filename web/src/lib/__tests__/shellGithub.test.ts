import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchGithubList, GITHUB_ORG_URL } from "@/lib/shellGithub";

const fetchMock = vi.fn();

const MEMBERS = [
  { login: "AyaxYuna", avatar_url: "https://a/1.png", html_url: "https://github.com/AyaxYuna" },
  { login: "SakuraCake", avatar_url: "https://a/2.png", html_url: "https://github.com/SakuraCake" },
];

function okResponse(data: unknown): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchGithubList", () => {
  it("returns items and writes the localStorage cache on first fetch", async () => {
    fetchMock.mockResolvedValueOnce(okResponse(MEMBERS));

    const items = await fetchGithubList("org-members");

    expect(items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/shell/github/org-members");

    const raw = localStorage.getItem("asgt_shell_gh_org-members");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).items[0].login).toBe("AyaxYuna");
  });

  it("serves a fresh cache hit without touching the network", async () => {
    localStorage.setItem(
      "asgt_shell_gh_org-members",
      JSON.stringify({ at: Date.now(), items: MEMBERS }),
    );

    const items = await fetchGithubList("org-members");

    expect(items).toHaveLength(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refetches when the cache is older than the TTL", async () => {
    localStorage.setItem(
      "asgt_shell_gh_org-members",
      JSON.stringify({ at: Date.now() - 11 * 60_000, items: [] }),
    );
    fetchMock.mockResolvedValueOnce(okResponse(MEMBERS));

    const items = await fetchGithubList("org-members");

    expect(items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the stale cache when upstream fails", async () => {
    localStorage.setItem(
      "asgt_shell_gh_contributors",
      JSON.stringify({ at: Date.now() - 11 * 60_000, items: MEMBERS }),
    );
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 502 }));

    const items = await fetchGithubList("contributors");

    expect(items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws only when there is neither cache nor upstream", async () => {
    // fetchShell 对 shell 路由的 404 会镜像重试一次（见 backend.test.ts）——
    // 两发 404 后才真正失败
    fetchMock
      .mockResolvedValueOnce(new Response("nope", { status: 404 }))
      .mockResolvedValueOnce(new Response("nope", { status: 404 }));

    await expect(fetchGithubList("contributors")).rejects.toThrow(/HTTP 404/);
  });

  it("throws on a malformed envelope even with HTTP 200", async () => {
    fetchMock.mockResolvedValueOnce(okResponse(undefined));

    await expect(fetchGithubList("contributors")).rejects.toThrow(/bad payload/);
  });
});

describe("GITHUB_ORG_URL", () => {
  it("points at the project org", () => {
    expect(GITHUB_ORG_URL).toBe("https://github.com/CyaniAgent");
  });
});
