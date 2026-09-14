import { httpClient } from "@/lib/http-client"
import type { NewsItem, PortfolioEntry, PortfolioResponse } from "@/types/api"

export interface PortfolioEntryPayload {
  asset_id: number
  platform_id: number
  quantity: number
}

export async function getPortfolio() {
  const { data } = await httpClient.get<PortfolioResponse>("/api/portfolio")
  return data
}

export async function getPortfolioNews() {
  // Unlike /api/assets/{id}/news (bare array), this endpoint wraps its
  // response in a Laravel API Resource Collection: { data: [...] }.
  const { data } = await httpClient.get<{ data: NewsItem[] }>("/api/portfolio/news")
  return data.data
}

export async function getPortfolioEntries() {
  const { data } = await httpClient.get<PortfolioEntry[]>("/api/portfolio-entries")
  return data
}

export async function createPortfolioEntry(payload: PortfolioEntryPayload) {
  const { data } = await httpClient.post<PortfolioEntry>("/api/portfolio-entries", payload)
  return data
}

export async function updatePortfolioEntryQuantity(id: number, quantity: number) {
  const { data } = await httpClient.patch<PortfolioEntry>(`/api/portfolio-entries/${id}`, {
    quantity,
  })
  return data
}

export async function deletePortfolioEntry(id: number) {
  await httpClient.delete(`/api/portfolio-entries/${id}`)
}
