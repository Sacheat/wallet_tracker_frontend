import { httpClient } from "@/lib/http-client"
import type { Asset, AssetDetails, AssetSearchResult, AssetType, NewsItem } from "@/types/api"

export interface AssetPayload {
  name: string
  symbol: string
  type: AssetType
  external_id?: string | null
  // No logo_url: the backend refuses it on writes (422) - logos go through
  // uploadAssetLogo() once the asset exists.
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

// multipart/form-data, field `logo` - see lib/logo-upload.ts for the rules.
export async function uploadAssetLogo(id: number, file: File) {
  const formData = new FormData()
  formData.append("logo", file)
  const { data } = await httpClient.post<Asset>(`/api/assets/${id}/logo`, formData)
  return data
}

// 204 no content.
export async function deleteAssetLogo(id: number) {
  await httpClient.delete(`/api/assets/${id}/logo`)
}
