import { describe, it, expect } from "vitest";
import { computeRevenueSplit } from "@/lib/revenue/split";

describe("computeRevenueSplit", () => {
  it("splits R39 at 70/30 correctly", () => {
    const result = computeRevenueSplit(39, { platformPercentage: 70, communityPercentage: 30 });
    expect(result.platformAmount).toBeCloseTo(27.3, 1);
    expect(result.communityAmount).toBeCloseTo(11.7, 1);
  });

  it("splits R299 at 70/30 correctly", () => {
    const result = computeRevenueSplit(299, { platformPercentage: 70, communityPercentage: 30 });
    expect(result.platformAmount).toBeCloseTo(209.3, 1);
    expect(result.communityAmount).toBeCloseTo(89.7, 1);
  });

  it("guards against float drift (remainder goes to community)", () => {
    const result = computeRevenueSplit(100, { platformPercentage: 70, communityPercentage: 30 });
    expect(result.platformAmount + result.communityAmount).toBeCloseTo(100, 1);
  });

  it("handles admin carve-out", () => {
    const result = computeRevenueSplit(100, { platformPercentage: 70, communityPercentage: 30, adminPercentage: 50 });
    expect(result.adminAmount).toBeCloseTo(15, 1);
    expect(result.communityAmount).toBeCloseTo(15, 1);
  });

  it("never returns negative amounts", () => {
    const result = computeRevenueSplit(0, { platformPercentage: 70, communityPercentage: 30 });
    expect(result.platformAmount).toBe(0);
    expect(result.communityAmount).toBe(0);
  });
});
