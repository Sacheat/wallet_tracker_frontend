import { ChevronLeft, ChevronRight, History } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
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
import { useAuditLogs } from "@/features/audit/hooks"
import { parseApiDate } from "@/lib/parse-date"
import type { AuditLogEntry } from "@/types/api"

const MODEL_LABELS: Record<string, string> = {
  Asset: "Actif",
  Platform: "Plateforme",
  PortfolioEntry: "Position",
  PriceAlert: "Alerte de prix",
}

const ACTION_LABELS: Record<AuditLogEntry["action"], string> = {
  created: "Créé",
  updated: "Modifié",
  deleted: "Supprimé",
}

const ACTION_VARIANTS: Record<AuditLogEntry["action"], "default" | "secondary" | "destructive"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
}

function modelLabel(auditableType: string) {
  const shortName = auditableType.split("\\").pop() ?? auditableType
  return MODEL_LABELS[shortName] ?? shortName
}

export function AuditPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isPlaceholderData } = useAuditLogs(page)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Historique</h1>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <History className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">Aucune action enregistrée pour l'instant</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Chaque création, modification ou suppression que tu fais apparaîtra
            ici.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Champs modifiés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {parseApiDate(entry.created_at)?.toLocaleString("fr-FR") ?? "—"}
                    </TableCell>
                    <TableCell>{modelLabel(entry.auditable_type)}</TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[entry.action]}>
                        {ACTION_LABELS[entry.action]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {Object.keys(entry.changes ?? {}).join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">{data.total} actions au total</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft /> Précédent
              </Button>
              <span className="text-muted-foreground text-sm">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.next_page_url || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
