import type { ReactNode } from "react"
import { ArrowLeft, Wallet } from "lucide-react"
import { Link } from "react-router-dom"
import { Footer } from "@/components/layout/Footer"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Shell for the public legal pages. Standalone (not under ProtectedRoute /
 * PublicOnlyRoute, like NotFoundPage): they must be readable logged in or
 * out, and PublicOnlyRoute would bounce a logged-in user away from them.
 */
export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt?: string
  children: ReactNode
}) {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full">
              <Wallet className="size-4" />
            </span>
            Portfolio Tracker
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Retour à l'application
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {updatedAt && (
          <p className="text-muted-foreground mt-1 text-sm italic">
            Dernière mise à jour : {updatedAt}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed">{children}</div>
      </main>
      <Footer />
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// Wraps wide tables so they scroll sideways on a phone instead of
// stretching the page.
export function LegalTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="bg-muted/40">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((cells, rowIndex) => (
            <TableRow key={rowIndex}>
              {cells.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="min-w-40 align-top whitespace-normal">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
