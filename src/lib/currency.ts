import type { CurrencyCode, ExchangeRatesResponse } from "@/types/api"

export const CURRENCY_CODES: CurrencyCode[] = ["USD", "EUR", "GBP", "CHF"]

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: "Dollar américain (USD)",
  EUR: "Euro (EUR)",
  GBP: "Livre sterling (GBP)",
  CHF: "Franc suisse (CHF)",
}

const formatters = new Map<CurrencyCode, Intl.NumberFormat>()

function getFormatter(currency: CurrencyCode) {
  let formatter = formatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    })
    formatters.set(currency, formatter)
  }
  return formatter
}

// Intl's fr-FR grouping separator is a narrow no-break space (U+202F), which
// many fonts render as invisible - swap it for a regular no-break space so
// "100 000,75" actually shows a visible gap (same fix as lib/format.ts).
function withVisibleNbsp(formatted: string) {
  return formatted.replace(/ /g, " ")
}

/**
 * Every money amount in the app is USD-native at the source (provider
 * prices, portfolio valuations) - this is the single place that converts to
 * the user's preferred display currency. Returns null when the target
 * currency isn't USD and no rate is available yet (rates still loading, or
 * the backend's FX source is down) so callers can render an explicit
 * "unavailable" state instead of silently showing a wrong number.
 */
export function convertFromUsd(
  amountUsd: number,
  target: CurrencyCode,
  rates: ExchangeRatesResponse | undefined,
): number | null {
  if (target === "USD") return amountUsd
  const rate = rates?.rates[target]
  if (rate === null || rate === undefined) return null
  return amountUsd * rate
}

/**
 * A per-unit price. formatMoney rounds to cents, which turns a 0.4299 €
 * token price into "0,43 €" (or 0.000012 into "0,00 €"): below 1, keep 6
 * significant digits instead.
 */
export function formatUnitPrice(amount: number, currency: CurrencyCode): string {
  if (amount === 0 || Math.abs(amount) >= 1) return formatMoney(amount, currency)
  return withVisibleNbsp(
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumSignificantDigits: 6,
    }).format(amount),
  )
}

export function formatMoney(amount: number | null, currency: CurrencyCode): string {
  if (amount === null) return "—"
  return withVisibleNbsp(getFormatter(currency).format(amount))
}
