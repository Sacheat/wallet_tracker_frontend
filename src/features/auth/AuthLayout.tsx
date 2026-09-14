import type { ReactNode } from "react"
import { Wallet } from "lucide-react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="bg-background relative flex min-h-svh items-center justify-center px-4 py-10">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
            <Wallet className="size-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
