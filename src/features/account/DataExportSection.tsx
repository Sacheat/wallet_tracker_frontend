import { useMutation } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { exportMyData } from "@/features/account/api"
import { downloadBlob, todayStamp } from "@/lib/download"
import { toApiError } from "@/lib/http-client"
import { useRetryAfterCountdown } from "@/lib/use-retry-after-countdown"

// RGPD rights of access and portability: everything tied to the account,
// as one JSON file.
export function DataExportSection() {
  const retryAfter = useRetryAfterCountdown()
  const exportData = useMutation({ mutationFn: exportMyData })

  async function handleExport() {
    try {
      const blob = await exportData.mutateAsync()
      downloadBlob(blob, `mes-donnees-${todayStamp()}.json`)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 429) {
        if (apiError.retryAfterSeconds) retryAfter.start(apiError.retryAfterSeconds)
        toast.error(
          apiError.retryAfterSeconds
            ? `Trop d'exports d'affilée — réessaie dans ${apiError.retryAfterSeconds} s.`
            : "Trop d'exports d'affilée — réessaie dans une minute.",
        )
      } else {
        toast.error(apiError.message)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Mes données</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-sm text-sm">
          Récupère tout ce qui est lié à ton compte (profil, préférences, portefeuille,
          alertes, historique) dans un fichier JSON.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={exportData.isPending || retryAfter.secondsLeft > 0}
        >
          <Download />
          {retryAfter.secondsLeft > 0
            ? `Réessaie dans ${retryAfter.secondsLeft}s`
            : exportData.isPending
              ? "Préparation..."
              : "Télécharger mes données"}
        </Button>
      </CardContent>
    </Card>
  )
}
