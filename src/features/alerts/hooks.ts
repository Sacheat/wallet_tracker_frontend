import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as alertsApi from "@/features/alerts/api"
import { toApiError } from "@/lib/http-client"

export const alertsKeys = {
  all: ["price-alerts"] as const,
  notificationSettings: ["notification-settings"] as const,
}

export function useAlerts() {
  return useQuery({ queryKey: alertsKeys.all, queryFn: alertsApi.getAlerts })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alertsApi.createAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertsKeys.all }),
  })
}

export function useUpdateAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: alertsApi.UpdateAlertPayload }) =>
      alertsApi.updateAlert(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertsKeys.all }),
  })
}

// No query invalidation - a parse is a read-only preview, nothing changes
// server-side until the caller separately calls useCreateAlert with the
// confirmed fields.
export function useParseAlert() {
  return useMutation({ mutationFn: alertsApi.parseAlert })
}

export function useDeleteAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alertsApi.deleteAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertsKeys.all }),
  })
}

/**
 * POST/PATCH /api/price-alerts convert a non-USD threshold to USD server
 * side at save time - if the FX source is down for a non-USD account, the
 * backend 503s specifically on these two endpoints (added 2026-09-22, see
 * api_reference memory). USD accounts never hit this. Surfaces a friendly
 * retry message instead of the generic error text.
 */
export function getAlertErrorMessage(error: unknown): string {
  const apiError = toApiError(error)
  if (apiError.status === 503) {
    return "Le taux de change n'est pas disponible pour le moment — réessaie dans quelques instants."
  }
  return apiError.message
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: alertsKeys.notificationSettings,
    queryFn: alertsApi.getNotificationSettings,
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alertsApi.updateNotificationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(alertsKeys.notificationSettings, data)
    },
  })
}
