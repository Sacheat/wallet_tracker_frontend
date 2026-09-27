import { useQuery } from "@tanstack/react-query"
import * as auditApi from "@/features/audit/api"
import type { AuditScope } from "@/features/audit/api"

export function useAuditLogs(page: number, scope: AuditScope) {
  return useQuery({
    // Scope is part of the key: "mine" and "all" are different data sets
    // (and different permissions) that must never be served for each other.
    queryKey: ["audit-logs", scope, page],
    queryFn: () => auditApi.getAuditLogs(page, scope),
    // Keep the previous page on screen while the next one loads - but only
    // within the same scope. Switching to "all" must not briefly show the
    // user's own history under a "Tous les utilisateurs" heading, or the
    // reverse.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === scope ? previousData : undefined,
  })
}
