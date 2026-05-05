import { requireTier } from "@/lib/tier";
import type { Tier } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

describe("tier gate — tier ordering", () => {
  it("FREE < PRO < BUSINESS ordering is respected", () => {
    expect(requireTier("FREE", ["PRO"])).toBe(false);
    expect(requireTier("FREE", ["BUSINESS"])).toBe(false);
    expect(requireTier("PRO", ["FREE"])).toBe(true);
    expect(requireTier("PRO", ["BUSINESS"])).toBe(false);
    expect(requireTier("BUSINESS", ["FREE"])).toBe(true);
    expect(requireTier("BUSINESS", ["PRO"])).toBe(true);
  });

  it("multi-tier array: PRO user passes when PRO or BUSINESS is required", () => {
    // requireTier takes the minimum required tier index
    // ["PRO", "BUSINESS"] → min index is PRO (1), so PRO user (index 1) should pass
    expect(requireTier("PRO", ["PRO", "BUSINESS"])).toBe(true);
  });

  it("multi-tier array: FREE user fails when PRO or BUSINESS is required", () => {
    expect(requireTier("FREE", ["PRO", "BUSINESS"])).toBe(false);
  });

  it("BUSINESS user passes multi-tier [PRO, BUSINESS] requirement", () => {
    expect(requireTier("BUSINESS", ["PRO", "BUSINESS"])).toBe(true);
  });
});
