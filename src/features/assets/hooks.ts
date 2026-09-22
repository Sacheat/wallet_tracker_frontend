import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as assetsApi from "@/features/assets/api"

export const assetsKeys = {
  all: ["assets"] as const,
  detail: (id: number) => ["assets", id] as const,
  details: (id: number) => ["assets", id, "details"] as const,
  news: (id: number) => ["assets", id, "news"] as const,
}

export function useAssets() {
  return useQuery({ queryKey: assetsKeys.all, queryFn: assetsApi.getAssets })
}

export function useAsset(id: number) {
  return useQuery({
    queryKey: assetsKeys.detail(id),
    queryFn: () => assetsApi.getAsset(id),
    enabled: Number.isFinite(id),
  })
}

export function useAssetDetails(id: number) {
  return useQuery({
    queryKey: assetsKeys.details(id),
    queryFn: () => assetsApi.getAssetDetails(id),
    enabled: Number.isFinite(id),
    // Change-percent/history fill in slowly as the backend accumulates hourly
    // snapshots, and stock lookups burn a tiny shared Alpha Vantage quota -
    // no point refetching this aggressively.
    staleTime: 5 * 60_000,
  })
}

export function useAssetSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["assets", "search", query] as const,
    queryFn: () => assetsApi.searchAssets(query),
    enabled,
    // The backend itself caches this for 5 min - no point refetching
    // sooner if the same query comes up again in one session.
    staleTime: 5 * 60_000,
  })
}

export function useAssetNews(id: number) {
  return useQuery({
    queryKey: assetsKeys.news(id),
    queryFn: () => assetsApi.getAssetNews(id),
    enabled: Number.isFinite(id),
    staleTime: 5 * 60_000,
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.all })
    },
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<assetsApi.AssetPayload> }) =>
      assetsApi.updateAsset(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.all })
      queryClient.invalidateQueries({ queryKey: assetsKeys.detail(id) })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.all })
    },
  })
}
