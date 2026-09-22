import axios from "axios"
import { httpClient } from "@/lib/http-client"
import type { User } from "@/types/api"

export interface LoginPayload {
  email: string
  password: string
  // Verified live (2026-09-22): posts an additional long-lived
  // remember_web_... cookie alongside the normal session cookie.
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

// Verified live (2026-09-22): POST /register's own response omits
// email_verified_at entirely (and a few other fields GET /user has) -
// caching it directly left VerifyEmailScreen's `=== null` check comparing
// against `undefined`, so a fresh signup never saw the gate. POST /login's
// response happens to include everything correctly, but both go through
// the same canonical fetch anyway so a similar drift on that endpoint
// can't silently reintroduce the same bug.
async function fetchCanonicalUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("La session n'a pas pu être confirmée.")
  }
  return user
}

export async function login(payload: LoginPayload) {
  await httpClient.post("/login", payload)
  return fetchCanonicalUser()
}

export async function register(payload: RegisterPayload) {
  await httpClient.post("/register", payload)
  return fetchCanonicalUser()
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
