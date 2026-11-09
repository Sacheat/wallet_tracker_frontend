import { Bell, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAllocationTargets } from "@/features/allocation/hooks"
import { CreateAlertDialog } from "@/features/alerts/CreateAlertDialog"
import { EditAlertDialog } from "@/features/alerts/EditAlertDialog"
import { useAlerts, useDeleteAlert } from "@/features/alerts/hooks"
import { NotificationSettingsCard } from "@/features/alerts/NotificationSettingsCard"
import { ALERT_TYPE_LABELS, ALERT_WINDOW_LABELS } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { PriceAlert } from "@/types/api"

// alert.threshold always comes back in USD from the API - `format` (from
// useCurrency) converts it to the account's currency, the same round-trip
// the backend's own docs suggest for displaying it back.
function alertSummary(alert: PriceAlert, format: (amountUsd: number) => string) {
  const label = ALERT_TYPE_LABELS[alert.type]
  if (alert.type === "allocation_drift") {
    return `${label} ≥ ${Number(alert.percent_threshold).toLocaleString("fr-FR")} pts`
  }
  if (alert.type === "percent_change") {
    return `${alert.asset?.name ?? "Actif"} · ${label} ${Number(alert.percent_threshold)}% (${ALERT_WINDOW_LABELS[alert.window!]})`
  }
  const thresholdUsd = Number(alert.threshold ?? 0)
  if (alert.type === "portfolio_total_above" || alert.type === "portfolio_total_below") {
    return `${label} ${format(thresholdUsd)}`
  }
  return `${alert.asset?.name ?? "Actif"} · ${label} ${format(thresholdUsd)}`
}

export function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts()
  const targetsQuery = useAllocationTargets()
  // Clearing the targets keeps allocation_drift alerts (checked live), but
  // they can't fire any more - say so rather than show them as healthy.
  const targetsMissing =
    targetsQuery.isSuccess && Object.keys(targetsQuery.data ?? {}).length === 0
  const { format } = useCurrency()
  const deleteAlert = useDeleteAlert()
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null)
  const [deletingAlert, setDeletingAlert] = useState<PriceAlert | null>(null)

  async function confirmDelete() {
    if (!deletingAlert) return
    try {
      await deleteAlert.mutateAsync(deletingAlert.id)
      toast.success("Alerte supprimée")
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setDeletingAlert(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Alertes</h1>
        <CreateAlertDialog />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Bell className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">Aucune alerte configurée</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Crée une alerte pour être prévenu quand un actif ou ton portefeuille
            franchit un seuil.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alerte</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">
                    {alertSummary(alert, format)}
                    {alert.type === "allocation_drift" && targetsMissing && (
                      <p className="text-warning mt-0.5 text-xs font-normal">
                        Sans objectifs de répartition, cette alerte ne peut pas se déclencher.{" "}
                        <Link to="/allocation" className="underline underline-offset-4">
                          Les définir
                        </Link>
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.is_active ? "default" : "secondary"}>
                      {alert.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Actions">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingAlert(alert)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingAlert(alert)}
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

      <NotificationSettingsCard />

      <EditAlertDialog
        alert={editingAlert}
        onOpenChange={(open) => !open && setEditingAlert(null)}
      />

      <AlertDialog
        open={deletingAlert !== null}
        onOpenChange={(open) => !open && setDeletingAlert(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette alerte ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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
