// Hands a Blob to the browser as a file download (CSV export, RGPD data
// export). The object URL only lives for the click.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Local-date stamp for file names: YYYY-MM-DD in the user's own timezone
// (toISOString() would roll over to tomorrow/yesterday near midnight).
export function todayStamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
