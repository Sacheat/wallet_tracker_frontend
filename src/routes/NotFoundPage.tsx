import { Compass } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/layout/Footer"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

// Standalone (not nested under ProtectedRoute/PublicOnlyRoute) since a
// dead link can be hit either logged in or out - "/" itself sorts out
// which one applies once you get there. Mirrors AuthLayout's shell
// (centered card, theme toggle, footer) without touching that shared
// component.
export function NotFoundPage() {
  return (
    <div className="bg-background relative flex min-h-svh flex-col">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
          <Compass className="size-5" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Page introuvable</h1>
        <p className="text-muted-foreground text-sm">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Button render={<Link to="/" />} className="mt-2">
          Retour à l'accueil
        </Button>
      </div>
      <Footer />
    </div>
  )
}
