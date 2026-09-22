import axios from "axios"
import { httpClient } from "@/lib/http-client"
import type { User } from "@/types/api"

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export async function login(payload: LoginPayload) {
  const { data } = await httpClient.post<User>("/login", payload)
  return data
}

export async function register(payload: RegisterPayload) {
  const { data } = await httpClient.post<User>("/register", payload)
  return data
}

export async function logout() {
  await httpClient.post("/logout")
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

// Always responds 200 with the same neutral message whether or not the
// email matches an account - never use the response to infer that.
export async function forgotPassword(email: string) {
  const { data } = await httpClient.post<{ message: string }>("/forgot-password", {
    email,
  })
  return data
}

export async function resetPassword(payload: ResetPasswordPayload) {
  await httpClient.post("/reset-password", payload)
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await httpClient.get<User>("/user")
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null
    }
    throw error
  }
}

// Re-sends the verification link. Fire-and-forget on the backend (queued
// email, 3 retries) - a 200 confirms it was queued, not that it was
// delivered. Shares the 6 req/min throttle with PATCH /user.
export async function resendVerificationEmail() {
  await httpClient.post("/email/verification-notification")
}
