/**
 * Posting-hours rule: when a community configures an allowed posting window,
 * adverts cannot be submitted outside it. Unrestricted (0/0) by default —
 * members may submit adverts at any time. Pure functions so they can be
 * unit tested without a database.
 */

export function getLocalHour(now: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: timezone,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    const hour = hourPart ? Number(hourPart.value) : NaN;
    return Number.isFinite(hour) ? hour : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

export type PostingHoursConfig = {
  timezone: string;
  /** Inclusive start of the allowed window, e.g. 6 => 06:00 */
  startHour: number;
  /** Exclusive end of the allowed window, e.g. 20 => 20:00 */
  endHour: number;
};

export function isWithinPostingHours(
  now: Date,
  config: PostingHoursConfig
): boolean {
  const hour = getLocalHour(now, config.timezone);
  const { startHour, endHour } = config;
  if (startHour === endHour) return true; // no restriction
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  // Window wraps midnight (e.g. 20 -> 6 means allowed 20:00-06:00)
  return hour >= startHour || hour < endHour;
}

export function describePostingHours(config: PostingHoursConfig): string {
  const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${fmt(config.startHour)}–${fmt(config.endHour)}`;
}

export function describeQuietHours(config: PostingHoursConfig): string {
  const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${fmt(config.endHour)}–${fmt(config.startHour)}`;
}
