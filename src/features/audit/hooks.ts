import { keepPreviousData, useQuery } from "@tanstack/react-query"
import * as auditApi from "@/features/audit/api"

export function useAuditLogs(page: number) {
  return useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => auditApi.getAuditLogs(page),
    placeholderData: keepPreviousData,
  })
}
