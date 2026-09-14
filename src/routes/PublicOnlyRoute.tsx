import { Navigate, Outlet } from "react-router-dom"
import { FullPageSpinner } from "@/components/layout/FullPageSpinner"
import { useAuth } from "@/providers/AuthProvider"

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}
