import type { AlertWindow, AssetType, PriceAlertType } from "@/types/api"

const usdFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
})

export function formatUsd(value: number) {
  return usdFormatter.format(value)
}

export function formatEur(value: number) {
  return eurFormatter.format(value)
}

export function formatPercent(value: number | null) {
  if (value === null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatQuantity(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value
  return num.toLocaleString("fr-FR", { maximumFractionDigits: 8 })
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
