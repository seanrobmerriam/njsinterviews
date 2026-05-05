import { LANGUAGE_IDS } from "@/lib/judge0";

describe("LANGUAGE_IDS", () => {
  it("has correct language ID for javascript", () => {
    expect(LANGUAGE_IDS.javascript).toBe(93);
  });

  it("has correct language ID for typescript", () => {
    expect(LANGUAGE_IDS.typescript).toBe(94);
  });

  it("has correct language ID for python", () => {
    expect(LANGUAGE_IDS.python).toBe(71);
  });

  it("has correct language ID for go", () => {
    expect(LANGUAGE_IDS.go).toBe(95);
  });

  it("has correct language ID for rust", () => {
    expect(LANGUAGE_IDS.rust).toBe(73);
  });

  it("has correct language ID for java", () => {
    expect(LANGUAGE_IDS.java).toBe(62);
  });

  it("has correct language ID for cpp", () => {
    expect(LANGUAGE_IDS.cpp).toBe(54);
  });

  it("has correct language ID for sql", () => {
    expect(LANGUAGE_IDS.sql).toBe(82);
  });

  it("all values are positive integers", () => {
    Object.values(LANGUAGE_IDS).forEach((id) => {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThan(0);
    });
  });
});
