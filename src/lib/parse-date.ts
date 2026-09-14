type ApiDate = string | { date: string; timezone?: string } | null | undefined

/**
 * Some backend endpoints leak an unserialized Carbon instance instead of an
 * ISO string (`{ date: "2026-09-14 21:38:14.000000", timezone: "+00:00", ... }`)
 * — observed on news endpoints specifically. Handle both shapes defensively
 * rather than crashing the whole page on `new Date(object)` -> Invalid Date.
 */
export function parseApiDate(value: ApiDate): Date | null {
  if (!value) return null
  if (typeof value === "string") return new Date(value)
  if (typeof value === "object" && "date" in value) {
    return new Date(`${value.date.replace(" ", "T")}Z`)
  }
  return null
}
