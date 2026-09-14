/**
 * Advertising quota logic.
 *
 * Quota usage is tracked through the dedicated AdvertQuotaUsage model — never
 * derived from counting Advert rows. The functions here are pure so they can
 * be unit tested; the async DB wrapper lives in lib/ads/service.ts.
 */

export type QuotaUsageRow = { createdAt: Date; quotaType: string };

export type QuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
  windowStart: Date;
  windowEnd: Date;
  /** When the next free slot frees up (oldest usage rolls out of the window). */
  resetAt: Date | null;
};

export function quotaWindow(now: Date, periodDays: number) {
  const windowStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  return { windowStart, windowEnd: new Date(now.getTime()) };
}

export function countUsageInWindow(
  usage: QuotaUsageRow[],
  now: Date,
  periodDays: number
): number {
  const { windowStart } = quotaWindow(now, periodDays);
  return usage.filter(
    (u) => u.createdAt.getTime() >= windowStart.getTime() && u.createdAt <= now
  ).length;
}

export function quotaStatus(
  usage: QuotaUsageRow[],
  limit: number,
  periodDays: number,
  now: Date = new Date()
): QuotaStatus {
  const inWindow = usage.filter(
    (u) =>
      u.createdAt.getTime() >=
        now.getTime() - periodDays * 24 * 60 * 60 * 1000 &&
      u.createdAt <= now
  );
  const used = inWindow.length;
  const remaining = Math.max(0, limit - used);
  // Reset = when the oldest counted usage exits the rolling window.
  const oldest = inWindow
    .map((u) => u.createdAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const resetAt =
    oldest && remaining === 0
      ? new Date(oldest.getTime() + periodDays * 24 * 60 * 60 * 1000)
      : null;
  return {
    used,
    limit,
    remaining,
    exhausted: remaining === 0,
    windowStart: new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000),
    windowEnd: now,
    resetAt,
  };
}
