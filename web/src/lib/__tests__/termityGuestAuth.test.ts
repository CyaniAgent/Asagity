import { describe, it, expect } from "vitest";
import {
  GUEST_CODE_LENGTH,
  normalizeGuestCode,
  classifyVerifyResponse,
} from "@/lib/termityGuestAuth";

describe("normalizeGuestCode", () => {
  it("uppercases lowercase letters", () => {
    expect(normalizeGuestCode("abc9z")).toBe("ABC9Z");
  });

  it("strips spaces, dashes and any non 0-9/A-Z symbol", () => {
    expect(normalizeGuestCode("a b-c_1d!e")).toBe("ABC1DE");
    expect(normalizeGuestCode("密码AB")).toBe("AB");
  });

  it("keeps digits", () => {
    expect(normalizeGuestCode("0123456789")).toBe("01234567");
  });

  it(`truncates to ${GUEST_CODE_LENGTH} chars`, () => {
    expect(normalizeGuestCode("A1B2C3D4E5F6")).toBe("A1B2C3D4");
    expect(normalizeGuestCode("A1B2C3D4E5F6")).toHaveLength(GUEST_CODE_LENGTH);
  });

  it("is idempotent", () => {
    const once = normalizeGuestCode("x 9-y!");
    expect(normalizeGuestCode(once)).toBe(once);
  });
});

describe("classifyVerifyResponse", () => {
  it("maps 2xx to valid", () => {
    expect(classifyVerifyResponse(200)).toBe("valid");
    expect(classifyVerifyResponse(204)).toBe("valid");
  });

  it("maps GUEST_CODE_MISMATCH to mismatch", () => {
    expect(classifyVerifyResponse(401, "GUEST_CODE_MISMATCH")).toBe("mismatch");
  });

  it("maps GUEST_CODE_EXPIRED to expired", () => {
    expect(classifyVerifyResponse(410, "GUEST_CODE_EXPIRED")).toBe("expired");
    // attempt-cap invalidation shares the expired code
    expect(classifyVerifyResponse(410, "GUEST_CODE_EXPIRED")).toBe("expired");
  });

  it("falls back to status codes when the envelope is unreadable", () => {
    expect(classifyVerifyResponse(401)).toBe("mismatch");
    expect(classifyVerifyResponse(410)).toBe("expired");
  });

  it("everything else is error", () => {
    expect(classifyVerifyResponse(404)).toBe("error");
    expect(classifyVerifyResponse(500)).toBe("error");
    expect(classifyVerifyResponse(400, "INVALID_REQUEST")).toBe("error");
  });
});
