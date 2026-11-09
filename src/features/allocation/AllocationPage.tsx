import { ArrowDown, ArrowUp, Info, Target, TriangleAlert } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAllocation, useAllocationTargets } from "@/features/allocation/hooks"
import { formatPercentValue } from "@/features/allocation/schemas"
import { TargetsDialog } from "@/features/allocation/TargetsDialog"
import { ASSET_TYPE_CHART_CLASS, ASSET_TYPE_LABELS, ASSET_TYPE_ORDER } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { AllocationByType, AllocationResponse, AssetType } from "@/types/api"

// Drift (in points) from which a type is flagged. Display only - the
// allocation_drift alert has its own user-chosen threshold.
const DRIFT_WARNING = 5

function pct(value: number | null) {
  return value === null ? "—" : `${formatPercentValue(value)} %`
}

function signedPoints(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatPercentValue(Math.abs(value))} pts`
}

/**
 * Amounts from /api/allocation are USD. Converting them with the current
 * rate (useCurrency().format) is correct here, unlike performance/history:
 * nothing in this screen is historical.
 */
export function AllocationPage() {
  const { currency, format } = useCurrency()
  const [contributionInput, setContributionInput] = useState("")
  const debouncedInput = useDebouncedValue(contributionInput, 500)
  const parsed = Number(debouncedInput.replace(",", "."))
  const typedContribution =
    debouncedInput.trim() !== "" && Number.isFinite(parsed) && parsed > 0 ? parsed : null

  const targetsQuery = useAllocationTargets()
  const hasTargets = Object.keys(targetsQuery.data ?? {}).length > 0
  // ?contribution= without targets is a 422: never send it then. Otherwise,
  // clearing the targets with an amount still typed would refetch with it,
  // fail, and leave the previous "with targets" view on screen.
  const contribution = hasTargets ? typedContribution : null
  const allocation = useAllocation(contribution)
  const [editingTargets, setEditingTargets] = useState(false)

  // Empty the field when targets go away (adjust-state-during-render
  // pattern, rather than an effect that would render a stale frame).
  const [hadTargets, setHadTargets] = useState(hasTargets)
  if (hadTargets !== hasTargets) {
    setHadTargets(hasTargets)
    if (!hasTargets) setContributionInput("")
  }

  const data = allocation.data
  const currentPercents = useMemo(() => {
    const result: Partial<Record<AssetType, number>> = {}
    for (const row of data?.by_type ?? []) if ((row.percent ?? 0) > 0) result[row.type] = row.percent!
    return result
  }, [data])

  const inputIsInvalid = debouncedInput.trim() !== "" && typedContribution === null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Répartition</h1>
          {data && data.total_value_usd > 0 && (
            <p className="text-muted-foreground text-sm">{format(data.total_value_usd)} au total</p>
          )}
        </div>
        {data?.has_targets && (
          <Button variant="outline" onClick={() => setEditingTargets(true)}>
            <Target /> Modifier les objectifs
          </Button>
        )}
      </div>

      {allocation.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : allocation.isError && !data ? (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-start gap-3 text-sm">
            Impossible de charger la répartition.
            <Button size="sm" variant="outline" onClick={() => allocation.refetch()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : !data || data.total_value_usd <= 0 ? (
        <Card>
          <CardContent className="text-muted-foreground text-sm">
            Ajoute des positions à ton portefeuille pour voir sa répartition.
          </CardContent>
        </Card>
      ) : (
        <>
          {data.has_targets ? (
            <TargetsCard
              data={data}
              contribution={contribution}
              contributionInput={contributionInput}
              onContributionChange={setContributionInput}
              inputIsInvalid={inputIsInvalid}
              isRecomputing={allocation.isFetching && allocation.isPlaceholderData}
              contributionError={
                allocation.isError ? toApiError(allocation.error).message : null
              }
              currencyLabel={currency}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Par type d'actif</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <RankedBars
                  label="Répartition par type d'actif"
                  rows={sortByOrder(data.by_type).map((row) => ({
                    key: row.type,
                    name: ASSET_TYPE_LABELS[row.type],
                    percent: row.percent,
                    valueUsd: row.value_usd,
                    colorClass: ASSET_TYPE_CHART_CLASS[row.type],
                  }))}
                />
                <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Target className="text-primary mt-0.5 size-4 shrink-0" />
                    <span>
                      Fixe une part cible pour chaque type d'actif : tu verras ton écart, les
                      montants pour rééquilibrer et où placer ton prochain apport.
                    </span>
                  </div>
                  <Button size="sm" onClick={() => setEditingTargets(true)}>
                    Définir mes objectifs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Par plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars
                  label="Répartition par plateforme"
                  rows={data.by_platform.map((row) => ({
                    key: row.platform,
                    name: row.platform,
                    percent: row.percent,
                    valueUsd: row.value_usd,
                    // Neutral: the categorical hues already mean asset types.
                    colorClass: "bg-muted-foreground/70",
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Par actif</CardTitle>
                <CardDescription className="text-xs">
                  Toutes plateformes confondues, couleur selon le type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RankedBars
                  label="Répartition par actif"
                  rows={data.by_asset.map((row) => ({
                    key: row.asset,
                    name: row.asset,
                    percent: row.percent,
                    valueUsd: row.value_usd,
                    colorClass: ASSET_TYPE_CHART_CLASS[row.asset_type],
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <TargetsDialog
        open={editingTargets}
        onOpenChange={setEditingTargets}
        targets={targetsQuery.data ?? {}}
        currentPercents={currentPercents}
      />
    </div>
  )
}

// Fixed type order (same as colors elsewhere), never re-sorted by value.
function sortByOrder(rows: AllocationByType[]) {
  return [...rows].sort((a, b) => ASSET_TYPE_ORDER.indexOf(a.type) - ASSET_TYPE_ORDER.indexOf(b.type))
}

/** Horizontal bars, one per row, on a common 0-100 % scale. */
function RankedBars({
  label,
  rows,
}: {
  label: string
  rows: Array<{ key: string; name: string; percent: number | null; valueUsd: number; colorClass: string }>
}) {
  const { format } = useCurrency()
  return (
    <ul aria-label={label} className="grid gap-3">
      {rows.map((row) => (
        <li key={row.key} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={cn("size-2.5 shrink-0 rounded-full", row.colorClass)} aria-hidden />
              <span className="truncate">{row.name}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{pct(row.percent)}</span>
              <span className="text-muted-foreground ml-2 text-xs">{format(row.valueUsd)}</span>
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", row.colorClass)}
              style={{ width: `${Math.min(row.percent ?? 0, 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function TargetsCard({
  data,
  contribution,
  contributionInput,
  onContributionChange,
  inputIsInvalid,
  isRecomputing,
  contributionError,
  currencyLabel,
}: {
  data: AllocationResponse
  contribution: number | null
  contributionInput: string
  onContributionChange: (value: string) => void
  inputIsInvalid: boolean
  isRecomputing: boolean
  contributionError: string | null
  currencyLabel: string
}) {
  const { format } = useCurrency()
  const rows = sortByOrder(data.by_type)
  const maxDrift = data.max_drift ?? 0

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle className="text-sm">Par type d'actif, par rapport à tes objectifs</CardTitle>
          <CardDescription className="text-xs">
            Barre : part actuelle. Trait vertical : objectif.
          </CardDescription>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
            Math.abs(maxDrift) >= DRIFT_WARNING
              ? "border-warning/40 bg-warning/10"
              : "text-muted-foreground",
          )}
        >
          {Math.abs(maxDrift) >= DRIFT_WARNING && <TriangleAlert className="text-warning size-3.5" />}
          Écart max : <span className="font-semibold tabular-nums">{formatPercentValue(Math.abs(maxDrift))} pts</span>
        </span>
      </CardHeader>
      <CardContent className="grid gap-5">
        <ul className="grid gap-4">
          {rows.map((row) => (
            <TypeTargetRow key={row.type} row={row} contribution={contribution} />
          ))}
        </ul>

        <div className="grid gap-2 rounded-lg border p-3">
          <Label htmlFor="contribution" className="text-sm">
            J'ai une somme à investir
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-44">
              <Input
                id="contribution"
                inputMode="decimal"
                placeholder="1000"
                value={contributionInput}
                onChange={(e) => onContributionChange(e.target.value)}
                aria-invalid={inputIsInvalid || undefined}
                aria-describedby="contribution-help"
                className="pr-12"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs">
                {currencyLabel}
              </span>
            </div>
            {contributionInput && (
              <Button variant="ghost" size="sm" onClick={() => onContributionChange("")}>
                Effacer
              </Button>
            )}
            {isRecomputing && <span className="text-muted-foreground text-xs">Calcul…</span>}
          </div>
          <p id="contribution-help" className="text-muted-foreground text-xs">
            {inputIsInvalid ? (
              <span className="text-destructive">Saisis un montant positif.</span>
            ) : contributionError ? (
              <span className="text-destructive">{contributionError}</span>
            ) : contribution ? (
              <>
                Répartition de {format(rows.reduce((s, r) => s + (r.contribution_usd ?? 0), 0))} sur
                les types en sous-poids, sans rien vendre (voir « Apport » sur chaque ligne).
              </>
            ) : (
              "Indique un montant pour savoir où le placer sans rien vendre."
            )}
          </p>
        </div>

        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Le rééquilibrage complet indique quoi acheter et vendre pour retomber pile sur tes
          objectifs, à valeur totale constante. Montants convertis au taux de change du jour.
        </p>
      </CardContent>
    </Card>
  )
}

function TypeTargetRow({ row, contribution }: { row: AllocationByType; contribution: number | null }) {
  const { format } = useCurrency()
  const percent = row.percent ?? 0
  const target = row.target_percent ?? 0
  const drift = row.drift ?? 0
  const flagged = Math.abs(drift) >= DRIFT_WARNING
  const rebalance = row.rebalance_usd ?? 0
  const contributionUsd = row.contribution_usd ?? 0

  return (
    <li className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <span className={cn("size-2.5 rounded-full", ASSET_TYPE_CHART_CLASS[row.type])} aria-hidden />
          {ASSET_TYPE_LABELS[row.type]}
        </span>
        <span className="tabular-nums">
          {pct(row.percent)} <span className="text-muted-foreground">/ objectif {pct(row.target_percent)}</span>
        </span>
      </div>

      {/* Bullet bar: fill = current share, tick = target, same 0-100 % scale. */}
      <div
        className="bg-muted relative h-2.5 rounded-full"
        role="img"
        aria-label={`${ASSET_TYPE_LABELS[row.type]} : ${pct(row.percent)}, objectif ${pct(row.target_percent)}`}
      >
        <div
          className={cn("h-full rounded-full", ASSET_TYPE_CHART_CLASS[row.type])}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
        <div
          className="bg-foreground ring-card absolute -top-1 h-4.5 w-0.5 rounded-full ring-2"
          style={{ left: `calc(${Math.min(target, 100)}% - 1px)` }}
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 tabular-nums",
            flagged ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {flagged && <TriangleAlert className="text-warning size-3.5" aria-hidden />}
          {drift > 0 ? <ArrowUp className="size-3" aria-hidden /> : drift < 0 ? <ArrowDown className="size-3" aria-hidden /> : null}
          Écart {signedPoints(drift)}
          {drift !== 0 && <span className="text-muted-foreground font-normal">({drift > 0 ? "surpondéré" : "sous-pondéré"})</span>}
        </span>
        <span className="text-muted-foreground">
          Rééquilibrage :{" "}
          {Math.abs(rebalance) < 0.01 ? (
            "—"
          ) : (
            <span className="text-foreground font-medium tabular-nums">
              {rebalance > 0 ? "acheter" : "vendre"} {format(Math.abs(rebalance))}
            </span>
          )}
        </span>
        {contribution !== null && (
          <span className="text-muted-foreground">
            Apport :{" "}
            <span className={cn("tabular-nums", contributionUsd > 0 && "text-foreground font-medium")}>
              {contributionUsd > 0 ? `+${format(contributionUsd)}` : "—"}
            </span>
          </span>
        )}
      </div>
    </li>
  )
}
