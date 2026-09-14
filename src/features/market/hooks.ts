import { useQueries, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { assetsKeys } from "@/features/assets/hooks"
import { getAssetDetails } from "@/features/assets/api"
import { usePortfolioEntries } from "@/features/portfolio/hooks"
import * as marketApi from "@/features/market/api"
import type { Asset } from "@/types/api"

export function useFearGreedIndex() {
  return useQuery({
    queryKey: ["market", "fear-greed-index"],
    queryFn: marketApi.getFearGreedIndex,
    staleTime: 15 * 60_000,
    retry: false,
  })
}

export interface PortfolioMover {
  asset: Asset
  change24h: number
}

/**
 * Not a documented endpoint - derived by calling /assets/{id}/details for
 * every distinct asset the user holds and ranking by 24h change. Only
 * meaningful once the hourly snapshot scheduler has built up enough
 * history (see the API's change_percent gotcha), so a fresh account
 * legitimately shows "not enough data yet" rather than an empty ranking.
 */
export function usePortfolioMovers() {
  const { data: entries = [], isLoading: entriesLoading } = usePortfolioEntries()

  const uniqueAssets = useMemo(() => {
    const byId = new Map<number, Asset>()
    for (const entry of entries) byId.set(entry.asset.id, entry.asset)
    return [...byId.values()]
  }, [entries])

  const detailQueries = useQueries({
    queries: uniqueAssets.map((asset) => ({
      queryKey: assetsKeys.details(asset.id),
      queryFn: () => getAssetDetails(asset.id),
      staleTime: 5 * 60_000,
    })),
  })

  const isLoading = entriesLoading || detailQueries.some((q) => q.isLoading)

  // Cheap to recompute every render - no need to memoize a handful of items.
  const movers: PortfolioMover[] = uniqueAssets
    .map((asset, index) => ({
      asset,
      change24h: detailQueries[index]?.data?.change_percent["24h"] ?? null,
    }))
    .filter((m): m is PortfolioMover => m.change24h !== null)
    .sort((a, b) => b.change24h - a.change24h)

  return {
    gainers: movers.filter((m) => m.change24h > 0).slice(0, 3),
    losers: movers.filter((m) => m.change24h < 0).slice(-3).reverse(),
    isLoading,
    hasHoldings: uniqueAssets.length > 0,
    hasData: movers.length > 0,
  }
}
