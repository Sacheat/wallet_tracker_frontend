import { httpClient } from "@/lib/http-client"
import type {
  CurrencyCode,
  HistoryRange,
  PortfolioHistoryResponse,
  NewsItem,
  PortfolioEntry,
  PortfolioResponse,
  PortfolioTransaction,
  TransactionType,
} from "@/types/api"

/**
 * Opens a position together with its opening buy transaction. The four
 * last fields describe that buy and are optional: leave them out and the
 * backend applies its defaults (fee 0, user.currency, now, no price).
 */
export interface PortfolioEntryPayload {
  asset_id: number
  platform_id: number
  quantity: number
  unit_price?: number
  fee?: number
  currency?: CurrencyCode
  executed_at?: string
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

export async function getPortfolioHistory(range: HistoryRange) {
  const { data } = await httpClient.get<PortfolioHistoryResponse>("/api/portfolio/history", {
    params: { range },
  })
  return data
}

export async function getPortfolioEntries() {
  const { data } = await httpClient.get<PortfolioEntry[]>("/api/portfolio-entries")
  return data
}

export async function createPortfolioEntry(payload: PortfolioEntryPayload) {
  const { data } = await httpClient.post<PortfolioEntry>("/api/portfolio-entries", payload)
  return data
}

// No update call: since 08/11/2026 PATCH /api/portfolio-entries/{id} has
// nothing left to modify (quantity is derived from the position's
// transactions and is refused with a 422).

export async function deletePortfolioEntry(id: number) {
  await httpClient.delete(`/api/portfolio-entries/${id}`)
}

export interface TransactionPayload {
  type: TransactionType
  quantity: number
  unit_price: number
  fee?: number
  currency?: CurrencyCode
  executed_at: string
}

export async function getTransactions(entryId: number) {
  const { data } = await httpClient.get<{ data: PortfolioTransaction[] }>(
    `/api/portfolio-entries/${entryId}/transactions`,
  )
  return data.data
}

export async function createTransaction(entryId: number, payload: TransactionPayload) {
  const { data } = await httpClient.post<{ data: PortfolioTransaction }>(
    `/api/portfolio-entries/${entryId}/transactions`,
    payload,
  )
  return data.data
}

// Partial: any subset of the create fields. null is refused by the backend
// (a price can't be erased), so callers only send fields that changed.
export async function updateTransaction(id: number, payload: Partial<TransactionPayload>) {
  const { data } = await httpClient.patch<{ data: PortfolioTransaction }>(
    `/api/portfolio-transactions/${id}`,
    payload,
  )
  return data.data
}

export async function deleteTransaction(id: number) {
  await httpClient.delete(`/api/portfolio-transactions/${id}`)
}
