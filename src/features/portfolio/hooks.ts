import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import * as portfolioApi from "@/features/portfolio/api"
import type { AssetType } from "@/types/api"

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
