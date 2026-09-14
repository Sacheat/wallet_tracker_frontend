import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as platformsApi from "@/features/platforms/api"

export const platformsKeys = {
  all: ["platforms"] as const,
}

export function usePlatforms() {
  return useQuery({ queryKey: platformsKeys.all, queryFn: platformsApi.getPlatforms })
}

export function useCreatePlatform() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: platformsApi.createPlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformsKeys.all })
    },
  })
}

export function useUpdatePlatform() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: Partial<platformsApi.PlatformPayload>
    }) => platformsApi.updatePlatform(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformsKeys.all })
    },
  })
}

export function useDeletePlatform() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: platformsApi.deletePlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformsKeys.all })
    },
  })
}
