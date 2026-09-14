import { httpClient } from "@/lib/http-client"
import type { Platform } from "@/types/api"

export interface PlatformPayload {
  name: string
  logo_url?: string | null
}

export async function getPlatforms() {
  const { data } = await httpClient.get<Platform[]>("/api/platforms")
  return data
}

export async function createPlatform(payload: PlatformPayload) {
  const { data } = await httpClient.post<Platform>("/api/platforms", payload)
  return data
}

export async function updatePlatform(id: number, payload: Partial<PlatformPayload>) {
  const { data } = await httpClient.patch<Platform>(`/api/platforms/${id}`, payload)
  return data
}

export async function deletePlatform(id: number) {
  await httpClient.delete(`/api/platforms/${id}`)
}
