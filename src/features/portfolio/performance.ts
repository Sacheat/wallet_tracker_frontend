import type { ByCurrency, CurrencyCode } from "@/types/api"

/**
 * Picks the user's currency out of a backend `performance` block.
 *
 * Never fall back to converting another currency's figure: each key is a
 * separate computation at historical FX rates, so a converted USD amount
 * would silently lose the exchange-rate effect. Missing key -> null, and the
 * UI shows "—".
 *
 * Also absorbs the backend sending `[]` (an empty PHP array) instead of an
 * object or null when nothing can be computed.
 */
export function pickCurrency<T>(
  performance: ByCurrency<T> | [] | null | undefined,
  currency: CurrencyCode,
): T | null {
  if (!performance || Array.isArray(performance)) return null
  return performance[currency] ?? null
}
