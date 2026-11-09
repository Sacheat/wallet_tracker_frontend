import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useAlerts } from "@/features/alerts/hooks"
import { getAssetDetails } from "@/features/assets/api"
import { assetsKeys } from "@/features/assets/hooks"
import * as portfolioApi from "@/features/portfolio/api"
import { pickCurrency } from "@/features/portfolio/performance"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { AssetType, HistoryRange, PositionPerformance, PricePoint } from "@/types/api"

export const portfolioKeys = {
  valued: ["portfolio"] as const,
  news: ["portfolio", "news"] as const,
  // Under ["portfolio"]: any buy/sell invalidates the curve too.
  history: (range: HistoryRange) => ["portfolio", "history", range] as const,
  entries: ["portfolio-entries"] as const,
  // Nested under entries so invalidating entries also refreshes every
  // open transaction list.
  transactions: (entryId: number) => ["portfolio-entries", entryId, "transactions"] as const,
}

export function usePortfolio() {
  return useQuery({ queryKey: portfolioKeys.valued, queryFn: portfolioApi.getPortfolio })
}

export function usePortfolioHistory(range: HistoryRange) {
  return useQuery({
    queryKey: portfolioKeys.history(range),
    queryFn: () => portfolioApi.getPortfolioHistory(range),
    // Server-side cache is one hour; no point refetching more often.
    staleTime: 5 * 60_000,
    // Switching range keeps the previous curve on screen (dimmed) instead
    // of collapsing to a skeleton for the ~1-3 s first computation.
    placeholderData: keepPreviousData,
  })
}

export function usePortfolioEntries() {
  return useQuery({ queryKey: portfolioKeys.entries, queryFn: portfolioApi.getPortfolioEntries })
}

export function usePortfolioNews() {
  return useQuery({ queryKey: portfolioKeys.news, queryFn: portfolioApi.getPortfolioNews })
}

export interface PortfolioRow {
  entryId: number
  assetId: number
  assetName: string
  assetSymbol: string
  assetType: AssetType
  assetLogoUrl: string | null
  platformId: number
  platformName: string
  quantity: string
  valueUsd: number | null
  valueEur: number | null
  // Already in the user's currency (picked, never converted). null when the
  // position has a transaction without price, or valuation is unavailable.
  performance: PositionPerformance | null
  // True only when the backend explicitly says the price is missing - not
  // when /api/portfolio itself failed (then we just don't know).
  isMissingPrice: boolean
}

/**
 * /api/portfolio-entries gives full asset/platform relations (logo, symbol,
 * ids for links); /api/portfolio gives live valuation and performance. Since
 * 08/11/2026 both carry the position id, so they're joined on it (the old
 * join on asset+platform *names* is gone).
 */
export function useMergedPortfolio() {
  const entriesQuery = usePortfolioEntries()
  const valuedQuery = usePortfolio()
  const { currency } = useCurrency()

  const rows = useMemo<PortfolioRow[]>(() => {
    if (!entriesQuery.data) return []

    const valuedById = new Map((valuedQuery.data?.data ?? []).map((item) => [item.id, item]))

    return entriesQuery.data
      .map((entry): PortfolioRow => {
        const valued = valuedById.get(entry.id)
        return {
          entryId: entry.id,
          assetId: entry.asset.id,
          assetName: entry.asset.name,
          assetSymbol: entry.asset.symbol,
          assetType: entry.asset.type,
          assetLogoUrl: entry.asset.logo_url,
          platformId: entry.platform.id,
          platformName: entry.platform.name,
          quantity: entry.quantity,
          valueUsd: valued?.value_usd ?? null,
          valueEur: valued?.value_eur ?? null,
          performance: pickCurrency(valued?.performance, currency),
          isMissingPrice: valued !== undefined && valued.performance === null,
        }
      })
      .sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1))
  }, [entriesQuery.data, valuedQuery.data, currency])

  return {
    rows,
    totalValueUsd: valuedQuery.data?.total_value_usd ?? null,
    totalValueEur: valuedQuery.data?.total_value_eur ?? null,
    // Server-computed, live - see the ChangePercent note on
    // PortfolioResponse in types/api.ts.
    totalChangePercent: valuedQuery.data?.change_percent ?? null,
    performanceTotals: pickCurrency(valuedQuery.data?.performance, currency),
    positionsWithoutPrice: valuedQuery.data?.positions_without_price ?? 0,
    isLoading: entriesQuery.isLoading || valuedQuery.isLoading,
    isError: entriesQuery.isError,
    error: entriesQuery.error,
    isValuationUnavailable: valuedQuery.isError,
    refetch: () => {
      entriesQuery.refetch()
      valuedQuery.refetch()
    },
  }
}

export interface PortfolioTableRow extends PortfolioRow {
  change24h: number | null
  history7d: PricePoint[]
  hasActiveAlert: boolean
  isGoldUnavailable: boolean
}

/**
 * Layers per-asset detail (change_percent, history_7d - same data the Market
 * page's "movers" widget uses) and active-alert presence onto the merged
 * portfolio rows. Costs one /assets/{id}/details request per distinct held
 * asset; TanStack Query dedupes/caches by asset id so visiting Market first
 * (or navigating between the two) doesn't re-fetch.
 */
export function usePortfolioTable() {
  const merged = useMergedPortfolio()
  const { data: alerts = [] } = useAlerts()

  const uniqueAssetIds = useMemo(
    () => [...new Set(merged.rows.map((r) => r.assetId))],
    [merged.rows],
  )

  const detailQueries = useQueries({
    queries: uniqueAssetIds.map((id) => ({
      queryKey: assetsKeys.details(id),
      queryFn: () => getAssetDetails(id),
      staleTime: 5 * 60_000,
    })),
  })

  const detailsByAssetId = new Map(
    uniqueAssetIds.map((id, index) => [id, detailQueries[index]?.data]),
  )
  const activeAlertAssetIds = new Set(
    alerts.filter((a) => a.is_active && a.asset_id !== null).map((a) => a.asset_id),
  )

  const rows: PortfolioTableRow[] = merged.rows.map((row) => {
    const details = detailsByAssetId.get(row.assetId)
    return {
      ...row,
      change24h: details?.change_percent["24h"] ?? null,
      history7d: details?.history_7d ?? [],
      hasActiveAlert: activeAlertAssetIds.has(row.assetId),
      isGoldUnavailable: row.assetType === "gold" && row.valueUsd === null,
    }
  })

  return {
    ...merged,
    rows,
    isLoading: merged.isLoading || detailQueries.some((q) => q.isLoading),
  }
}

// Prefix match: ["portfolio"] also covers news and (later) history, and
// ["portfolio-entries"] covers every transaction list - a buy/sell changes
// quantity, valuation, performance and the value curve all at once.
function invalidatePortfolio(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.entries })
  queryClient.invalidateQueries({ queryKey: portfolioKeys.valued })
}

export function useTransactions(entryId: number | null) {
  return useQuery({
    queryKey: portfolioKeys.transactions(entryId ?? 0),
    queryFn: () => portfolioApi.getTransactions(entryId!),
    enabled: entryId !== null,
  })
}

export function useCreateTransaction(entryId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: portfolioApi.TransactionPayload) =>
      portfolioApi.createTransaction(entryId, payload),
    onSuccess: () => invalidatePortfolio(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<portfolioApi.TransactionPayload> }) =>
      portfolioApi.updateTransaction(id, payload),
    onSuccess: () => invalidatePortfolio(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfolioApi.deleteTransaction,
    onSuccess: () => invalidatePortfolio(queryClient),
  })
}

export function useCreatePortfolioEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfolioApi.createPortfolioEntry,
    onSuccess: () => invalidatePortfolio(queryClient),
  })
}

export function useDeletePortfolioEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfolioApi.deletePortfolioEntry,
    onSuccess: () => invalidatePortfolio(queryClient),
  })
}
