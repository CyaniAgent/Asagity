import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchShell, toApiNetPath } from "@/lib/backend";

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchShell", () => {
  it("passes primary 200 through without mirroring", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true, data: {} }));

    const res = await fetchShell("/api/shell/ping");

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/shell/ping");
  });

  it("retries the .NET mirror when the Go primary 404s a shell route", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("404 page not found", { status: 404 }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { code: "A1B2C3D4" } }));

    const res = await fetchShell("/api/shell/termity/guest-code", { method: "POST" });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/shell/termity/guest-code");
    expect(fetchMock.mock.calls[1][0]).toBe("/api-net/shell/termity/guest-code");
    // init (method/body) must survive the retry
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });

  it("does not mirror404s outside the shell gateway", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { ok: false }));

    const res = await fetchShell("/api/notes/does-not-exist");

    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces the mirror result when the mirror also 404s (single retry)", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("404 page not found", { status: 404 }))
      .mockResolvedValueOnce(new Response("404 page not found", { status: 404 }));

    const res = await fetchShell("/api/shell/meta");

    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("toApiNetPath", () => {
  it("maps shell paths onto the .NET mirror prefix", () => {
    expect(toApiNetPath("/api/shell/meta")).toBe("/api-net/shell/meta");
    expect(toApiNetPath("/healthz")).toBe("/healthz-api");
    expect(toApiNetPath("/api")).toBe("/api-net");
  });

  it("leaves unrelated paths alone", () => {
    expect(toApiNetPath("/ws")).toBeNull();
    expect(toApiNetPath("/nope")).toBeNull();
  });
});
