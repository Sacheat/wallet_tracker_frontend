import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/format"

/**
 * Gain/loss is a status signal (good/critical), never color alone: every
 * value ships with a direction icon so it still reads for colorblind users.
 */
export function GainLossValue({
  value,
  className,
}: {
  value: number | null
  className?: string
}) {
  if (value === null) {
    return (
      <span className={cn("text-muted-foreground inline-flex items-center gap-1", className)}>
        <Minus className="size-3.5" />
        {formatPercent(null)}
      </span>
    )
  }

  const isPositive = value > 0
  const isFlat = value === 0
  const Icon = isFlat ? Minus : isPositive ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        isFlat && "text-muted-foreground",
        isPositive && "text-gain",
        !isPositive && !isFlat && "text-loss",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {formatPercent(value)}
    </span>
  )
}
