import type { ReactNode } from "react"
import { Bell, History, LayoutGrid, LineChart, Target, Wallet } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/layout/Footer"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { UserMenu } from "@/components/layout/UserMenu"

const NAV_ITEMS = [
  { to: "/", label: "Portefeuille", icon: Wallet, end: true },
  { to: "/allocation", label: "Répartition", icon: Target, end: false },
  { to: "/market", label: "Marché", icon: LineChart, end: false },
  { to: "/alerts", label: "Alertes", icon: Bell, end: false },
  { to: "/audit", label: "Historique", icon: History, end: false },
  { to: "/catalog", label: "Catalogue", icon: LayoutGrid, end: false },
]

/**
 * Three layouts, one nav list:
 * - < md: compact top bar (brand, theme, avatar) + fixed bottom tab bar.
 *   Its height is --bottom-nav-height (index.css), which the page and the
 *   toasts use to stay clear of it.
 * - md to lg: nav in the top bar, icons only (labels as tooltips).
 * - lg and up: nav with labels.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex min-h-svh flex-col pb-(--bottom-nav-height)">
      <header className="border-border/60 bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:gap-4">
          <Link
            to="/"
            className="text-foreground mr-auto flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight md:mr-2"
          >
            <img src="/favicon.svg" alt="" className="size-6" />
            Portfolio Tracker
          </Link>
          <nav aria-label="Navigation principale" className="hidden flex-1 items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                <span className="sr-only lg:not-sr-only">{label}</span>
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
      <nav
        aria-label="Navigation principale"
        className="border-border/60 bg-background/95 supports-backdrop-filter:bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid h-16 grid-cols-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[0.625rem] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                      isActive && "bg-primary/10",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="max-w-full truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
