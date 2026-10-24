import { describe, expect, it } from "vitest";
import { resolveCrop } from "@/components/welcome/resolveCrop";

/** Real asset: default.jpg is 6547×4365 (3:2). */
const IMAGE = { width: 6547, height: 4365 };

/** Rebuild the visible window (image px) from a resolved position. */
function visibleWindow(
  viewport: { width: number; height: number },
  pos: { x: number; y: number },
) {
  const ratio = viewport.width / viewport.height;
  const clipRatio = IMAGE.width / IMAGE.height;
  if (clipRatio < ratio) {
    const h = IMAGE.width / ratio;
    const maxY = IMAGE.height - h;
    return { x: 0, y: (pos.y / 100) * maxY, width: IMAGE.width, height: h };
  }
  const w = IMAGE.height * ratio;
  const maxX = IMAGE.width - w;
  return { x: (pos.x / 100) * maxX, y: 0, width: w, height: IMAGE.height };
}

function expectFocalVisible(
  viewport: { width: number; height: number },
  focal: { x: number; y: number },
) {
  const pos = resolveCrop(viewport, IMAGE, focal);
  const win = visibleWindow(viewport, pos);
  const fx = (focal.x / 100) * IMAGE.width;
  const fy = (focal.y / 100) * IMAGE.height;
  expect(fx).toBeGreaterThanOrEqual(win.x - 1);
  expect(fx).toBeLessThanOrEqual(win.x + win.width + 1);
  expect(fy).toBeGreaterThanOrEqual(win.y - 1);
  expect(fy).toBeLessThanOrEqual(win.y + win.height + 1);
  return pos;
}

describe("resolveCrop", () => {
  it("falls back to center on degenerate input", () => {
    expect(resolveCrop({ width: 0, height: 0 }, IMAGE, { x: 35, y: 85 })).toEqual({
      x: 50,
      y: 50,
    });
    expect(resolveCrop({ width: 1920, height: 1080 }, { width: 0, height: 0 }, { x: 35, y: 85 })).toEqual({
      x: 50,
      y: 50,
    });
  });

  it("returns center when aspects match (no overflow)", () => {
    // 3:2 viewport on 3:2 image → nothing cropped.
    expect(resolveCrop({ width: 1500, height: 1000 }, IMAGE, { x: 35, y: 85 })).toEqual({
      x: 50,
      y: 50,
    });
  });

  it("centers the window when the focal point allows it", () => {
    // 16:9 viewport crops top/bottom; focal dead-center → window centered.
    const pos = resolveCrop({ width: 1920, height: 1080 }, IMAGE, { x: 50, y: 50 });
    expect(pos.x).toBe(50);
    expect(pos.y).toBeCloseTo(50, 5);
  });

  it("keeps the welcome focal (35, 85) visible on 16:9", () => {
    expectFocalVisible({ width: 1920, height: 1080 }, { x: 35, y: 85 });
  });

  it("keeps corner focals visible on 16:9", () => {
    expectFocalVisible({ width: 1920, height: 1080 }, { x: 0, y: 0 });
    expectFocalVisible({ width: 1920, height: 1080 }, { x: 100, y: 100 });
    expectFocalVisible({ width: 1920, height: 1080 }, { x: 100, y: 0 });
    expectFocalVisible({ width: 1920, height: 1080 }, { x: 0, y: 100 });
  });

  it("keeps the focal visible on portrait phones (side crop)", () => {
    expectFocalVisible({ width: 390, height: 844 }, { x: 35, y: 85 });
    expectFocalVisible({ width: 390, height: 844 }, { x: 10, y: 90 });
  });

  it("keeps the focal visible on ultrawide (heavy top/bottom crop)", () => {
    expectFocalVisible({ width: 3440, height: 1440 }, { x: 35, y: 85 });
  });

  it("clamps out-of-range focals without NaN", () => {
    const pos = resolveCrop({ width: 1920, height: 1080 }, IMAGE, { x: -20, y: 150 });
    expect(Number.isNaN(pos.x)).toBe(false);
    expect(Number.isNaN(pos.y)).toBe(false);
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.x).toBeLessThanOrEqual(100);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThanOrEqual(100);
  });
});
