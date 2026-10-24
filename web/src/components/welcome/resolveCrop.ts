/**
 * Viewport-aware focal crop — pure math, no DOM.
 *
 * Ported from `focusCrop.ts` in atombrenner/focus-crop-react (GPL-3.0):
 * https://github.com/atombrenner/focus-crop-react/blob/main/src/lib/focusCrop.ts
 * The `centered()` clamp is verbatim; the surrounding API is adapted to
 * Asagity's needs: input is (viewport, natural image size, focal 0–100),
 * output is an `object-position` percentage pair that feeds CSS `cover`
 * rendering, with the focal point mathematically guaranteed inside the
 * visible window (plain `object-position: x% y%` cannot promise that).
 *
 * License note: GPL-3.0 §13 permits combination into this AGPL-3.0 project;
 * attribution retained above.
 */

export interface CropViewport {
  width: number;
  height: number;
}

export interface CropImageSize {
  width: number;
  height: number;
}

export interface CropFocal {
  /** Horizontal focus 0–100. */
  x: number;
  /** Vertical focus 0–100. */
  y: number;
}

export interface CropPosition {
  /** object-position x in percent. */
  x: number;
  /** object-position y in percent. */
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Position an interval of `length` centered around `center`,
 * clamped so it stays inside [min, max].
 */
function centered(center: number, length: number, min: number, max: number): number {
  const start = center - length / 2;
  return Math.min(Math.max(start, min) + length, max) - length;
}

/**
 * Cover-crop window (in image pixels) with `ratio`, keeping full width
 * or full height of the source, centered on the focal point.
 */
function focusCropRect(
  ratio: number,
  focus: { x: number; y: number },
  clip: Rect,
): Rect {
  const clipRatio = clip.width / clip.height;
  if (clipRatio < ratio) {
    // Viewport is wider than the image: keep full width, crop top/bottom.
    const newHeight = clip.width / ratio;
    const newY = centered(focus.y, newHeight, clip.y, clip.y + clip.height);
    return { x: clip.x, y: newY, width: clip.width, height: newHeight };
  }
  // Viewport is taller/narrower: keep full height, crop left/right.
  const newWidth = clip.height * ratio;
  const newX = centered(focus.x, newWidth, clip.x, clip.x + clip.width);
  return { x: newX, y: clip.y, width: newWidth, height: clip.height };
}

/**
 * Resolve the `object-position` percentage pair for CSS `cover` rendering
 * so the focal point is guaranteed visible.
 *
 * `cover` overflows by (iw - rect.width, ih - rect.height) image pixels;
 * position p% aligns the p% point of image with the p% point of the box,
 * hence offset fraction = rect.offset / maxOffset.
 */
export function resolveCrop(
  viewport: CropViewport,
  image: CropImageSize,
  focal: CropFocal,
): CropPosition {
  if (
    !Number.isFinite(viewport.width) ||
    !Number.isFinite(viewport.height) ||
    !Number.isFinite(image.width) ||
    !Number.isFinite(image.height) ||
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return { x: 50, y: 50 };
  }

  const ratio = viewport.width / viewport.height;
  const focus = {
    x: (Math.min(100, Math.max(0, focal.x)) / 100) * image.width,
    y: (Math.min(100, Math.max(0, focal.y)) / 100) * image.height,
  };
  const rect = focusCropRect(ratio, focus, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const maxX = image.width - rect.width;
  const maxY = image.height - rect.height;
  // Sub-pixel overflow (e.g. 3:2 image in a 3:2 box differs by fractions
  // of a pixel through float math) counts as no overflow.
  const EPS = 1;
  return {
    x: maxX > EPS ? (rect.x / maxX) * 100 : 50,
    y: maxY > EPS ? (rect.y / maxY) * 100 : 50,
  };
}
