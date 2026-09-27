/**
 * URLs coming from the API that end up in href/src attributes. Catalog
 * entries (assets/platforms) are shared across every user and news items
 * come from third-party feeds, so none of it is trusted: only accept a
 * parseable URL with an explicitly allowed protocol, never a prefix match
 * (`"httpfoo:..."` starts with "http" too).
 */
function withProtocol(url: string | null | undefined, protocols: string[]) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return protocols.includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

// Outbound links (news) - plain http is still a legitimate article link.
export function safeLinkUrl(url: string | null | undefined) {
  return withProtocol(url, ["http:", "https:"])
}

// Images rendered inline - https only, http would be blocked as mixed
// content in production anyway.
export function safeImageUrl(url: string | null | undefined) {
  return withProtocol(url, ["https:"])
}
