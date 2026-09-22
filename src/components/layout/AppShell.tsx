import type { ReactNode } from "react"
import { Bell, History, LayoutGrid, LineChart, Wallet } from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/layout/Footer"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { UserMenu } from "@/components/layout/UserMenu"

const NAV_ITEMS = [
  { to: "/", label: "Portefeuille", icon: Wallet, end: true },
  { to: "/market", label: "Marché", icon: LineChart, end: false },
  { to: "/alerts", label: "Alertes", icon: Bell, end: false },
  { to: "/audit", label: "Historique", icon: History, end: false },
  { to: "/catalog", label: "Catalogue", icon: LayoutGrid, end: false },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <span className="text-foreground mr-2 shrink-0 text-sm font-semibold tracking-tight">
            Portfolio Tracker
          </span>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
