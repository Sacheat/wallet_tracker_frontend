import { Navigate, Outlet, useLocation } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { FullPageSpinner } from "@/components/layout/FullPageSpinner"
import { useAuth } from "@/providers/AuthProvider"

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
