import { Minus, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeleteTransaction,
  useTransactions,
  type PortfolioRow,
} from "@/features/portfolio/hooks"
import { TransactionForm } from "@/features/portfolio/TransactionForm"
import { frenchDates } from "@/features/portfolio/schemas"
import { formatMoney, formatUnitPrice } from "@/lib/currency"
import { formatQuantity } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import type { PortfolioTransaction, TransactionType } from "@/types/api"

type View =
  | { kind: "list" }
  | { kind: "create"; type: TransactionType }
  | { kind: "edit"; transaction: PortfolioTransaction }
  | { kind: "delete"; transaction: PortfolioTransaction }

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  // executed_at is a calendar day stored as UTC midnight: rendering it in
  // the viewer's zone would show the day before anywhere west of UTC.
  timeZone: "UTC",
})

function formatTxDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

function describe(tx: PortfolioTransaction, symbol: string) {
  const what = tx.type === "buy" ? "l'achat" : "la vente"
  return `${what} de ${formatQuantity(tx.quantity)} ${symbol} du ${formatTxDate(tx.executed_at)}`
}

export function TransactionsDialog({
  row,
  onOpenChange,
}: {
  row: PortfolioRow | null
  onOpenChange: (open: boolean) => void
}) {
  const [view, setView] = useState<View>({ kind: "list" })

  return (
    <Dialog
      open={row !== null}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setView({ kind: "list" })
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {row && <DialogBody row={row} view={view} setView={setView} />}
      </DialogContent>
    </Dialog>
  )
}

function DialogBody({
  row,
  view,
  setView,
}: {
  row: PortfolioRow
  view: View
  setView: (view: View) => void
}) {
  const { data: transactions, isLoading, isError, refetch } = useTransactions(row.entryId)
  const deleteTx = useDeleteTransaction()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // position_quantity is the same on every item and is fresher than the
  // table row right after a write (no second round-trip needed).
  const heldQuantity = transactions?.[0]?.position_quantity ?? row.quantity
  const missingPrice = transactions?.filter((tx) => tx.unit_price === null) ?? []
  const backToList = () => {
    setDeleteError(null)
    setView({ kind: "list" })
  }

  async function confirmDelete(tx: PortfolioTransaction) {
    setDeleteError(null)
    try {
      await deleteTx.mutateAsync(tx.id)
      toast.success("Transaction supprimée")
      backToList()
    } catch (error) {
      // 422: removing this write would make a later sell impossible. Stay
      // on the confirmation so the explanation is read in context.
      const apiError = toApiError(error)
      const message = frenchDates(apiError.message)
      setDeleteError(
        apiError.status === 422
          ? `Suppression refusée : elle rendrait une vente ultérieure impossible. ${message}`
          : message,
      )
    }
  }

  const title =
    view.kind === "create"
      ? view.type === "buy"
        ? "Ajouter un achat"
        : "Ajouter une vente"
      : view.kind === "edit"
        ? "Corriger la transaction"
        : view.kind === "delete"
          ? "Supprimer la transaction ?"
          : "Achats et ventes"

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {row.assetName} · {row.platformName} — détenu : {formatQuantity(heldQuantity)}{" "}
          {row.assetSymbol}
        </DialogDescription>
      </DialogHeader>

      {view.kind === "create" && (
        <TransactionForm
          key={`create-${view.type}`}
          entryId={row.entryId}
          heldQuantity={heldQuantity}
          initialType={view.type}
          onDone={backToList}
          onCancel={backToList}
        />
      )}

      {view.kind === "edit" && (
        <TransactionForm
          key={`edit-${view.transaction.id}`}
          entryId={row.entryId}
          heldQuantity={heldQuantity}
          transaction={view.transaction}
          onDone={backToList}
          onCancel={backToList}
        />
      )}

      {view.kind === "delete" && (
        <div className="grid gap-4">
          <p className="text-sm">
            Supprimer {describe(view.transaction, row.assetSymbol)} ? La quantité de la
            position sera recalculée.
          </p>
          {deleteError && (
            <p role="alert" className="text-destructive text-sm">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={backToList} disabled={deleteTx.isPending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete(view.transaction)}
              disabled={deleteTx.isPending}
            >
              {deleteTx.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      )}

      {view.kind === "list" && (
        <div className="grid gap-4">
          {missingPrice.length > 0 && (
            <div className="border-warning/40 bg-warning/10 flex flex-wrap items-start gap-2 rounded-md border px-3 py-2 text-sm">
              <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 flex-1">
                Prix d'achat à renseigner : sans lui, la plus-value de cette position ne
                peut pas être calculée.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setView({ kind: "edit", transaction: missingPrice[0] })}
              >
                Renseigner le prix
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setView({ kind: "create", type: "buy" })}>
              <Plus /> Achat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setView({ kind: "create", type: "sell" })}
              disabled={Number(heldQuantity) <= 0}
            >
              <Minus /> Vente
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-destructive">Impossible de charger les transactions.</span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <TransactionsTable
              transactions={transactions}
              onEdit={(transaction) => setView({ kind: "edit", transaction })}
              onDelete={(transaction) => setView({ kind: "delete", transaction })}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Aucune transaction sur cette position.</p>
          )}
        </div>
      )}
    </>
  )
}

function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: PortfolioTransaction[]
  onEdit: (tx: PortfolioTransaction) => void
  onDelete: (tx: PortfolioTransaction) => void
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantité</TableHead>
            <TableHead className="text-right">Prix unitaire</TableHead>
            <TableHead className="text-right">Frais</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="tabular-nums">{formatTxDate(tx.executed_at)}</TableCell>
              <TableCell>
                <Badge variant={tx.type === "buy" ? "secondary" : "outline"}>
                  {tx.type === "buy" ? "Achat" : "Vente"}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {tx.type === "sell" ? "−" : "+"}
                {formatQuantity(tx.quantity)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {tx.unit_price === null ? (
                  <button
                    type="button"
                    className="text-warning underline underline-offset-4"
                    onClick={() => onEdit(tx)}
                  >
                    à renseigner
                  </button>
                ) : (
                  // As typed, in the transaction's own currency - never
                  // converted (that's what keeps per-currency P&L exact).
                  formatUnitPrice(Number(tx.unit_price), tx.currency)
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {Number(tx.fee) === 0 ? "—" : formatMoney(Number(tx.fee), tx.currency)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Corriger la transaction du ${formatTxDate(tx.executed_at)}`}
                    onClick={() => onEdit(tx)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Supprimer la transaction du ${formatTxDate(tx.executed_at)}`}
                    onClick={() => onDelete(tx)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
