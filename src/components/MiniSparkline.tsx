import { History } from "lucide-react"
import { useMemo } from "react"
import { parseApiDate } from "@/lib/parse-date"
import { isHistorySparse } from "@/lib/price-history"
import type { PricePoint } from "@/types/api"

const WIDTH = 64
const HEIGHT = 24
const PAD = 2

export function MiniSparkline({ points }: { points: PricePoint[] }) {
  const sparse = useMemo(() => isHistorySparse(points), [points])

  const path = useMemo(() => {
    const data = points
      .map((p) => ({ price: Number(p.price_usd), date: parseApiDate(p.recorded_at) }))
      .filter((p): p is { price: number; date: Date } => p.date !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (data.length < 2) return null

    const prices = data.map((d) => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const coords = data.map((d, i) => ({
      x: PAD + (i / (data.length - 1)) * (WIDTH - PAD * 2),
      y: PAD + (1 - (d.price - min) / range) * (HEIGHT - PAD * 2),
    }))

    return {
      d: coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" "),
      isUp: prices[prices.length - 1] >= prices[0],
    }
  }, [points])

  if (!path) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  // Enough points to draw a line, but they don't actually reach back far
  // enough to call it a "7 jours" trend - a chart here would misrepresent
  // what's really just the last day or so of data.
  if (sparse) {
    return (
      <span
        className="text-muted-foreground inline-flex items-center"
        title="Historique en cours de constitution - pas encore assez de recul pour une tendance 7 jours fiable."
      >
        <History className="size-3.5" />
      </span>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={path.isUp ? "text-gain" : "text-loss"}
      aria-hidden="true"
    >
      <path
        d={path.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
