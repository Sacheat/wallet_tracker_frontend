import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  Download,
  Layers,
  MoreHorizontal,
  Search,
  TrendingUp,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react"
import { Fragment, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EntityAvatar } from "@/components/EntityAvatar"
import { GainLossValue } from "@/components/GainLossValue"
import { MiniSparkline } from "@/components/MiniSparkline"
import { SignedMoney } from "@/components/SignedMoney"
import { StatTile } from "@/components/StatTile"
import { AddPositionDialog } from "@/features/portfolio/AddPositionDialog"
import { PortfolioHistoryCard } from "@/features/portfolio/PortfolioHistoryCard"
import { TransactionsDialog } from "@/features/portfolio/TransactionsDialog"
import {
  useDeletePortfolioEntry,
  usePortfolioTable,
  type PortfolioTableRow,
} from "@/features/portfolio/hooks"
import {
  ASSET_TYPE_CHART_CLASS,
  ASSET_TYPE_CHART_TEXT_CLASS,
  ASSET_TYPE_LABELS,
  formatQuantity,
  formatUsd,
} from "@/lib/format"
import { downloadCsv } from "@/lib/csv"
import { toApiError } from "@/lib/http-client"
import { formatMoney, formatUnitPrice } from "@/lib/currency"
import { useAnimatedNumber } from "@/lib/use-animated-number"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { CurrencyCode, PortfolioPerformanceTotals } from "@/types/api"

type SortKey = "value" | "name" | "type" | "platform" | "quantity" | "change24h" | "pnl"

const SORT_ACCESSORS: Record<SortKey, (row: PortfolioTableRow) => number | string> = {
  value: (r) => r.valueUsd ?? -Infinity,
  name: (r) => r.assetName.toLowerCase(),
  type: (r) => r.assetType,
  platform: (r) => r.platformName.toLowerCase(),
  quantity: (r) => Number(r.quantity),
  change24h: (r) => r.change24h ?? -Infinity,
  // No performance (price missing, valuation down) sorts as the lowest.
  pnl: (r) => r.performance?.unrealized_pnl ?? -Infinity,
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: "asc" | "desc"
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = activeKey === sortKey
  const Icon = isActive ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1 transition-colors",
          isActive && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  )
}

export function PortfolioPage() {
  const {
    rows,
    totalValueUsd,
    totalChangePercent,
    performanceTotals,
    positionsWithoutPrice,
    isLoading,
    isError,
    isValuationUnavailable,
  } = usePortfolioTable()
  const { currency, format } = useCurrency()
  const animatedTotalValueUsd = useAnimatedNumber(totalValueUsd)
  const [deletingRow, setDeletingRow] = useState<PortfolioTableRow | null>(null)
  const [transactionsRow, setTransactionsRow] = useState<PortfolioTableRow | null>(null)
  const [search, setSearch] = useState("")
  const [onlyMissingPrice, setOnlyMissingPrice] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [groupByPlatform, setGroupByPlatform] = useState(false)
  const deleteEntry = useDeletePortfolioEntry()
  const navigate = useNavigate()

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = rows.filter(
      (r) =>
        (!onlyMissingPrice || r.isMissingPrice) &&
        (!query ||
          r.assetName.toLowerCase().includes(query) ||
          r.assetSymbol.toLowerCase().includes(query) ||
          r.platformName.toLowerCase().includes(query)),
    )

    const accessor = SORT_ACCESSORS[sortKey]
    const sorted = [...filtered].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  }, [rows, search, onlyMissingPrice, sortKey, sortDir])

  const groups = useMemo(() => {
    if (!groupByPlatform) return null
    const byPlatform = new Map<string, PortfolioTableRow[]>()
    for (const row of filteredRows) {
      const list = byPlatform.get(row.platformName) ?? []
      list.push(row)
      byPlatform.set(row.platformName, list)
    }
    return [...byPlatform.entries()].sort(
      (a, b) =>
        b[1].reduce((s, r) => s + (r.valueUsd ?? 0), 0) -
        a[1].reduce((s, r) => s + (r.valueUsd ?? 0), 0),
    )
  }, [groupByPlatform, filteredRows])

  async function confirmDelete() {
    if (!deletingRow) return
    try {
      await deleteEntry.mutateAsync(deletingRow.entryId)
      toast.success("Position supprimée")
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setDeletingRow(null)
    }
  }

  function handleExport() {
    downloadCsv(
      "portefeuille.csv",
      filteredRows.map((r) => ({
        actif: r.assetName,
        symbole: r.assetSymbol,
        type: ASSET_TYPE_LABELS[r.assetType],
        plateforme: r.platformName,
        quantite: r.quantity,
        variation_24h: r.change24h ?? "",
        valeur_usd: r.valueUsd ?? "",
        valeur_eur: r.valueEur ?? "",
        // Performance columns are in the account currency, as served.
        devise_plus_values: currency,
        prix_de_revient: r.performance?.cost_basis ?? "",
        prix_moyen_achat: r.performance?.average_buy_price ?? "",
        plus_value_latente: r.performance?.unrealized_pnl ?? "",
        plus_value_latente_pct: r.performance?.unrealized_pnl_percent ?? "",
        plus_value_realisee: r.performance?.realized_pnl ?? "",
        prix_achat_manquant: r.isMissingPrice ? "oui" : "",
      })),
    )
  }

  function renderRow(row: PortfolioTableRow) {
    return (
      <TableRow
        key={row.entryId}
        className="cursor-pointer"
        onClick={() => navigate(`/assets/${row.assetId}`)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <EntityAvatar
              src={row.assetLogoUrl}
              label={row.assetSymbol}
              toneClassName={cn(
                `${ASSET_TYPE_CHART_CLASS[row.assetType]}/15`,
                ASSET_TYPE_CHART_TEXT_CLASS[row.assetType],
              )}
              className="size-5 text-[0.6rem]"
            />
            <span>{row.assetName}</span>
            <span className="text-muted-foreground">{row.assetSymbol}</span>
            {row.hasActiveAlert && (
              <Bell
                className="text-primary size-3.5 shrink-0"
                aria-label="Alerte active"
              />
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{ASSET_TYPE_LABELS[row.assetType]}</Badge>
        </TableCell>
        {!groupByPlatform && (
          <TableCell className="text-muted-foreground">{row.platformName}</TableCell>
        )}
        <TableCell className="text-right tabular-nums">
          <div className="flex flex-col">
            <span>{formatQuantity(row.quantity)}</span>
            {row.performance?.average_buy_price != null && (
              <span
                className="text-muted-foreground text-xs"
                title="Prix moyen d'achat (frais compris)"
              >
                PRU {formatUnitPrice(row.performance.average_buy_price, currency)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <GainLossValue value={row.change24h} className="justify-end" />
        </TableCell>
        <TableCell>
          <MiniSparkline points={row.history7d} />
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {row.isGoldUnavailable ? (
            <span
              className="text-muted-foreground inline-flex items-center gap-1 text-xs"
              title="Le cours de l'or provient d'une source non officielle, momentanément indisponible."
            >
              <TriangleAlert className="size-3.5" /> Indisponible
            </span>
          ) : row.valueUsd !== null ? (
            <div className="flex flex-col">
              <span className="font-medium">{format(row.valueUsd)}</span>
              {currency !== "USD" && (
                <span className="text-muted-foreground text-xs">
                  {formatUsd(row.valueUsd)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <PnlCell row={row} currency={currency} onFillPrice={() => setTransactionsRow(row)} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <MoreHorizontal />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTransactionsRow(row)}>
                Achats et ventes
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingRow(row)}>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Portefeuille</h1>
        <AddPositionDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          className="stat-hero"
          label="Valeur totale"
          value={animatedTotalValueUsd !== null ? format(animatedTotalValueUsd) : "—"}
          delta={totalChangePercent && <GainLossValue value={totalChangePercent["24h"]} />}
          secondaryValue={
            <div className="flex flex-col gap-1">
              {currency !== "USD" && animatedTotalValueUsd !== null && (
                <span>{formatUsd(animatedTotalValueUsd)}</span>
              )}
              {totalChangePercent && (
                <div className="flex gap-3 text-xs">
                  <span>1h <GainLossValue value={totalChangePercent["1h"]} /></span>
                  <span>7j <GainLossValue value={totalChangePercent["7d"]} /></span>
                </div>
              )}
              <Link to="/allocation" className="text-primary w-fit text-xs underline-offset-4 hover:underline">
                Voir la répartition par type →
              </Link>
            </div>
          }
          icon={<Wallet className="size-4.5" />}
        />
        <PerformanceTile
          totals={performanceTotals}
          positionsWithoutPrice={positionsWithoutPrice}
          isUnavailable={isValuationUnavailable}
          isLoading={isLoading}
          onShowMissing={() => setOnlyMissingPrice(true)}
        />
      </div>

      {rows.length > 0 && <PortfolioHistoryCard />}

      {isValuationUnavailable && (
        <div className="border-loss/30 bg-loss/5 text-loss flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <TriangleAlert className="size-4 shrink-0" />
          Les valorisations en direct sont indisponibles pour le moment — les
          quantités restent affichées.
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-muted-foreground text-sm">
          Impossible de charger le portefeuille pour le moment.
        </p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Wallet className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">Aucune position pour l'instant</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Ajoute ta première position pour commencer à suivre la valeur de
            ton portefeuille.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Filtrer par actif ou plateforme..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant={groupByPlatform ? "secondary" : "outline"}
              size="sm"
              onClick={() => setGroupByPlatform((g) => !g)}
            >
              <Layers /> Par plateforme
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download /> Export CSV
            </Button>
            {onlyMissingPrice && (
              <Button variant="secondary" size="sm" onClick={() => setOnlyMissingPrice(false)}>
                Prix d'achat à renseigner <X aria-label="Retirer le filtre" />
              </Button>
            )}
          </div>

          {filteredRows.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {onlyMissingPrice && !search
                ? "Tous les prix d'achat sont renseignés."
                : `Aucune position ne correspond à "${search}".`}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader label="Actif" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                    <SortHeader label="Type" sortKey="type" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                    {!groupByPlatform && (
                      <SortHeader
                        label="Plateforme"
                        sortKey="platform"
                        activeKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                    )}
                    <SortHeader
                      label="Quantité"
                      sortKey="quantity"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <SortHeader
                      label="24h"
                      sortKey="change24h"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <TableHead>7 jours</TableHead>
                    <SortHeader
                      label="Valeur"
                      sortKey="value"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <SortHeader
                      label="Plus-value"
                      sortKey="pnl"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups
                    ? groups.map(([platformName, platformRows]) => (
                        <Fragment key={`group-${platformName}`}>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={8} className="text-muted-foreground py-1.5 text-xs font-medium">
                              {platformName}
                              <span className="ml-2">
                                {format(
                                  platformRows.reduce((s, r) => s + (r.valueUsd ?? 0), 0),
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                          {platformRows.map(renderRow)}
                        </Fragment>
                      ))
                    : filteredRows.map(renderRow)}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <TransactionsDialog
        row={transactionsRow}
        onOpenChange={(open) => !open && setTransactionsRow(null)}
      />

      <AlertDialog open={deletingRow !== null} onOpenChange={(open) => !open && setDeletingRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette position ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingRow?.assetName} sur {deletingRow?.platformName} sera
              retiré de ton portefeuille. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Unrealized P&L of one row, in the account currency as served by the
 * backend. Fully sold positions show their realized gain instead (their
 * unrealized P&L is 0 by definition).
 */
function PnlCell({
  row,
  currency,
  onFillPrice,
}: {
  row: PortfolioTableRow
  currency: CurrencyCode
  onFillPrice: () => void
}) {
  if (row.isMissingPrice) {
    return (
      <button
        type="button"
        onClick={(e) => {
          // The row itself navigates to the asset page.
          e.stopPropagation()
          onFillPrice()
        }}
        className="text-warning text-xs whitespace-nowrap underline underline-offset-4"
      >
        Prix à renseigner
      </button>
    )
  }
  const perf = row.performance
  if (!perf) return <span className="text-muted-foreground">—</span>
  if (Number(row.quantity) === 0) {
    return (
      <div className="flex flex-col items-end">
        <SignedMoney value={perf.realized_pnl} currency={currency} className="font-medium" />
        <span className="text-muted-foreground text-xs">réalisée, soldée</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-end">
      <SignedMoney value={perf.unrealized_pnl} currency={currency} className="font-medium" />
      <GainLossValue value={perf.unrealized_pnl_percent} className="text-xs" />
    </div>
  )
}

function PerformanceTile({
  totals,
  positionsWithoutPrice,
  isUnavailable,
  isLoading,
  onShowMissing,
}: {
  totals: PortfolioPerformanceTotals | null
  positionsWithoutPrice: number
  isUnavailable: boolean
  isLoading: boolean
  onShowMissing: () => void
}) {
  const { currency } = useCurrency()
  const plural = positionsWithoutPrice > 1 ? "s" : ""

  const missingNote = positionsWithoutPrice > 0 && (
    <span className="text-xs">
      {positionsWithoutPrice} position{plural} sans prix d'achat, exclue{plural} du calcul.{" "}
      <button
        type="button"
        onClick={onShowMissing}
        className="text-primary underline-offset-4 hover:underline"
      >
        Les compléter
      </button>
    </span>
  )

  return (
    <StatTile
      label="Plus-value latente"
      icon={<TrendingUp className="size-4.5" />}
      value={
        isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : totals ? (
          <SignedMoney value={totals.unrealized_pnl} currency={currency} />
        ) : (
          "—"
        )
      }
      delta={totals && <GainLossValue value={totals.unrealized_pnl_percent} />}
      secondaryValue={
        isLoading ? null : isUnavailable ? (
          <span className="text-xs">Indisponible pour le moment.</span>
        ) : (
          <div className="flex flex-col gap-1">
            {totals ? (
              <span className="text-xs">
                Investi {formatMoney(totals.cost_basis, currency)} · Réalisée{" "}
                <SignedMoney value={totals.realized_pnl} currency={currency} />
              </span>
            ) : positionsWithoutPrice === 0 ? null : (
              <span className="text-xs">
                Renseigne les prix d'achat pour suivre ta plus-value.
              </span>
            )}
            {missingNote}
          </div>
        )
      }
    />
  )
}
