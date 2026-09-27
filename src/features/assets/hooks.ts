import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as assetsApi from "@/features/assets/api"
import { applyLogoDraft, type LogoDraft } from "@/lib/logo-upload"
import type { Asset } from "@/types/api"

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

function applyAssetLogo(asset: Asset, logo: LogoDraft) {
  return applyLogoDraft(asset, logo, {
    upload: (file) => assetsApi.uploadAssetLogo(asset.id, file),
    remove: () => assetsApi.deleteAssetLogo(asset.id),
  })
}

// Save the asset (JSON), then its logo (separate multipart call). A logo
// failure doesn't reject - see applyLogoDraft - it comes back as
// `logoError` so the caller can report it without re-submitting the save.
export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ payload, logo }: { payload: assetsApi.AssetPayload; logo: LogoDraft }) =>
      applyAssetLogo(await assetsApi.createAsset(payload), logo),
    onSuccess: () => invalidateAssetCaches(queryClient),
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      logo,
    }: {
      id: number
      payload: Partial<assetsApi.AssetPayload>
      logo: LogoDraft
    }) => applyAssetLogo(await assetsApi.updateAsset(id, payload), logo),
    // assetsKeys.all is a prefix of every per-asset key (detail, details,
    // news), so this covers the asset's own page too.
    onSuccess: () => invalidateAssetCaches(queryClient),
  })
}

function invalidateAssetCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: assetsKeys.all })
  // Portfolio entries embed the full asset (logo included). Literal key
  // rather than portfolioKeys: portfolio/hooks already imports this module.
  queryClient.invalidateQueries({ queryKey: ["portfolio-entries"] })
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
