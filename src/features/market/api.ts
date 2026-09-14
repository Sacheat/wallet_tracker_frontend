import { httpClient } from "@/lib/http-client"
import type { FearGreedIndex } from "@/types/api"

export async function getFearGreedIndex() {
  const { data } = await httpClient.get<FearGreedIndex>("/api/market/fear-greed-index")
  return data
}
