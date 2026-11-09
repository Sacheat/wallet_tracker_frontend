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
  // Same convention as email_verified_at: null = not done yet. Set via
  // PATCH /user with {onboarding_completed: true} - see OnboardingProvider.
  onboarding_completed_at: string | null
  // Read-only, set server-side only (php artisan user:admin). UI hint for
  // showing admin-only controls - never a protection: the backend decides.
  is_admin: boolean
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

/**
 * Gain/loss of one position, computed by the backend separately in each
 * currency with every transaction converted at the FX rate of its own day.
 * Always read the user.currency key - never convert the USD figures with
 * /api/exchange-rates, that would drop the FX effect and be wrong.
 * Weighted average cost method; cost_basis includes fees.
 */
export interface PositionPerformance {
  cost_basis: number
  // null once everything has been sold.
  average_buy_price: number | null
  unrealized_pnl: number
  // null when cost_basis is 0 (fully sold, or only airdrops).
  unrealized_pnl_percent: number | null
  realized_pnl: number
}

export type PortfolioPerformanceTotals = Omit<PositionPerformance, "average_buy_price">

export type ByCurrency<T> = Record<CurrencyCode, T>

export interface PortfolioValuedEntry {
  // Same id as /api/portfolio-entries (added 08/11/2026).
  id: number
  asset: string
  asset_type: AssetType
  platform: string
  quantity: string
  value_usd: number
  value_eur: number
  // null while one of the position's transactions has no price (migrated
  // positions): show "prix d'achat à renseigner".
  performance: ByCurrency<PositionPerformance> | null
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
  // Sums the positions that have a performance only. Observed 08/11/2026:
  // the backend sends [] (empty PHP array) instead of an object when no
  // position has a price - see pickCurrency() in features/portfolio/performance.ts.
  performance: ByCurrency<PortfolioPerformanceTotals> | []
  // How many positions are excluded from `performance` (no purchase price).
  positions_without_price: number
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

/** Targets per asset type, in %. Missing type = 0 %. {} = no targets. */
export type AllocationTargets = Partial<Record<AssetType, number>>

export interface AllocationByType {
  type: AssetType
  value_usd: number
  percent: number | null // null when the portfolio is empty
  // The four below are null when has_targets is false.
  target_percent: number | null
  drift: number | null // percent - target_percent, in points (+ = overweight)
  rebalance_usd: number | null // + buy / - sell, at constant total (sums to 0)
  contribution_usd: number | null // only meaningful with ?contribution=
}

export interface AllocationResponse {
  total_value_usd: number
  has_targets: boolean
  max_drift: number | null
  by_type: AllocationByType[]
  by_platform: Array<{ platform: string; value_usd: number; percent: number | null }>
  by_asset: Array<{ asset: string; asset_type: AssetType; value_usd: number; percent: number | null }>
}

export type HistoryRange = "7d" | "30d" | "90d" | "1y"

export interface PortfolioHistoryPoint {
  date: string // YYYY-MM-DD (UTC), oldest first, last one = today
  value: ByCurrency<number>
  // Cost basis of what's held that day. null from the first day a position
  // without purchase price is held. Observed 08/11/2026: before anything is
  // held it's {0,...} (not null), alongside value 0.
  invested: ByCurrency<number> | null
}

export interface PortfolioHistoryResponse {
  range: HistoryRange
  from: string
  to: string
  points: PortfolioHistoryPoint[]
  // Names of held assets with no price history (excluded, not counted as 0).
  missing_history: string[]
}

export type TransactionType = "buy" | "sell"

/**
 * One buy or sell on a position (GET /api/portfolio-entries/{id}/transactions).
 * Decimals arrive as strings. unit_price/fee are in the transaction's own
 * currency, as typed - never converted. unit_price is null only on the
 * opening buy of positions migrated on 08/11/2026 (to be filled by the user).
 * position_quantity is the position's *current* total after the write
 * (same on every item), not a running balance.
 */
export interface PortfolioTransaction {
  id: number
  portfolio_entry_id: number
  type: TransactionType
  quantity: string
  unit_price: string | null
  fee: string
  currency: CurrencyCode
  executed_at: string
  position_quantity: string
  created_at: string
  updated_at: string
}

export type PriceAlertType =
  | "price_above"
  | "price_below"
  | "percent_change"
  | "portfolio_total_above"
  | "portfolio_total_below"
  // Fires when an asset type drifts from its allocation target by at least
  // percent_threshold points. No asset_id/threshold/window. Requires targets
  // (422 errors.type otherwise); clearing targets later does NOT delete it.
  | "allocation_drift"

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

// POST /api/price-alerts/parse - preview only, never creates the alert.
// threshold here is in the account's currency (not yet converted to USD -
// that conversion happens server-side only at the real POST /api/price-alerts
// call, same as a manually-typed threshold), so it's a plain JSON number,
// not the decimal-string convention PriceAlert.threshold has.
export interface ParseAlertResponse {
  understood: true
  type: PriceAlertType
  asset: { id: number; name: string; symbol: string } | null
  threshold: number | null
  percent_threshold: number | null
  window: AlertWindow | null
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
  user_id: number | null
  // Where the action came from: "web" = through the API, "console" =
  // system (scheduler, artisan command). null on entries written before
  // 2026-09-28 - the cause can't be reconstructed for those.
  source: "web" | "console" | null
  // Only on GET /api/audit-logs?scope=all (admin). null when there is no
  // author left: deleted account (source "web") or system action (source
  // "console"). A console entry can still have an author - scheduler-fired
  // alerts are attributed to the alert's owner.
  user?: { id: number; name: string; avatar_url: string | null } | null
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
