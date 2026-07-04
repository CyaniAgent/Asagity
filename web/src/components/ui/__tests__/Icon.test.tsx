import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "@/components/ui/Icon";

describe("Icon", () => {
  it("renders with a valid icon name", () => {
    render(<Icon name="home" />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<Icon name="home" className="text-cyan-500" />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveClass("text-cyan-500");
  });

  it("applies fontSize style", () => {
    render(<Icon name="home" fontSize={24} />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveStyle({ fontSize: "24px" });
  });

  it("falls back to tag icon for unknown names", () => {
    render(<Icon name="nonexistent_icon" />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("uses filled variant when filled prop is true", () => {
    render(<Icon name="home" filled />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
