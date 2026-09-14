/**
 * Duplicate / repeated-content detection for anti-spam.
 * Normalises advert text and compares token-set similarity against the
 * advertiser's recent adverts. Pure functions — the DB query is in the service.
 */

export function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenSet(text: string): Set<string> {
  return new Set(normaliseText(text).split(" ").filter(Boolean));
}

/** Jaccard similarity between two token sets (0–1). */
export function similarity(a: string, b: string): number {
  const ta = tokenSet(a);
  const tb = tokenSet(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of Array.from(ta)) if (tb.has(t)) intersection += 1;
  return intersection / (ta.size + tb.size - intersection);
}

export type RecentAdvert = { id: string; title: string; description: string };

export type DuplicateResult = {
  isDuplicate: boolean;
  matchedAdvertId: string | null;
  score: number;
};

/** Threshold chosen to catch reposts while tolerating short titles. */
export const DUPLICATE_SIMILARITY_THRESHOLD = 0.82;

export function findDuplicate(
  title: string,
  description: string,
  recent: RecentAdvert[]
): DuplicateResult {
  for (const advert of recent) {
    const titleScore = similarity(title, advert.title);
    const fullScore = similarity(
      `${title} ${description}`,
      `${advert.title} ${advert.description}`
    );
    const exactText =
      normaliseText(title) === normaliseText(advert.title) &&
      normaliseText(description) === normaliseText(advert.description);
    const score = Math.max(titleScore, fullScore);
    if (exactText || score >= DUPLICATE_SIMILARITY_THRESHOLD) {
      return { isDuplicate: true, matchedAdvertId: advert.id, score };
    }
  }
  return { isDuplicate: false, matchedAdvertId: null, score: 0 };
}
