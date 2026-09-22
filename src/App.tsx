import { QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { OfflineBanner } from "@/components/OfflineBanner"
import { Toaster } from "@/components/ui/sonner"
import { AccountPage } from "@/features/account/AccountPage"
import { AlertsPage } from "@/features/alerts/AlertsPage"
import { AssetDetailPage } from "@/features/assets/AssetDetailPage"
import { AuditPage } from "@/features/audit/AuditPage"
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage"
import { CatalogPage } from "@/features/catalog/CatalogPage"
import { MarketPage } from "@/features/market/MarketPage"
import { PortfolioPage } from "@/features/portfolio/PortfolioPage"
import { queryClient } from "@/lib/query-client"
import { authQueryKey, AuthProvider } from "@/providers/AuthProvider"
import { CurrencyProvider } from "@/providers/CurrencyProvider"
import { OnboardingProvider } from "@/providers/OnboardingProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"
import { NotFoundPage } from "@/routes/NotFoundPage"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute"

/**
 * GET /email/verify/{id}/{hash} (the link clicked from the verification
 * email) redirects the browser to {FRONTEND_URL}/?verified=1. Refetch the
 * cached user so email_verified_at flips and ProtectedRoute drops the
 * VerifyEmailScreen block, then strip the param so it doesn't linger in
 * the URL or re-trigger on a later reload.
 */
function useHandleEmailVerifiedRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!params.has("verified")) return

    queryClient.invalidateQueries({ queryKey: authQueryKey })
    params.delete("verified")
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true },
    )
    // Deliberately keyed on location.search alone: re-navigating with the
    // param stripped must not immediately re-trigger this effect the way
    // including `navigate`/`location.pathname` in the deps would risk.
    // oxlint-disable-next-line exhaustive-deps
  }, [location.search])
}

function AppRoutes() {
  const location = useLocation()
  useHandleEmailVerifiedRedirect()
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route index element={<PortfolioPage />} />
          <Route path="/assets/:id" element={<AssetDetailPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <OnboardingProvider>
              <OfflineBanner />
              <AppRoutes />
              <Toaster />
            </OnboardingProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
