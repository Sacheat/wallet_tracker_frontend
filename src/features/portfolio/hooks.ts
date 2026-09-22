import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useAlerts } from "@/features/alerts/hooks"
import { getAssetDetails } from "@/features/assets/api"
import { assetsKeys } from "@/features/assets/hooks"
import * as portfolioApi from "@/features/portfolio/api"
import type { AssetType, PricePoint } from "@/types/api"

export const portfolioKeys = {
  valued: ["portfolio"] as const,
  news: ["portfolio", "news"] as const,
  entries: ["portfolio-entries"] as const,
}

export function usePortfolio() {
  return useQuery({ queryKey: portfolioKeys.valued, queryFn: portfolioApi.getPortfolio })
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
}

/**
 * Neither backend surface is sufficient alone: /api/portfolio has live
 * valuation but no ids (can't edit/delete/link to a row), /api/portfolio-entries
 * has ids but no computed value. Join them client-side on (asset name, platform
 * name), which is safe because the backend enforces that pair unique per user.
 */
export function useMergedPortfolio() {
  const entriesQuery = usePortfolioEntries()
  const valuedQuery = usePortfolio()

  const rows = useMemo<PortfolioRow[]>(() => {
    if (!entriesQuery.data) return []

    const valueByKey = new Map<string, { value_usd: number; value_eur: number }>()
    for (const item of valuedQuery.data?.data ?? []) {
      valueByKey.set(`${item.asset}|${item.platform}`, {
        value_usd: item.value_usd,
        value_eur: item.value_eur,
      })
    }

    return entriesQuery.data
      .map((entry): PortfolioRow => {
        const match = valueByKey.get(`${entry.asset.name}|${entry.platform.name}`)
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
          valueUsd: match?.value_usd ?? null,
          valueEur: match?.value_eur ?? null,
        }
      })
      .sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1))
  }, [entriesQuery.data, valuedQuery.data])

  return {
    rows,
    totalValueUsd: valuedQuery.data?.total_value_usd ?? null,
    totalValueEur: valuedQuery.data?.total_value_eur ?? null,
    // Server-computed, live - see the ChangePercent note on
    // PortfolioResponse in types/api.ts.
    totalChangePercent: valuedQuery.data?.change_percent ?? null,
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

function invalidatePortfolio(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: portfolioKeys.entries })
  queryClient.invalidateQueries({ queryKey: portfolioKeys.valued })
}

export function useCreatePortfolioEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfolioApi.createPortfolioEntry,
    onSuccess: () => invalidatePortfolio(queryClient),
  })
}

export function useUpdatePortfolioEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      portfolioApi.updatePortfolioEntryQuantity(id, quantity),
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
