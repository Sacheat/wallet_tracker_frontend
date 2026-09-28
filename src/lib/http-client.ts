import axios, { AxiosError } from "axios"

// Every backend call goes through this same-origin prefix: vercel.json
// rewrites /backend/* to the Laravel API in production, and vite.config.ts
// proxies it to localhost:8000 in dev. Keeping the API first-party is what
// lets Sanctum's session cookie survive - the Vercel and alwaysdata domains
// are distinct public suffixes, so a direct call would be cross-site.
export const API_BASE_URL = "/backend"

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Same-origin now, so axios's default check would attach X-XSRF-TOKEN
  // anyway - kept explicit so it can't silently regress.
  withXSRFToken: true,
})

type UnauthenticatedListener = () => void
const unauthenticatedListeners = new Set<UnauthenticatedListener>()

/**
 * Fired whenever the backend answers 401 to a request made while we
 * thought we had a session - expired session, logout from another tab,
 * password changed elsewhere. AuthProvider subscribes to wipe the query
 * cache (kept out of this module so it doesn't depend on React Query).
 */
export function onUnauthenticated(listener: UnauthenticatedListener) {
  unauthenticatedListeners.add(listener)
  return () => {
    unauthenticatedListeners.delete(listener)
  }
}

// GET /user is the session probe itself: its 401 just means "logged out"
// and is already turned into `null` by getCurrentUser().
function isSessionProbe(config: { url?: string; method?: string } | undefined) {
  return config?.url === "/user" && (config.method ?? "get").toLowerCase() === "get"
}

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
    if (error.response?.status === 401 && !isSessionProbe(config)) {
      for (const listener of unauthenticatedListeners) listener()
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
