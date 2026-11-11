import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getIcon } from "@astryxdesign/core/Icon";
// 测试直接消费 built 产物：锁定「theme build 追踪 icons 模块」这条管线不回退
import { yukinoshitaGlacierTheme } from "@/theme/yukinoshita-glacier/dist/yukinoshita-glacier";
import { yukinoshitaGlacierIcons } from "@/theme/yukinoshita-glacier/icons";

/** Astryx `defaultIcons` 的完整 key 集（上游若增删，此处需同步——见 icons.tsx 注释） */
const BUILTIN_KEYS = [
  "arrowDown",
  "arrowUp",
  "arrowsUpDown",
  "calendar",
  "check",
  "checkDouble",
  "chevronDown",
  "chevronLeft",
  "chevronRight",
  "chevronsLeft",
  "chevronsRight",
  "clock",
  "close",
  "copy",
  "error",
  "eyeSlash",
  "externalLink",
  "funnel",
  "info",
  "menu",
  "microphone",
  "moreHorizontal",
  "numberInput:stepperDown",
  "search",
  "stop",
  "success",
  "upload",
  "viewColumns",
  "warning",
  "wrench",
];

describe("S3: theme icon takeover → Lucide", () => {
  it("covers all 30 built-in semantic names", () => {
    expect(Object.keys(yukinoshitaGlacierIcons).sort()).toEqual([...BUILTIN_KEYS].sort());
  });

  it("built theme carries the registry (theme source wins over built-in defaults)", () => {
    for (const key of BUILTIN_KEYS) {
      expect(getIcon(key, yukinoshitaGlacierTheme)).toBe(
        yukinoshitaGlacierIcons[key as keyof typeof yukinoshitaGlacierIcons],
      );
    }
  });

  it("resolves a Lucide glyph (svg, 1em, aria-hidden)", () => {
    const { container } = render(<>{getIcon("externalLink", yukinoshitaGlacierTheme)}</>);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "1em");
    expect(svg).toHaveAttribute("height", "1em");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
