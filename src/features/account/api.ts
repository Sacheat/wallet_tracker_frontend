import { httpClient } from "@/lib/http-client"
import type { User } from "@/types/api"

export interface UpdateProfilePayload {
  name: string
  email: string
  // Only required by the backend when `email` differs from the current
  // one - see PATCH /user in the API reference.
  current_password?: string
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await httpClient.patch<User>("/user", payload)
  return data
}

export async function updatePassword(payload: UpdatePasswordPayload) {
  await httpClient.patch("/user/password", payload)
}

export async function uploadAvatar(blob: Blob) {
  const formData = new FormData()
  formData.append("avatar", blob, "avatar.jpg")
  const { data } = await httpClient.post<User>("/user/avatar", formData)
  return data
}

// 204 no content - unlike upload, this doesn't hand back the updated user.
export async function deleteAvatar() {
  await httpClient.delete("/user/avatar")
}

export async function deleteAccount(password: string) {
  await httpClient.delete("/user", { data: { password } })
}
