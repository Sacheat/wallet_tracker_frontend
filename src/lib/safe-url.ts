import { API_BASE_URL } from "@/lib/http-client"

/**
 * URLs coming from the API that end up in href/src attributes. Catalog
 * entries (assets/platforms) are shared across every user and news items
 * come from third-party feeds, so none of it is trusted: only accept a
 * parseable URL with an explicitly allowed protocol, never a prefix match
 * (`"httpfoo:..."` starts with "http" too).
 */
function parse(url: string | null | undefined) {
  if (!url) return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

const API_ORIGIN = new URL(API_BASE_URL).origin

// Outbound links (news) - plain http is still a legitimate article link.
export function safeLinkUrl(url: string | null | undefined) {
  const parsed = parse(url)
  return parsed && ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null
}

// Images rendered inline. Allowed:
// - our own API's origin, whatever its scheme: catalog logos and avatars
//   are uploaded to and served by the backend (/storage/...), which is
//   plain http://localhost:8000 in dev;
// - blob: object URLs, i.e. a local file being previewed before upload;
// - any other https: URL (nothing sends these today, kept as a safe
//   default rather than a hard block).
// Anything else - third-party http:, javascript:, data: - is dropped.
export function safeImageUrl(url: string | null | undefined) {
  const parsed = parse(url)
  if (!parsed) return null
  if (parsed.origin === API_ORIGIN) return parsed.href
  return ["https:", "blob:"].includes(parsed.protocol) ? parsed.href : null
}
