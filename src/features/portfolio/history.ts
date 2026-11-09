import type { CurrencyCode, PortfolioHistoryPoint } from "@/types/api"

export interface HistoryDatum {
  date: string // YYYY-MM-DD
  value: number
  // null = cost basis unknown that day (a position without price is held).
  invested: number | null
}

export interface PreparedHistory {
  data: HistoryDatum[]
  // First day something was held, when the range started earlier and the
  // empty lead-in was trimmed; null when nothing was trimmed.
  heldSince: string | null
}

/**
 * Turns the API points into one series per curve in the account currency.
 *
 * - Reads value[currency] / invested[currency] as served: never converts
 *   another currency (the backend applied each day's FX rate itself).
 * - Drops the lead-in where nothing was held (value 0 and invested 0): on
 *   "1y" that can be most of the year, and a flat zero line would crush the
 *   part of the curve that matters.
 */
export function prepareHistory(
  points: PortfolioHistoryPoint[],
  currency: CurrencyCode,
): PreparedHistory {
  const data: HistoryDatum[] = []
  for (const point of points) {
    const value = point.value?.[currency]
    if (value === undefined || value === null) continue
    const invested = point.invested === null ? null : (point.invested[currency] ?? null)
    data.push({ date: point.date, value, invested })
  }

  const firstHeld = data.findIndex((d) => !(d.value === 0 && d.invested === 0))
  if (firstHeld <= 0) return { data: firstHeld === -1 ? [] : data, heldSince: null }
  return { data: data.slice(firstHeld), heldSince: data[firstHeld].date }
}

/**
 * Index runs where invested is known. The invested line is drawn one segment
 * per run, so unknown days leave a visible gap instead of a fake drop to 0.
 */
export function investedRuns(data: HistoryDatum[]): Array<[start: number, end: number]> {
  const runs: Array<[number, number]> = []
  let start = -1
  data.forEach((d, i) => {
    if (d.invested !== null && start === -1) start = i
    if (d.invested === null && start !== -1) {
      runs.push([start, i - 1])
      start = -1
    }
  })
  if (start !== -1) runs.push([start, data.length - 1])
  return runs
}

// "Nice" round tick step (1, 2, 2.5 or 5 × 10^n) for a y-axis with ~`count` ticks.
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1
    min -= pad
    max += pad
  }
  const rough = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude
  // Ticks must enclose the data: start at or below min, stop at or above
  // max, otherwise the line is drawn outside the plot.
  const first = Math.floor(min / step) * step
  const last = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let t = first; t <= last + step * 1e-9; t += step) ticks.push(Number((Math.round(t / step) * step).toPrecision(12)))
  return ticks
}
