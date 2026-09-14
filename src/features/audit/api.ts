import { httpClient } from "@/lib/http-client"
import type { AuditLogEntry, Paginated } from "@/types/api"

export async function getAuditLogs(page: number) {
  const { data } = await httpClient.get<Paginated<AuditLogEntry>>("/api/audit-logs", {
    params: { page },
  })
  return data
}
