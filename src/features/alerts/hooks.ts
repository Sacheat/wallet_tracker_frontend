import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as alertsApi from "@/features/alerts/api"

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

export function useDeleteAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alertsApi.deleteAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertsKeys.all }),
  })
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
