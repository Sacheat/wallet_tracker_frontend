import { formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/types/api"

/**
 * A gain/loss amount: explicit +/− sign (so it reads without color, same
 * rule as GainLossValue) plus the gain/loss color. The amount is displayed
 * as-is in `currency` - callers pass a figure already in that currency.
 */
export function SignedMoney({
  value,
  currency,
  className,
}: {
  value: number | null
  currency: CurrencyCode
  className?: string
}) {
  if (value === null) return <span className={cn("text-muted-foreground", className)}>—</span>
  const isFlat = value === 0
  const sign = isFlat ? "" : value > 0 ? "+" : "−"
  return (
    <span
      className={cn(
        "tabular-nums",
        isFlat && "text-muted-foreground",
        value > 0 && "text-gain",
        value < 0 && "text-loss",
        className,
      )}
    >
      {sign}
      {formatMoney(Math.abs(value), currency)}
    </span>
  )
}
