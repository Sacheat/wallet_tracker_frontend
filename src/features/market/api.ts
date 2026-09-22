import { httpClient } from "@/lib/http-client"
import type { ExchangeRatesResponse, FearGreedIndex } from "@/types/api"

export async function getFearGreedIndex() {
  const { data } = await httpClient.get<FearGreedIndex>("/api/market/fear-greed-index")
  return data
}

// Root of /api/*, NOT /api/market/exchange-rates despite living in
// MarketController alongside fear-greed-index - see api_reference memory.
export async function getExchangeRates() {
  const { data } = await httpClient.get<ExchangeRatesResponse>("/api/exchange-rates")
  return data
}
