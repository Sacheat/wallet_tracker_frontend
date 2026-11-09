import { ChevronLeft, ChevronRight, History } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AuditScope } from "@/features/audit/api"
import { useAuditLogs } from "@/features/audit/hooks"
import { toApiError } from "@/lib/http-client"
import { getInitials } from "@/lib/initials"
import { parseApiDate } from "@/lib/parse-date"
import { safeImageUrl } from "@/lib/safe-url"
import { useAuth } from "@/providers/AuthProvider"
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

/**
 * Author cell of the global (admin) view. `source` tells an authorless
 * entry apart: "web" = the account was deleted since, "console" = system
 * action. A console entry can still have an author (scheduler-fired alerts
 * are attributed to the alert's owner) - shown normally, flagged automatic.
 * Entries from before `source` existed (null) can't be explained.
 */
function AuditAuthor({ entry }: { entry: AuditLogEntry }) {
  if (entry.user) {
    return (
      <span className="flex items-center gap-2">
        <Avatar className="size-6">
          <AvatarImage src={safeImageUrl(entry.user.avatar_url) ?? undefined} alt="" />
          <AvatarFallback className="text-[0.65rem]">
            {getInitials(entry.user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{entry.user.name}</span>
        {entry.source === "console" && (
          <span className="text-muted-foreground text-xs">· automatique</span>
        )}
      </span>
    )
  }
  if (entry.source === "web") {
    return <span className="text-muted-foreground">Compte supprimé</span>
  }
  if (entry.source === "console") {
    return <span className="text-muted-foreground">Système</span>
  }
  return (
    <span
      className="text-muted-foreground"
      title="Entrée antérieure au suivi de l'origine des actions : compte supprimé depuis, ou action système"
    >
      Auteur inconnu
    </span>
  )
}

function modelLabel(auditableType: string) {
  const shortName = auditableType.split("\\").pop() ?? auditableType
  return MODEL_LABELS[shortName] ?? shortName
}

export function AuditPage() {
  const { user } = useAuth()
  // is_admin only decides whether the choice is offered - a non-admin
  // asking for "all" would just get a 403, the backend stays the judge.
  const isAdmin = user?.is_admin === true
  const [requestedScope, setRequestedScope] = useState<AuditScope>("mine")
  const scope: AuditScope = isAdmin ? requestedScope : "mine"
  const isGlobal = scope === "all"
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, isPlaceholderData } = useAuditLogs(page, scope)

  function handleScopeChange(next: AuditScope) {
    setRequestedScope(next)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Historique</h1>
        {isAdmin && (
          <Tabs value={scope} onValueChange={(value) => handleScopeChange(value as AuditScope)}>
            <TabsList>
              <TabsTrigger value="mine">Mon historique</TabsTrigger>
              <TabsTrigger value="all">Tous les utilisateurs</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <History className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">Impossible de charger l'historique</p>
          <p className="text-muted-foreground max-w-sm text-sm">{toApiError(error).message}</p>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <History className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">Aucune action enregistrée pour l'instant</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {isGlobal
              ? "Aucun utilisateur n'a encore créé, modifié ou supprimé quoi que ce soit."
              : "Chaque création, modification ou suppression que tu fais apparaîtra ici."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {isGlobal && <TableHead>Auteur</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Champs modifiés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      <AuditDate value={entry.created_at} />
                    </TableCell>
                    {isGlobal && (
                      <TableCell>
                        <AuditAuthor entry={entry} />
                      </TableCell>
                    )}
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

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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

/** Date and time stacked on mobile, on one line from sm up. */
function AuditDate({ value }: { value: string }) {
  const date = parseApiDate(value)
  if (!date) return <>—</>
  return (
    <span className="flex flex-col sm:flex-row sm:gap-1">
      <span>{date.toLocaleDateString("fr-FR")}</span>
      <span className="text-xs sm:text-sm">{date.toLocaleTimeString("fr-FR")}</span>
    </span>
  )
}
