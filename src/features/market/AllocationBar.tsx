import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortfolio } from "@/features/portfolio/hooks"
import { ASSET_TYPE_CHART_CLASS, ASSET_TYPE_LABELS, ASSET_TYPE_ORDER } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { AssetType } from "@/types/api"

export function AllocationBar() {
  const { data, isLoading } = usePortfolio()
  const { format } = useCurrency()

  if (isLoading) {
    return (
      <Card data-tour="market-allocation">
        <CardHeader>
          <CardTitle className="text-sm">Répartition par type d'actif</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const rows = data?.data ?? []
  const total = data?.total_value_usd ?? 0

  if (rows.length === 0 || total <= 0) {
    return (
      <Card data-tour="market-allocation">
        <CardHeader>
          <CardTitle className="text-sm">Répartition par type d'actif</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Ajoute des positions à ton portefeuille pour voir la répartition.
        </CardContent>
      </Card>
    )
  }

  const totalsByType = new Map<AssetType, number>()
  for (const row of rows) {
    totalsByType.set(row.asset_type, (totalsByType.get(row.asset_type) ?? 0) + row.value_usd)
  }

  const segments = ASSET_TYPE_ORDER.filter((type) => (totalsByType.get(type) ?? 0) > 0).map(
    (type) => ({
      type,
      value: totalsByType.get(type)!,
      percent: (totalsByType.get(type)! / total) * 100,
    }),
  )

  const legend = [...segments].sort((a, b) => b.value - a.value)

  return (
    <Card data-tour="market-allocation">
      <CardHeader>
        <CardTitle className="text-sm">Répartition par type d'actif</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="bg-muted flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
          {segments.map((segment) => (
            <div
              key={segment.type}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", ASSET_TYPE_CHART_CLASS[segment.type])}
              style={{ width: `${segment.percent}%` }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {legend.map((segment) => (
            <li key={segment.type} className="flex items-center gap-1.5 text-sm">
              <span className={cn("size-2.5 shrink-0 rounded-full", ASSET_TYPE_CHART_CLASS[segment.type])} />
              <span className="text-muted-foreground">{ASSET_TYPE_LABELS[segment.type]}</span>
              <span className="font-medium tabular-nums">
                {segment.percent.toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">{format(total)} au total</p>
      </CardContent>
    </Card>
  )
}
