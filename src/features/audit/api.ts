import { httpClient } from "@/lib/http-client"
import type { AuditLogEntry, Paginated } from "@/types/api"

// "all" is admin-only (403 otherwise) and adds `user: {id, name}` to each
// entry; "mine" is the default, same as sending no scope at all.
export type AuditScope = "mine" | "all"

export async function getAuditLogs(page: number, scope: AuditScope) {
  const { data } = await httpClient.get<Paginated<AuditLogEntry>>("/api/audit-logs", {
    params: { page, scope },
  })
  return data
}
