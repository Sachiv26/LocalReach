import { describe, it, expect } from "vitest";
import { quotaStatus, countUsageInWindow, quotaWindow } from "@/lib/ads/quota";

describe("quotaStatus", () => {
  it("returns full quota when no usage", () => {
    const status = quotaStatus([], 2, 7, new Date("2026-01-15T10:00:00Z"));
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(2);
    expect(status.exhausted).toBe(false);
    expect(status.resetAt).toBeNull();
  });

  it("counts usage within the rolling window", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const usage = [
      { createdAt: new Date("2026-01-14T10:00:00Z"), quotaType: "FREE_ADVERT" },
      { createdAt: new Date("2026-01-08T09:00:00Z"), quotaType: "FREE_ADVERT" },
    ];
    const status = quotaStatus(usage, 2, 7, now);
    expect(status.used).toBe(1);
    expect(status.remaining).toBe(1);
  });

  it("marks exhausted and computes reset date", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const usage = [
      { createdAt: new Date("2026-01-14T10:00:00Z"), quotaType: "FREE_ADVERT" },
      { createdAt: new Date("2026-01-13T10:00:00Z"), quotaType: "FREE_ADVERT" },
    ];
    const status = quotaStatus(usage, 2, 7, now);
    expect(status.exhausted).toBe(true);
    expect(status.remaining).toBe(0);
    expect(status.resetAt).toEqual(new Date("2026-01-20T10:00:00Z"));
  });

  it("ignores usage older than the rolling window", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const usage = [
      { createdAt: new Date("2026-01-01T10:00:00Z"), quotaType: "FREE_ADVERT" },
    ];
    const status = quotaStatus(usage, 2, 7, now);
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(2);
  });
});

describe("countUsageInWindow", () => {
  it("counts only entries inside the window", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const usage = [
      { createdAt: new Date("2026-01-14T10:00:00Z"), quotaType: "FREE_ADVERT" },
      { createdAt: new Date("2026-01-13T10:00:00Z"), quotaType: "FREE_ADVERT" },
      { createdAt: new Date("2026-01-01T10:00:00Z"), quotaType: "FREE_ADVERT" },
    ];
    expect(countUsageInWindow(usage, now, 7)).toBe(2);
  });
});

describe("quotaWindow", () => {
  it("computes the correct window boundaries", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const { windowStart, windowEnd } = quotaWindow(now, 7);
    expect(windowStart).toEqual(new Date("2026-01-08T10:00:00Z"));
    expect(windowEnd).toEqual(now);
  });
});
