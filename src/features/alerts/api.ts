import { httpClient } from "@/lib/http-client"
import type { AlertWindow, NotificationSettings, PriceAlert, PriceAlertType } from "@/types/api"

export interface CreateAlertPayload {
  type: PriceAlertType
  asset_id?: number
  threshold?: number
  percent_threshold?: number
  window?: AlertWindow
}

export interface UpdateAlertPayload {
  threshold?: number
  percent_threshold?: number
  window?: AlertWindow
  is_active?: boolean
}

export async function getAlerts() {
  const { data } = await httpClient.get<PriceAlert[]>("/api/price-alerts")
  return data
}

export async function createAlert(payload: CreateAlertPayload) {
  const { data } = await httpClient.post<PriceAlert>("/api/price-alerts", payload)
  return data
}

export async function updateAlert(id: number, payload: UpdateAlertPayload) {
  const { data } = await httpClient.patch<PriceAlert>(`/api/price-alerts/${id}`, payload)
  return data
}

export async function deleteAlert(id: number) {
  await httpClient.delete(`/api/price-alerts/${id}`)
}

export async function getNotificationSettings() {
  const { data } = await httpClient.get<NotificationSettings>("/api/notification-settings")
  return data
}

export async function updateNotificationSettings(payload: Partial<NotificationSettings>) {
  const { data } = await httpClient.patch<NotificationSettings>(
    "/api/notification-settings",
    payload,
  )
  return data
}
