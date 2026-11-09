import { CloudOff, Info } from "lucide-react"
import { useMemo, useState } from "react"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { prepareHistory } from "@/features/portfolio/history"
import { usePortfolioHistory } from "@/features/portfolio/hooks"
import { PortfolioHistoryChart } from "@/features/portfolio/PortfolioHistoryChart"
import { formatMoney } from "@/lib/currency"
import { toApiError } from "@/lib/http-client"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { HistoryRange } from "@/types/api"

const RANGES: ReadonlyArray<{ value: HistoryRange; label: string }> = [
  { value: "7d", label: "7 j" },
  { value: "30d", label: "30 j" },
  { value: "90d", label: "90 j" },
  { value: "1y", label: "1 an" },
]

const CHART_HEIGHT = "h-[240px]"

const shortDate = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" })
const formatDay = (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`))

export function PortfolioHistoryCard() {
  const [range, setRange] = useState<HistoryRange>("30d")
  const { currency } = useCurrency()
  const query = usePortfolioHistory(range)

  const prepared = useMemo(
    () => (query.data ? prepareHistory(query.data.points, currency) : null),
    [query.data, currency],
  )

  const data = prepared?.data ?? []
  const investedKnownDays = data.filter((d) => d.invested !== null).length
  // keepPreviousData: while the new range loads, the old curve stays
  // visible (dimmed) rather than collapsing to a skeleton.
  const isSwitching = query.isPlaceholderData && query.isFetching

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-sm">Évolution du portefeuille</CardTitle>
        <SegmentedControl
          label="Période"
          size="sm"
          value={range}
          onChange={setRange}
          options={RANGES}
        />
      </CardHeader>
      {/* minmax(0,1fr): a grid track otherwise grows to its content's
          min width - the SVG's - and the chart could never shrink below it. */}
      <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <Legend showInvested={investedKnownDays > 0} />

        {query.isPending ? (
          <Skeleton className={cn(CHART_HEIGHT, "w-full")} />
        ) : query.isError && !query.data ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
        ) : data.length < 2 ? (
          <div className={cn(CHART_HEIGHT, "text-muted-foreground flex items-center justify-center text-sm")}>
            {data.length === 0
              ? "Aucune position détenue sur cette période."
              : "Pas encore assez d'historique sur cette période."}
          </div>
        ) : (
          <div
            aria-busy={isSwitching}
            className={cn("min-w-0 transition-opacity", isSwitching && "opacity-50")}
          >
            <PortfolioHistoryChart data={data} currency={currency} range={range} />
          </div>
        )}

        {query.data && data.length >= 2 && (
          <Notes
            heldSince={prepared?.heldSince ?? null}
            investedKnownDays={investedKnownDays}
            totalDays={data.length}
            missingHistory={query.data.missing_history}
          />
        )}

        {data.length >= 2 && (
          <details className="text-sm">
            <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer text-xs">
              Voir les données ({data.length} jours)
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-xs tabular-nums">
                <thead className="bg-muted sticky top-0">
                  <tr className="text-muted-foreground text-left">
                    <th className="px-2 py-1.5 font-medium">Date</th>
                    <th className="px-2 py-1.5 text-right font-medium">Valeur</th>
                    <th className="px-2 py-1.5 text-right font-medium">Investi</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().map((d) => (
                    <tr key={d.date} className="border-t">
                      <td className="px-2 py-1">{formatDay(d.date)}</td>
                      <td className="px-2 py-1 text-right">{formatMoney(d.value, currency)}</td>
                      <td className="text-muted-foreground px-2 py-1 text-right">
                        {d.invested === null ? "—" : formatMoney(d.invested, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

function Legend({ showInvested }: { showInvested: boolean }) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="bg-primary inline-block h-0.5 w-4 rounded" aria-hidden />
        Valeur
      </span>
      <span className={cn("flex items-center gap-1.5", !showInvested && "opacity-50")}>
        <span className="border-muted-foreground inline-block w-4 border-t-2 border-dashed" aria-hidden />
        Capital investi
      </span>
      {showInvested && <span>L'écart entre les deux courbes est la plus-value latente.</span>}
    </div>
  )
}

function Notes({
  heldSince,
  investedKnownDays,
  totalDays,
  missingHistory,
}: {
  heldSince: string | null
  investedKnownDays: number
  totalDays: number
  missingHistory: string[]
}) {
  const notes: string[] = []
  if (heldSince) {
    notes.push(`Aucune position détenue avant le ${formatDay(heldSince)} : la courbe commence à cette date.`)
  }
  if (investedKnownDays === 0) {
    notes.push(
      "Capital investi inconnu sur cette période : renseigne les prix d'achat de tes positions pour afficher la seconde courbe.",
    )
  } else if (investedKnownDays < totalDays) {
    notes.push(
      "La courbe du capital investi s'interrompt les jours où une position sans prix d'achat est détenue.",
    )
  }
  if (missingHistory.length > 0) {
    notes.push(`Historique indisponible pour : ${missingHistory.join(", ")}. Ces actifs sont exclus de la courbe.`)
  }
  if (notes.length === 0) return null
  return (
    <ul className="text-muted-foreground grid gap-1 text-xs">
      {notes.map((note) => (
        <li key={note} className="flex items-start gap-1.5">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {note}
        </li>
      ))}
    </ul>
  )
}

function ErrorState({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown
  onRetry: () => void
  isRetrying: boolean
}) {
  const status = toApiError(error).status
  return (
    <div
      className={cn(
        CHART_HEIGHT,
        "text-muted-foreground flex flex-col items-center justify-center gap-3 text-center text-sm",
      )}
    >
      <CloudOff className="size-5" aria-hidden />
      <p>
        {status === 503
          ? "Historique indisponible pour le moment : les taux de change ne répondent pas."
          : "Impossible de charger l'historique."}
      </p>
      <Button size="sm" variant="outline" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Nouvel essai..." : "Réessayer"}
      </Button>
    </div>
  )
}
