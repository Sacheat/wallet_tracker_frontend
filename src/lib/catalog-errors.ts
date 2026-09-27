import { toApiError } from "@/lib/http-client"

/**
 * Error text for writes to the shared catalog (assets, platforms, logos).
 * Backend rules these surface:
 * - 403: editing, deleting or changing the logo is reserved to an admin, or
 *   to the creator while no one else uses the entry. The front can't know
 *   in advance, so the actions stay visible and the backend's (French)
 *   `message` is shown as-is.
 * - 409: delete blocked while the entry is still used (admin included).
 * - 429: creations and the /logo routes share 10 writes/min per user.
 */
export function getCatalogErrorMessage(error: unknown, fallback?: string): string {
  const apiError = toApiError(error)
  if (apiError.status === 429) {
    return apiError.retryAfterSeconds
      ? `Trop de modifications du catalogue — réessaie dans ${apiError.retryAfterSeconds} s.`
      : "Trop de modifications du catalogue — réessaie dans une minute."
  }
  if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
    return apiError.message
  }
  return fallback ?? apiError.message
}
