import { parseApiDate } from "@/lib/parse-date"
import type { PricePoint } from "@/types/api"

// GET /assets/{id}/details's history_7d is a genuine 7-day sliding window
// collected hourly, not "the last N points" - but on an environment that
// isn't running 24/7 (e.g. a dev machine), the hourly collector leaves
// gaps, so the array can legitimately span far less than 7 days (confirmed
// live: ~13 points covering ~26h instead of a full week). The response
// shape never changes, just how many points exist and how far back they
// reach - so this is a rendering concern, not something to special-case in
// the API layer.
const MIN_SPAN_DAYS = 2

/**
 * How many days back the oldest point in `points` actually reaches, from
 * now. Doesn't assume the array is pre-sorted (callers already sort for
 * their own plotting needs, but a shared low-level util shouldn't rely on
 * that).
 */
export function getHistorySpanDays(points: PricePoint[]): number {
  let oldest: Date | null = null
  for (const point of points) {
    const date = parseApiDate(point.recorded_at)
    if (date && (oldest === null || date < oldest)) oldest = date
  }
  if (!oldest) return 0
  return (Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)
}

/**
 * True when there's too little actual time coverage for a "7 jours" chart
 * to be a meaningful representation, even if there are several data
 * points - a handful of hourly points from the last day shouldn't be
 * plotted as if they were a week-long trend.
 */
export function isHistorySparse(points: PricePoint[]): boolean {
  return getHistorySpanDays(points) < MIN_SPAN_DAYS
}
