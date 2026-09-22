export type AssetType = "crypto" | "stock" | "gold" | "etf"

export type CurrencyCode = "USD" | "EUR" | "GBP" | "CHF"

export interface User {
  id: number
  name: string
  email: string
  created_at: string
  email_verified_at: string | null
  avatar_url: string | null
  currency: CurrencyCode
}

// GET /api/exchange-rates - shares the same 45s-TTL cache/source as
// /api/portfolio's total_value_by_currency, so the two stay consistent.
// A rate is null only if that currency's FX quote couldn't be fetched (same
// gotcha as total_value_by_currency).
export interface ExchangeRatesResponse {
  base: "USD"
  rates: Record<Exclude<CurrencyCode, "USD">, number | null>
  updated_at: string
}

export interface Asset {
  id: number
  name: string
  symbol: string
  type: AssetType
  external_id: string | null
  logo_url: string | null
}

// GET /api/assets/search result item - crypto (CoinGecko) + stock/etf
// (Yahoo Finance) only, never gold (single ticker, no search index for it
// per the API reference - create it directly with external_id "GC=F").
export interface AssetSearchResult {
  external_id: string
  name: string
  symbol: string
  type: AssetType
}

export interface ChangePercent {
  "1h": number | null
  "24h": number | null
  "7d": number | null
}

export interface PricePoint {
  price_usd: string
  recorded_at: string
}

export interface AssetDetails {
  price_usd: number
  description: string | null
  market_cap_usd: number | null
  change_percent: ChangePercent
  history_7d: PricePoint[]
}

export interface NewsItem {
  title: string
  url: string
  source: string
  published_at: string
  // Only present on the aggregated /api/portfolio/news endpoint, not on
  // /api/assets/{id}/news (which is already scoped to a single asset).
  asset_symbol?: string
}

export interface Platform {
  id: number
  name: string
  logo_url: string | null
}

export interface PortfolioValuedEntry {
  asset: string
  asset_type: AssetType
  platform: string
  quantity: string
  value_usd: number
  value_eur: number
}

export interface PortfolioResponse {
  data: PortfolioValuedEntry[]
  total_value_usd: number
  total_value_eur: number
  // Variation of the portfolio's *total* value (reconstructed server-side
  // from each held asset's own change_percent, not a naive weighted
  // average) - use this instead of recomputing a delta client-side from
  // per-asset details.
  change_percent: ChangePercent
  // USD/EUR duplicate the two fields above; GBP/CHF only exist here (no
  // per-row equivalent) - a currency is null only if its FX rate couldn't
  // be fetched.
  total_value_by_currency: Record<"USD" | "EUR" | "GBP" | "CHF", number | null>
}

export interface PortfolioEntry {
  id: number
  user_id: number
  asset_id: number
  platform_id: number
  quantity: string
  asset: Asset
  platform: Platform
}

export type PriceAlertType =
  | "price_above"
  | "price_below"
  | "percent_change"
  | "portfolio_total_above"
  | "portfolio_total_below"

export type AlertWindow = "1h" | "24h" | "7d"

export interface PriceAlert {
  id: number
  type: PriceAlertType
  asset_id: number | null
  asset?: Asset
  // Decimal-cast columns, serialized as strings by Laravel (same convention
  // as PricePoint.price_usd) - confirmed live 2026-09-22 when the backend
  // started returning converted thresholds like "114.81056257" for non-USD
  // accounts. Parse with Number() at the point of use.
  threshold: string | null
  percent_threshold: string | null
  window: AlertWindow | null
  user_id: number
  is_active: boolean
}

export interface NotificationSettings {
  email_notifications_enabled: boolean
  discord_webhook_url: string | null
  daily_digest_enabled: boolean
  weekly_digest_enabled: boolean
}

export interface AuditLogEntry {
  id: number
  auditable_type: string
  auditable_id: number
  action: "created" | "updated" | "deleted"
  changes: Record<string, unknown>
  created_at: string
}

export interface Paginated<T> {
  current_page: number
  data: T[]
  next_page_url: string | null
  total: number
}

export interface FearGreedIndex {
  value: number
  classification: string
  updated_at: string
}

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
