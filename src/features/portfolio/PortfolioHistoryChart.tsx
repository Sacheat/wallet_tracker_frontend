import { useEffect, useId, useMemo, useRef, useState } from "react"
import { SignedMoney } from "@/components/SignedMoney"
import { investedRuns, niceTicks, type HistoryDatum } from "@/features/portfolio/history"
import { formatMoney } from "@/lib/currency"
import type { CurrencyCode, HistoryRange } from "@/types/api"

const HEIGHT = 240
const MARGIN = { top: 12, right: 60, bottom: 28, left: 64 }
const LABEL_GAP = 14 // min vertical distance between the two end labels

// Dates are calendar days (YYYY-MM-DD, UTC): format in UTC so a viewer west
// of Greenwich doesn't see every point shifted to the day before.
function utcDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
}
const longDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })
const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" })

function compactMoney(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/ /g, " ")
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * Two lines on one y-axis (same unit, same currency): portfolio value and
 * invested capital (cost basis). The gap between them is the unrealized
 * gain. Invested is a dashed neutral reference line, drawn only on days it
 * is known - never as a fake zero.
 */
export function PortfolioHistoryChart({
  data,
  currency,
  range,
}: {
  data: HistoryDatum[]
  currency: CurrencyCode
  range: HistoryRange
}) {
  const [containerRef, width] = useWidth<HTMLDivElement>()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const gradientId = useId()

  const geometry = useMemo(() => {
    const plotW = Math.max(width - MARGIN.left - MARGIN.right, 50)
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom
    const values = data.flatMap((d) => (d.invested === null ? [d.value] : [d.value, d.invested]))
    const ticks = niceTicks(Math.min(...values), Math.max(...values))
    const yMin = ticks[0]
    const yMax = ticks[ticks.length - 1]
    const x = (i: number) => MARGIN.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
    const y = (v: number) => MARGIN.top + (1 - (v - yMin) / (yMax - yMin || 1)) * plotH

    const valuePath = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join("")
    const areaPath = `${valuePath}L${x(data.length - 1)},${y(yMin)}L${x(0)},${y(yMin)}Z`
    const investedPaths = investedRuns(data).map(([start, end]) =>
      data
        .slice(start, end + 1)
        .map((d, k) => `${k ? "L" : "M"}${x(start + k)},${y(d.invested!)}`)
        .join(""),
    )
    // A run of a single day has no length: mark it with a dot instead.
    const investedDots = investedRuns(data)
      .filter(([s, e]) => s === e)
      .map(([s]) => ({ cx: x(s), cy: y(data[s].invested!) }))

    return { plotW, plotH, ticks, x, y, valuePath, areaPath, investedPaths, investedDots, yMin }
  }, [data, width])

  const { ticks, x, y, valuePath, areaPath, investedPaths, investedDots } = geometry
  const last = data.length - 1
  const active = hoverIndex !== null ? data[hoverIndex] : null

  // Direct end labels, nudged apart when the two lines end close together.
  const endLabels = useMemo(() => {
    const labels: Array<{ text: string; y: number; dashed: boolean }> = [
      { text: "Valeur", y: y(data[last].value), dashed: false },
    ]
    const inv = data[last].invested
    if (inv !== null) labels.push({ text: "Investi", y: y(inv), dashed: true })
    if (labels.length === 2 && Math.abs(labels[0].y - labels[1].y) < LABEL_GAP) {
      const [top, bottom] = labels[0].y <= labels[1].y ? [labels[0], labels[1]] : [labels[1], labels[0]]
      const mid = (top.y + bottom.y) / 2
      top.y = mid - LABEL_GAP / 2
      bottom.y = mid + LABEL_GAP / 2
    }
    return labels
  }, [data, last, y])

  const xLabelIndexes = data.length > 2 ? [0, Math.floor(last / 2), last] : [0, last]
  const xFormat = range === "1y" && data.length > 120 ? monthYear : dayMonth

  function indexAt(clientX: number, target: SVGRectElement) {
    const rect = target.getBoundingClientRect()
    const relative = (clientX - rect.left) / rect.width
    return Math.min(last, Math.max(0, Math.round(relative * last)))
  }

  const first = data[0]
  const summary = `Valeur du portefeuille du ${longDate.format(utcDate(first.date))} au ${longDate.format(
    utcDate(data[last].date),
  )} : de ${formatMoney(first.value, currency)} à ${formatMoney(data[last].value, currency)}.`

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <svg width={width} height={HEIGHT} role="img" aria-label={summary} className="block overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive grid + y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + geometry.plotW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {compactMoney(t, currency)}
            </text>
          </g>
        ))}

        {xLabelIndexes.map((i, k) => (
          <text
            key={i}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={k === 0 ? "start" : k === xLabelIndexes.length - 1 ? "end" : "middle"}
            className="fill-muted-foreground text-[11px]"
          >
            {xFormat.format(utcDate(data[i].date))}
          </text>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        {investedPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        ))}
        {investedDots.map((dot, i) => (
          <circle key={i} {...dot} r={2.5} fill="var(--muted-foreground)" />
        ))}
        <path
          d={valuePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Direct labels at the line ends (text in ink tokens, not series color) */}
        {endLabels.map((label) => (
          <text
            key={label.text}
            x={x(last) + 8}
            y={label.y}
            dominantBaseline="middle"
            className={label.dashed ? "fill-muted-foreground text-xs" : "fill-foreground text-xs font-medium"}
          >
            {label.text}
          </text>
        ))}

        {active && hoverIndex !== null && (
          <g pointerEvents="none">
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={MARGIN.top}
              y2={MARGIN.top + geometry.plotH}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            {active.invested !== null && (
              <circle
                cx={x(hoverIndex)}
                cy={y(active.invested)}
                r={4}
                fill="var(--muted-foreground)"
                stroke="var(--card)"
                strokeWidth={2}
              />
            )}
            <circle
              cx={x(hoverIndex)}
              cy={y(active.value)}
              r={4.5}
              fill="var(--primary)"
              stroke="var(--card)"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Hit area: the whole plot, larger than the marks. */}
        <rect
          x={MARGIN.left}
          y={0}
          width={geometry.plotW}
          height={HEIGHT}
          fill="transparent"
          tabIndex={0}
          aria-label="Parcourir la courbe avec les flèches gauche et droite"
          className="cursor-crosshair outline-none focus-visible:stroke-[var(--ring)]"
          onPointerMove={(e) => setHoverIndex(indexAt(e.clientX, e.currentTarget))}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex(last)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault()
              setHoverIndex((i) => Math.max(0, (i ?? last) - 1))
            } else if (e.key === "ArrowRight") {
              e.preventDefault()
              setHoverIndex((i) => Math.min(last, (i ?? last) + 1))
            } else if (e.key === "Home") {
              setHoverIndex(0)
            } else if (e.key === "End") {
              setHoverIndex(last)
            }
          }}
        />
      </svg>

      {active && hoverIndex !== null && (
        <div
          role="status"
          className="border-border bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 min-w-44 rounded-md border px-2.5 py-2 text-xs shadow-md"
          style={{
            left: x(hoverIndex),
            transform:
              x(hoverIndex) > width / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}
        >
          <div className="text-muted-foreground mb-1.5 first-letter:uppercase">
            {longDate.format(utcDate(active.date))}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="flex items-center gap-1.5">
              <span className="bg-primary inline-block h-0.5 w-3 rounded" aria-hidden />
              Valeur
            </dt>
            <dd className="text-right font-medium tabular-nums">{formatMoney(active.value, currency)}</dd>
            <dt className="flex items-center gap-1.5">
              <span className="border-muted-foreground inline-block w-3 border-t-2 border-dashed" aria-hidden />
              Investi
            </dt>
            <dd className="text-right tabular-nums">
              {active.invested === null ? (
                <span className="text-muted-foreground">inconnu</span>
              ) : (
                formatMoney(active.invested, currency)
              )}
            </dd>
            {active.invested !== null && (
              <>
                <dt>Plus-value</dt>
                <dd className="text-right">
                  <SignedMoney value={active.value - active.invested} currency={currency} />
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
