import { MoreHorizontal, TriangleAlert, Wallet } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatTile } from "@/components/StatTile"
import { AddPositionDialog } from "@/features/portfolio/AddPositionDialog"
import { EditQuantityDialog } from "@/features/portfolio/EditQuantityDialog"
import {
  useDeletePortfolioEntry,
  useMergedPortfolio,
  type PortfolioRow,
} from "@/features/portfolio/hooks"
import { ASSET_TYPE_LABELS, formatEur, formatQuantity, formatUsd } from "@/lib/format"
import { toApiError } from "@/lib/http-client"

export function PortfolioPage() {
  const { rows, totalValueUsd, totalValueEur, isLoading, isError, isValuationUnavailable } =
    useMergedPortfolio()
  const [editingRow, setEditingRow] = useState<PortfolioRow | null>(null)
  const [deletingRow, setDeletingRow] = useState<PortfolioRow | null>(null)
  const deleteEntry = useDeletePortfolioEntry()
  const navigate = useNavigate()

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Portefeuille</h1>
        <AddPositionDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Valeur totale"
          value={totalValueUsd !== null ? formatUsd(totalValueUsd) : "—"}
          secondaryValue={totalValueEur !== null ? `${formatEur(totalValueEur)}` : undefined}
          icon={<Wallet className="size-4.5" />}
        />
      </div>

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
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actif</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.entryId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/assets/${row.assetId}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.assetLogoUrl ? (
                        <img
                          src={row.assetLogoUrl}
                          alt=""
                          className="size-5 rounded-full"
                        />
                      ) : (
                        <div className="bg-muted size-5 rounded-full" />
                      )}
                      <span>{row.assetName}</span>
                      <span className="text-muted-foreground">{row.assetSymbol}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ASSET_TYPE_LABELS[row.assetType]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.platformName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(row.quantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.valueUsd !== null ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{formatUsd(row.valueUsd)}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatEur(row.valueEur ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
                        <DropdownMenuItem onClick={() => setEditingRow(row)}>
                          Modifier la quantité
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingRow(row)}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditQuantityDialog
        row={editingRow}
        onOpenChange={(open) => !open && setEditingRow(null)}
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
