import { describe, it, expect } from "vitest";
import { isWithinPostingHours, describeQuietHours } from "@/lib/ads/posting-hours";

describe("isWithinPostingHours", () => {
  const cfg = { timezone: "Africa/Johannesburg", startHour: 6, endHour: 20 };
  it("allows posting at 10:00", () => {
    expect(isWithinPostingHours(new Date("2026-01-15T10:00:00"), cfg)).toBe(true);
  });

  it("blocks posting at 22:00", () => {
    expect(isWithinPostingHours(new Date("2026-01-15T22:00:00"), cfg)).toBe(false);
  });

  it("blocks posting at 04:00", () => {
    expect(isWithinPostingHours(new Date("2026-01-15T04:00:00"), cfg)).toBe(false);
  });

  it("allows posting exactly at start hour", () => {
    expect(isWithinPostingHours(new Date("2026-01-15T06:00:00"), cfg)).toBe(true);
  });

  it("24-hour window always allows", () => {
    expect(isWithinPostingHours(new Date("2026-01-15T03:00:00"), { timezone: "Africa/Johannesburg", startHour: 0, endHour: 24 })).toBe(true);
  });

  it("equal start/end (0/0 default) allows posting at any time — including former quiet hours", () => {
    const cfg = { timezone: "Africa/Johannesburg", startHour: 0, endHour: 0 };
    expect(isWithinPostingHours(new Date("2026-01-15T22:30:00"), cfg)).toBe(true);
    expect(isWithinPostingHours(new Date("2026-01-15T03:15:00"), cfg)).toBe(true);
    expect(isWithinPostingHours(new Date("2026-01-15T12:00:00"), cfg)).toBe(true);
    expect(describeQuietHours(cfg)).toBe("00:00–00:00");
  });
});

describe("describeQuietHours", () => {
  it("formats 20:00–06:00", () => {
    expect(describeQuietHours({ timezone: "Africa/Johannesburg", startHour: 6, endHour: 20 })).toBe("20:00–06:00");
  });
});
