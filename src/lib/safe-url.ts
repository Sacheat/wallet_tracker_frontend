/**
 * URLs coming from the API that end up in href/src attributes. Catalog
 * entries (assets/platforms) are shared across every user and news items
 * come from third-party feeds, so none of it is trusted: only accept a
 * parseable URL with an explicitly allowed protocol, never a prefix match
 * (`"httpfoo:..."` starts with "http" too).
 */
function parse(url: string | null | undefined, base?: string) {
  if (!url) return null
  try {
    return new URL(url, base)
  } catch {
    return null
  }
}

// The backend reached through the /backend proxy is same-origin, but in
// dev Laravel still builds /storage URLs from its own APP_URL.
const DEV_API_ORIGIN = "http://localhost:8000"

// Outbound links (news) - plain http is still a legitimate article link.
export function safeLinkUrl(url: string | null | undefined) {
  const parsed = parse(url)
  return parsed && ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null
}

// Images rendered inline. Allowed:
// - our own origin: catalog logos and avatars are uploaded to and served
//   by the backend (/storage/...) through the /backend proxy - plus the
//   plain-http Laravel dev server in dev;
// - blob: object URLs, i.e. a local file being previewed before upload;
// - any other https: URL (nothing sends these today, kept as a safe
//   default rather than a hard block).
// Anything else - third-party http:, javascript:, data: - is dropped.
export function safeImageUrl(url: string | null | undefined) {
  // Resolved against the page so same-origin paths (/backend/storage/...)
  // parse too; absolute URLs are unaffected by the base.
  const parsed = parse(url, window.location.origin)
  if (!parsed) return null
  if (parsed.origin === window.location.origin) return parsed.href
  if (import.meta.env.DEV && parsed.origin === DEV_API_ORIGIN) return parsed.href
  return ["https:", "blob:"].includes(parsed.protocol) ? parsed.href : null
}
