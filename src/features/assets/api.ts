import { httpClient } from "@/lib/http-client"
import type { Asset, AssetDetails, AssetSearchResult, AssetType, NewsItem } from "@/types/api"

export interface AssetPayload {
  name: string
  symbol: string
  type: AssetType
  external_id?: string | null
  logo_url?: string | null
}

export async function getAssets() {
  const { data } = await httpClient.get<Asset[]>("/api/assets")
  return data
}

export async function getAsset(id: number) {
  const { data } = await httpClient.get<Asset>(`/api/assets/${id}`)
  return data
}

// Requires 2-100 chars (backend-validated) - callers should debounce and
// only enable this below that length. Never returns gold (see
// AssetSearchResult).
export async function searchAssets(query: string) {
  const { data } = await httpClient.get<{ data: AssetSearchResult[] }>(
    "/api/assets/search",
    { params: { q: query } },
  )
  return data.data
}

export async function getAssetDetails(id: number) {
  const { data } = await httpClient.get<AssetDetails>(`/api/assets/${id}/details`)
  return data
}

export async function getAssetNews(id: number) {
  const { data } = await httpClient.get<NewsItem[]>(`/api/assets/${id}/news`)
  return data
}

export async function createAsset(payload: AssetPayload) {
  const { data } = await httpClient.post<Asset>("/api/assets", payload)
  return data
}

export async function updateAsset(id: number, payload: Partial<AssetPayload>) {
  const { data } = await httpClient.patch<Asset>(`/api/assets/${id}`, payload)
  return data
}

export async function deleteAsset(id: number) {
  await httpClient.delete(`/api/assets/${id}`)
}
