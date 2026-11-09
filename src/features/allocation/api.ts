import { httpClient } from "@/lib/http-client"
import type { AllocationResponse, AllocationTargets } from "@/types/api"

// Amounts in the response are USD. Unlike performance/history, converting
// them with /api/exchange-rates is correct: nothing here is historical.
// `contribution` is the opposite: typed in the account currency, the
// backend converts it.
export async function getAllocation(contribution?: number) {
  const { data } = await httpClient.get<AllocationResponse>("/api/allocation", {
    params: contribution ? { contribution } : undefined,
  })
  return data
}

export async function getAllocationTargets() {
  const { data } = await httpClient.get<{ targets: AllocationTargets | [] }>(
    "/api/allocation-targets",
  )
  // Same PHP quirk as portfolio.performance: an empty map may come back as [].
  return Array.isArray(data.targets) ? {} : data.targets
}

// Replaces all targets at once (they only make sense together); {} clears.
export async function putAllocationTargets(targets: AllocationTargets) {
  const { data } = await httpClient.put<{ targets: AllocationTargets | [] }>(
    "/api/allocation-targets",
    { targets },
  )
  return Array.isArray(data.targets) ? {} : data.targets
}
