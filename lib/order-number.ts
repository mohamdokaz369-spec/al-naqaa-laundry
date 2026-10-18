/**
 * Normalizes a user-typed order number into the canonical "NQ-N" form.
 * Accepts: NQ-5, nq-5, nq5, 5, #5
 *
 * Shared by the tracking pages and the /api/track route so client and
 * server always agree on the same canonical form.
 */
export function normalizeOrderNumber(input: string): string {
  const s = input.trim();
  if (/^NQ-\d+$/i.test(s)) return s.toUpperCase();
  const nqNoDash = s.match(/^nq(\d+)$/i);
  if (nqNoDash) return `NQ-${nqNoDash[1]}`;
  const num = s.replace(/^#/, "").match(/^\d+$/);
  if (num) return `NQ-${num[0]}`;
  return s.toUpperCase();
}
