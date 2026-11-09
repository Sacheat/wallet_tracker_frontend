import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as allocationApi from "@/features/allocation/api"

export const allocationKeys = {
  // Under ["portfolio"]: a buy/sell (which invalidates ["portfolio"]) also
  // refreshes the allocation.
  allocation: (contribution: number | null) =>
    ["portfolio", "allocation", contribution ?? 0] as const,
  allocationAll: ["portfolio", "allocation"] as const,
  targets: ["allocation-targets"] as const,
}

export function useAllocation(contribution: number | null) {
  return useQuery({
    queryKey: allocationKeys.allocation(contribution),
    queryFn: () => allocationApi.getAllocation(contribution ?? undefined),
    // Typing a new contribution keeps the previous figures on screen.
    placeholderData: keepPreviousData,
  })
}

export function useAllocationTargets() {
  return useQuery({ queryKey: allocationKeys.targets, queryFn: allocationApi.getAllocationTargets })
}

export function useSaveAllocationTargets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: allocationApi.putAllocationTargets,
    onSuccess: (targets) => {
      queryClient.setQueryData(allocationKeys.targets, targets)
      // drift / rebalance / has_targets all depend on the targets.
      queryClient.invalidateQueries({ queryKey: allocationKeys.allocationAll })
    },
  })
}
