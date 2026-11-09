import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCY_CODES, CURRENCY_LABELS } from "@/lib/currency"
import { toApiError } from "@/lib/http-client"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { CurrencyCode } from "@/types/api"

export function CurrencySection() {
  const { currency, setCurrency, isUpdating } = useCurrency()

  async function handleChange(value: CurrencyCode | null) {
    if (value === null || value === currency) return
    try {
      await setCurrency(value)
      toast.success("Devise mise à jour")
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Devise d'affichage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Tous les montants de l'app s'affichent dans cette devise, y compris
          les seuils de tes alertes : tu les saisis dans cette devise, et ils
          sont convertis en dollars au taux du jour quand tu les enregistres.
        </p>
        <Select value={currency} onValueChange={handleChange} items={CURRENCY_LABELS}>
          <SelectTrigger
            data-tour="currency-selector"
            className="w-fit min-w-52"
            disabled={isUpdating}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_CODES.map((code) => (
              <SelectItem key={code} value={code}>
                {CURRENCY_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
