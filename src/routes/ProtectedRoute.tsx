import { Navigate, Outlet, useLocation } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { FullPageSpinner } from "@/components/layout/FullPageSpinner"
import { VerifyEmailScreen } from "@/features/auth/VerifyEmailScreen"
import { useAuth } from "@/providers/AuthProvider"

export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Every /api/* call 403s for an unverified account (new signup, or an
  // email change - see PATCH /user), so there's nothing usable to show
  // underneath. Block the whole app instead of leaking 403s page by page.
  if (user?.email_verified_at === null) {
    return <VerifyEmailScreen />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
