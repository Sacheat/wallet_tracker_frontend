import { httpClient } from "@/lib/http-client"
import type { Platform } from "@/types/api"

export interface PlatformPayload {
  name: string
  // No logo_url: the backend refuses it on writes (422) - logos go through
  // uploadPlatformLogo() once the platform exists.
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

// multipart/form-data, field `logo` - see lib/logo-upload.ts for the rules.
export async function uploadPlatformLogo(id: number, file: File) {
  const formData = new FormData()
  formData.append("logo", file)
  const { data } = await httpClient.post<Platform>(`/api/platforms/${id}/logo`, formData)
  return data
}

// 204 no content.
export async function deletePlatformLogo(id: number) {
  await httpClient.delete(`/api/platforms/${id}/logo`)
}
