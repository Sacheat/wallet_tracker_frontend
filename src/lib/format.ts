import type { AlertWindow, AssetType, PriceAlertType } from "@/types/api"

const usdFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

// Intl's fr-FR grouping separator is a narrow no-break space (U+202F),
// which many fonts render as invisible. Swap it for a regular no-break
// space (U+00A0) so "100 000,75" actually shows a visible gap.
function withVisibleNbsp(formatted: string) {
  return formatted.replace(/ /g, " ")
}

// Fixed-USD formatter, used only where a raw-USD reference figure is shown
// alongside an amount already converted to the user's preferred currency -
// see lib/currency.ts's formatMoney/useCurrency for the preference-aware
// path most money in the app should go through instead.
export function formatUsd(value: number) {
  return withVisibleNbsp(usdFormatter.format(value))
}

export function formatPercent(value: number | null) {
  if (value === null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatQuantity(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value
  return withVisibleNbsp(num.toLocaleString("fr-FR", { maximumFractionDigits: 8 }))
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  crypto: "Crypto",
  stock: "Action",
  gold: "Or",
  etf: "ETF",
}

export const ALERT_TYPE_LABELS: Record<PriceAlertType, string> = {
  price_above: "Prix au-dessus de",
  price_below: "Prix en-dessous de",
  percent_change: "Variation de",
  portfolio_total_above: "Portefeuille au-dessus de",
  portfolio_total_below: "Portefeuille en-dessous de",
}

export const ALERT_WINDOW_LABELS: Record<AlertWindow, string> = {
  "1h": "1 heure",
  "24h": "24 heures",
  "7d": "7 jours",
}

// Fixed order (never re-sorted by value) so a type's color stays stable
// across portfolios instead of repainting when holdings change.
export const ASSET_TYPE_ORDER: AssetType[] = ["crypto", "stock", "gold", "etf"]

export const ASSET_TYPE_CHART_CLASS: Record<AssetType, string> = {
  crypto: "bg-chart-1",
  stock: "bg-chart-2",
  gold: "bg-chart-3",
  etf: "bg-chart-4",
}
