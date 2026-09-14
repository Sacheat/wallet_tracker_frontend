import { TriangleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useFearGreedIndex } from "@/features/market/hooks"

function sentimentClass(classification: string) {
  const normalized = classification.toLowerCase()
  if (normalized.includes("fear")) return "bg-loss"
  if (normalized.includes("greed")) return "bg-gain"
  return "bg-muted-foreground"
}

export function FearGreedGauge() {
  const { data, isLoading, isError } = useFearGreedIndex()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Fear &amp; Greed Index</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : isError || !data ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <TriangleAlert className="size-4 shrink-0" />
            Indice indisponible pour le moment.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {data.value}
              </span>
              <span className="text-muted-foreground text-sm">/ 100 · {data.classification}</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  sentimentClass(data.classification),
                )}
                style={{ width: `${data.value}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Sentiment du marché crypto uniquement — pas représentatif d'un
              portefeuille actions/or.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
