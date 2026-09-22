import axios, { AxiosError } from "axios"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
})

let csrfCookiePromise: Promise<void> | null = null

/**
 * Sanctum SPA auth needs GET /sanctum/csrf-cookie before the first write.
 * Memoized so concurrent mutations on app load don't all trigger it.
 */
export function ensureCsrfCookie() {
  if (!csrfCookiePromise) {
    csrfCookiePromise = httpClient
      .get("/sanctum/csrf-cookie")
      .then(() => undefined)
      .catch((error) => {
        csrfCookiePromise = null
        throw error
      })
  }
  return csrfCookiePromise
}

httpClient.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase()
  if (method && method !== "get") {
    await ensureCsrfCookie()
  }
  return config
})

interface RetryableConfig {
  _csrfRetried?: boolean
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & RetryableConfig) | undefined
    // 419 = expired/missing CSRF token: refresh it once and retry transparently.
    if (error.response?.status === 419 && config && !config._csrfRetried) {
      config._csrfRetried = true
      csrfCookiePromise = null
      await ensureCsrfCookie()
      return httpClient(config)
    }
    return Promise.reject(error)
  },
)

export interface ApiErrorShape {
  message: string
  errors?: Record<string, string[]>
  status?: number
  // Seconds to wait before retrying, parsed from the `Retry-After` header
  // that the public auth routes (login/register/forgot/reset-password,
  // 5 req/min/IP) and a couple of `session`-scoped routes (6 req/min) send
  // alongside a 429.
  retryAfterSeconds?: number
}

export function toApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined

    let retryAfterSeconds: number | undefined
    if (error.response?.status === 429) {
      const header = error.response.headers?.["retry-after"]
      const parsed = header ? Number(header) : NaN
      if (Number.isFinite(parsed)) retryAfterSeconds = parsed
    }

    return {
      message: data?.message ?? error.message,
      errors: data?.errors,
      status: error.response?.status,
      retryAfterSeconds,
    }
  }
  return { message: "Une erreur inattendue est survenue." }
}
