import { httpClient } from "@/lib/http-client"
import type { CurrencyCode, User } from "@/types/api"

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

// Separate from updateProfile: `currency` is documented as optional/
// standalone on PATCH /user, but verified live (2026-09-22) that the
// backend actually requires `name`+`email` on every PATCH /user call
// regardless of which fields are present (422 "The name field is
// required."/"The email field is required." when currency is sent alone) -
// a real backend validation bug (name/email should be `sometimes`, not
// unconditionally `required`), flagged for the backend session but worked
// around here by resending the user's current, unchanged name/email
// alongside currency. This does NOT trigger the current_password
// requirement, which is genuinely conditional on email actually changing.
export async function updateCurrency(payload: {
  currency: CurrencyCode
  name: string
  email: string
}) {
  const { data } = await httpClient.patch<User>("/user", payload)
  return data
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
