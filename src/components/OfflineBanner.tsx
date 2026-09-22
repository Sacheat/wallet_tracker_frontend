import { WifiOff } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useOfflineStatus } from "@/lib/offline-status"

/**
 * Shows once any tracked query/mutation fails with a response-less network
 * error (see lib/offline-status.ts), and clears itself the moment anything
 * succeeds again - no polling, it just reflects real traffic. Mounted at
 * the App root so it's visible regardless of auth state (a login attempt
 * while the backend is down deserves this too, not just the app pages).
 */
export function OfflineBanner() {
  const isOffline = useOfflineStatus()
  const queryClient = useQueryClient()

  if (!isOffline) return null

  return (
    <div className="bg-destructive text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-center text-sm sm:px-6">
        <WifiOff className="size-4 shrink-0" />
        <span>Connexion au serveur perdue - certaines actions peuvent échouer.</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/40 bg-transparent text-white hover:bg-white/10"
          onClick={() => queryClient.refetchQueries()}
        >
          Réessayer
        </Button>
      </div>
    </div>
  )
}
