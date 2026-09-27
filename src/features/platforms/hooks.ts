import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as platformsApi from "@/features/platforms/api"
import { applyLogoDraft, type LogoDraft } from "@/lib/logo-upload"
import type { Platform } from "@/types/api"

export const platformsKeys = {
  all: ["platforms"] as const,
}

export function usePlatforms() {
  return useQuery({ queryKey: platformsKeys.all, queryFn: platformsApi.getPlatforms })
}

function applyPlatformLogo(platform: Platform, logo: LogoDraft) {
  return applyLogoDraft(platform, logo, {
    upload: (file) => platformsApi.uploadPlatformLogo(platform.id, file),
    remove: () => platformsApi.deletePlatformLogo(platform.id),
  })
}

// Save the platform (JSON), then its logo (separate multipart call). A logo
// failure doesn't reject - see applyLogoDraft - it comes back as
// `logoError` so the caller can report it without re-submitting the save.
export function useCreatePlatform() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      payload,
      logo,
    }: {
      payload: platformsApi.PlatformPayload
      logo: LogoDraft
    }) => applyPlatformLogo(await platformsApi.createPlatform(payload), logo),
    onSuccess: () => invalidatePlatformCaches(queryClient),
  })
}

export function useUpdatePlatform() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      logo,
    }: {
      id: number
      payload: Partial<platformsApi.PlatformPayload>
      logo: LogoDraft
    }) => applyPlatformLogo(await platformsApi.updatePlatform(id, payload), logo),
    onSuccess: () => invalidatePlatformCaches(queryClient),
  })
}

function invalidatePlatformCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: platformsKeys.all })
  // Portfolio entries embed the full platform (logo included).
  queryClient.invalidateQueries({ queryKey: ["portfolio-entries"] })
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
