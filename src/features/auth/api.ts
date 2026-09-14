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
