import { useId, useMemo, useRef, useState } from "react"
import { parseApiDate } from "@/lib/parse-date"
import type { PricePoint } from "@/types/api"

const WIDTH = 480
const HEIGHT = 140
const PAD_X = 8
const PAD_TOP = 24
const PAD_BOTTOM = 8

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function PriceHistoryChart({
  points,
  formatPrice,
}: {
  points: PricePoint[]
  // Points come in USD from the API; the caller supplies the conversion to
  // the user's preferred currency (useCurrency().format) so this component
  // stays currency-agnostic - only the label changes, not the plotted shape
  // (a uniform FX rate is just a linear rescale, geometry stays in raw USD).
  formatPrice: (amountUsd: number) => string
}) {
  const gradientId = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const data = useMemo(
    () =>
      points
        .map((p) => ({ price: Number(p.price_usd), date: parseApiDate(p.recorded_at) }))
        .filter((p): p is { price: number; date: Date } => p.date !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [points],
  )

  const geometry = useMemo(() => {
    if (data.length < 2) return null
    const prices = data.map((d) => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const times = data.map((d) => d.date.getTime())
    const minTime = times[0]
    const maxTime = times[times.length - 1]
    const timeRange = maxTime - minTime || 1

    const xFor = (time: number) =>
      PAD_X + ((time - minTime) / timeRange) * (WIDTH - PAD_X * 2)
    const yFor = (price: number) =>
      PAD_TOP + (1 - (price - min) / range) * (HEIGHT - PAD_TOP - PAD_BOTTOM)

    const coords = data.map((d) => ({ x: xFor(d.date.getTime()), y: yFor(d.price) }))
    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ")
    const areaPath = `${linePath} L${coords[coords.length - 1].x},${HEIGHT - PAD_BOTTOM} L${coords[0].x},${HEIGHT - PAD_BOTTOM} Z`

    return { coords, linePath, areaPath, xFor }
  }, [data])

  if (!geometry || data.length < 2) {
    return (
      <div className="text-muted-foreground flex h-[140px] items-center justify-center text-sm">
        Pas encore assez d'historique pour un graphique.
      </div>
    )
  }

  const { coords, linePath, areaPath } = geometry
  const lastIndex = coords.length - 1
  const activeIndex = hoverIndex ?? lastIndex
  const active = coords[activeIndex]
  const activeDatum = data[activeIndex]

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let nearestDist = Infinity
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relativeX)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Historique de prix sur 7 jours, dernier prix ${formatPrice(data[lastIndex].price)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hoverIndex !== null && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--border)"
            strokeWidth={1}
          />
        )}

        <circle
          cx={active.x}
          cy={active.y}
          r={4}
          fill="var(--primary)"
          stroke="var(--card)"
          strokeWidth={2}
        />

        <rect
          x={0}
          y={0}
          width={WIDTH}
          height={HEIGHT}
          fill="transparent"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex(lastIndex)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHoverIndex((i) => Math.max(0, (i ?? lastIndex) - 1))
            if (e.key === "ArrowRight")
              setHoverIndex((i) => Math.min(lastIndex, (i ?? lastIndex) + 1))
          }}
          tabIndex={0}
          className="cursor-crosshair outline-none"
        />
      </svg>

      <div
        className="border-border bg-popover text-popover-foreground pointer-events-none absolute top-0 rounded-md border px-2 py-1 text-xs shadow-sm"
        style={{
          left: `${(active.x / WIDTH) * 100}%`,
          transform: active.x > WIDTH / 2 ? "translateX(-100%)" : undefined,
        }}
      >
        <div className="font-medium tabular-nums">{formatPrice(activeDatum.price)}</div>
        <div className="text-muted-foreground">{dateFormatter.format(activeDatum.date)}</div>
      </div>
    </div>
  )
}
