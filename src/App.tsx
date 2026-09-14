import { QueryClientProvider } from "@tanstack/react-query"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "@/components/ui/sonner"
import { AlertsPage } from "@/features/alerts/AlertsPage"
import { AssetDetailPage } from "@/features/assets/AssetDetailPage"
import { AuditPage } from "@/features/audit/AuditPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { CatalogPage } from "@/features/catalog/CatalogPage"
import { MarketPage } from "@/features/market/MarketPage"
import { PortfolioPage } from "@/features/portfolio/PortfolioPage"
import { queryClient } from "@/lib/query-client"
import { AuthProvider } from "@/providers/AuthProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute"

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route index element={<PortfolioPage />} />
          <Route path="/assets/:id" element={<AssetDetailPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
