import { describe, it, expect } from "vitest";
import {
  findHistorySuggestion,
  suggestionSuffix,
  acceptWord,
} from "@/lib/termitySuggest";

describe("termitySuggest", () => {
  const history = [
    "vnet status",
    "info",
    "vnet ping",
    "func System.Develop latest commit",
  ];

  it("returns the most recent prefix match (zsh history strategy)", () => {
    // 历史数组末尾 = 最新；zsh 的 history[(r)pattern] 取首个匹配即最新
    expect(findHistorySuggestion(history, "vnet ")).toBe("vnet ping");
    expect(findHistorySuggestion(history, "vnet")).toBe("vnet ping");
    expect(findHistorySuggestion(history, "func ")).toBe(
      "func System.Develop latest commit"
    );
  });

  it("returns null for empty buffer", () => {
    expect(findHistorySuggestion(history, "")).toBeNull();
    expect(findHistorySuggestion(history, "   ")).toBeNull();
  });

  it("returns null when no prefix match", () => {
    expect(findHistorySuggestion(history, "zzz")).toBeNull();
  });

  it("returns null when the match has no remainder", () => {
    expect(findHistorySuggestion(history, "info")).toBeNull();
  });

  it("is case sensitive like zsh", () => {
    expect(findHistorySuggestion(history, "VNET")).toBeNull();
  });

  it("computes the suffix (POSTDISPLAY)", () => {
    expect(suggestionSuffix("vnet ping", "vnet ")).toBe("ping");
    expect(suggestionSuffix("vnet ping", "xxx")).toBe("");
  });

  it("accepts a single word at a time", () => {
    // word = 空格分隔的整词，"System.Develop" 是一个词
    expect(acceptWord("func System.Develop latest commit", "func ")).toBe(
      "func System.Develop "
    );
    expect(acceptWord("vnet ping", "vnet ")).toBe("vnet ping");
  });
});
