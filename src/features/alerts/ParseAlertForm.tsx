import { Sparkles, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateAlertPayload } from "@/features/alerts/api"
import { useCreateAlert, useParseAlert } from "@/features/alerts/hooks"
import { ALERT_TYPE_LABELS, ALERT_WINDOW_LABELS } from "@/lib/format"
import { formatMoney } from "@/lib/currency"
import { toApiError } from "@/lib/http-client"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { CurrencyCode, ParseAlertResponse } from "@/types/api"

// preview.threshold is already in the account's currency (the backend
// hasn't converted it to USD yet - that only happens on the real POST) so
// this uses formatMoney directly, NOT useCurrency().format() (which expects
// a USD amount to convert).
function describePreview(preview: ParseAlertResponse, currency: CurrencyCode) {
  const label = ALERT_TYPE_LABELS[preview.type]
  if (preview.type === "percent_change") {
    const window = preview.window ? ` (${ALERT_WINDOW_LABELS[preview.window]})` : ""
    return `${preview.asset?.name ?? "Actif"} · ${label} ${preview.percent_threshold}%${window}`
  }
  const amount = preview.threshold !== null ? formatMoney(preview.threshold, currency) : "—"
  if (preview.type === "portfolio_total_above" || preview.type === "portfolio_total_below") {
    return `${label} ${amount}`
  }
  return `${preview.asset?.name ?? "Actif"} · ${label} ${amount}`
}

export function ParseAlertForm({
  onCreated,
  onFallbackToManual,
}: {
  onCreated: () => void
  onFallbackToManual: () => void
}) {
  const [text, setText] = useState("")
  const [preview, setPreview] = useState<ParseAlertResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const { currency } = useCurrency()
  const parseAlert = useParseAlert()
  const createAlert = useCreateAlert()

  async function handleParse() {
    const trimmed = text.trim()
    if (!trimmed) return
    setErrorMessage(null)
    setAiUnavailable(false)
    setPreview(null)
    try {
      setPreview(await parseAlert.mutateAsync(trimmed))
    } catch (error) {
      const apiError = toApiError(error)
      // 503 = the free-tier AI is temporarily down (backend already retried
      // internally before giving up) - point at the manual tab rather than
      // showing a raw error.
      if (apiError.status === 503) {
        setAiUnavailable(true)
      } else {
        // 422 = ambiguous request or asset not in the catalog - the
        // backend's message says which, so just surface it as-is.
        setErrorMessage(apiError.message)
      }
    }
  }

  async function handleConfirm() {
    if (!preview) return
    const payload: CreateAlertPayload = { type: preview.type }
    if (preview.asset) payload.asset_id = preview.asset.id
    if (preview.type === "percent_change") {
      payload.percent_threshold = preview.percent_threshold ?? undefined
      payload.window = preview.window ?? undefined
    } else {
      payload.threshold = preview.threshold ?? undefined
    }

    try {
      await createAlert.mutateAsync(payload)
      toast.success("Alerte créée")
      setText("")
      setPreview(null)
      onCreated()
    } catch (error) {
      setErrorMessage(toApiError(error).message)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="alert-nl-text">Décris ton alerte</Label>
        <div className="flex gap-2">
          <Input
            id="alert-nl-text"
            placeholder="préviens-moi si le bitcoin dépasse 100000"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setPreview(null)
              setErrorMessage(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleParse()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleParse}
            disabled={parseAlert.isPending || !text.trim()}
          >
            <Sparkles /> {parseAlert.isPending ? "..." : "Comprendre"}
          </Button>
        </div>
      </div>

      {aiUnavailable && (
        <div className="border-warning/40 bg-warning/10 flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
          <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
          <span>
            L'IA n'est pas disponible pour le moment.{" "}
            <button
              type="button"
              onClick={onFallbackToManual}
              className="underline underline-offset-4 hover:no-underline"
            >
              Utilise le formulaire manuel
            </button>{" "}
            en attendant.
          </span>
        </div>
      )}

      {errorMessage && !aiUnavailable && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}

      {preview && (
        <div className="ai-glow-border rounded-lg p-[1.5px]">
          <div className="bg-card flex flex-col gap-3 rounded-[calc(var(--radius-lg)-1.5px)] px-3 py-3 text-sm">
            <p>
              On a compris :{" "}
              <span className="font-medium">{describePreview(preview, currency)}</span>
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={createAlert.isPending}
              >
                {createAlert.isPending ? "Création..." : "Confirmer"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setPreview(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
