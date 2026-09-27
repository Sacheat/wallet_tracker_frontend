import { toApiError } from "@/lib/http-client"
import { readImageDimensions } from "@/lib/image"

/**
 * Catalog logos (assets and platforms) are uploaded as files, never set by
 * URL: the backend refuses `logo_url` on writes (422) and serves the file
 * itself from /storage/logos/..., so displaying a logo never contacts a
 * third-party server. Two calls: save the resource as JSON first, then
 * POST/DELETE /api/{assets|platforms}/{id}/logo.
 */

// Mirrors the backend's POST .../logo rules - a client-side check for
// immediate feedback only, the backend stays the real validation.
export const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
export const LOGO_MAX_SIZE_BYTES = 512 * 1024
export const LOGO_MAX_DIMENSION = 1024
export const LOGO_CONSTRAINTS_LABEL = "PNG, JPEG ou WebP — 512 Ko et 1024×1024 px max"

// What the form wants done to the logo once the resource itself is saved.
export type LogoDraft =
  | { kind: "keep" }
  | { kind: "replace"; file: File; previewUrl: string }
  | { kind: "remove" }

export const KEEP_LOGO: LogoDraft = { kind: "keep" }

// What the preview avatar should show for a given draft.
export function resolveLogoPreview(currentUrl: string | null, draft: LogoDraft) {
  if (draft.kind === "replace") return draft.previewUrl
  if (draft.kind === "remove") return null
  return currentUrl
}

// Returns an error message, or null if the file passes.
export async function validateLogoFile(file: File): Promise<string | null> {
  if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
    return "Format non supporté — PNG, JPEG ou WebP (pas de SVG ni de GIF)."
  }
  if (file.size > LOGO_MAX_SIZE_BYTES) {
    return "Le fichier dépasse 512 Ko."
  }
  const url = URL.createObjectURL(file)
  try {
    const { width, height } = await readImageDimensions(url)
    if (width > LOGO_MAX_DIMENSION || height > LOGO_MAX_DIMENSION) {
      return `Dimensions trop grandes (max ${LOGO_MAX_DIMENSION}×${LOGO_MAX_DIMENSION} px).`
    }
    return null
  } catch {
    return "Impossible de lire cette image."
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function getLogoErrorMessage(error: unknown): string {
  const apiError = toApiError(error)
  if (apiError.status === 429) {
    return apiError.retryAfterSeconds
      ? `Trop d'envois de logo — réessaie dans ${apiError.retryAfterSeconds} s.`
      : "Trop d'envois de logo — réessaie dans une minute."
  }
  return apiError.errors?.logo?.[0] ?? apiError.message
}

/**
 * Applies a draft after the resource was saved. Never throws: the resource
 * already exists at this point, so a logo failure is reported alongside it
 * (`logoError`) rather than failing the whole save - a create retried by
 * the user would otherwise hit the uniqueness rules or duplicate the entry.
 */
export async function applyLogoDraft<T extends { logo_url: string | null }>(
  resource: T,
  draft: LogoDraft,
  api: {
    upload: (file: File) => Promise<T>
    remove: () => Promise<void>
  },
): Promise<{ resource: T; logoError: string | null }> {
  try {
    if (draft.kind === "replace") {
      return { resource: await api.upload(draft.file), logoError: null }
    }
    if (draft.kind === "remove" && resource.logo_url !== null) {
      await api.remove()
      return { resource: { ...resource, logo_url: null }, logoError: null }
    }
    return { resource, logoError: null }
  } catch (error) {
    return { resource, logoError: getLogoErrorMessage(error) }
  }
}
