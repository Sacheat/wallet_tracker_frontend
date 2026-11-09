import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TransactionPayload } from "@/features/portfolio/api"
import { useCreateTransaction, useUpdateTransaction } from "@/features/portfolio/hooks"
import {
  frenchDates,
  MIN_EXECUTED_AT,
  todayUtc,
  transactionSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "@/features/portfolio/schemas"
import { CURRENCY_CODES } from "@/lib/currency"
import { formatQuantity } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { PortfolioTransaction, TransactionType } from "@/types/api"

const FIELDS = ["type", "quantity", "unit_price", "fee", "currency", "executed_at"] as const
type FieldName = (typeof FIELDS)[number]

function isField(key: string): key is FieldName {
  return (FIELDS as readonly string[]).includes(key)
}

const numberInputProps = {
  type: "number",
  step: "any",
  min: "0",
  inputMode: "decimal",
} as const

// executed_at comes back as a full ISO timestamp; the date input wants
// YYYY-MM-DD. Go through Date so any offset is normalised to UTC, the
// calendar the backend validates against.
function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function defaultsFor(
  transaction: PortfolioTransaction | undefined,
  type: TransactionType,
  currency: TransactionFormInput["currency"],
): TransactionFormInput {
  if (!transaction) {
    return {
      type,
      quantity: undefined,
      unit_price: undefined,
      fee: undefined,
      currency,
      executed_at: todayUtc(),
    }
  }
  return {
    type: transaction.type,
    quantity: Number(transaction.quantity),
    unit_price: transaction.unit_price === null ? undefined : Number(transaction.unit_price),
    fee: Number(transaction.fee),
    currency: transaction.currency,
    executed_at: toDateInput(transaction.executed_at),
  }
}

/**
 * Create (no `transaction`) or correct (with one) a buy/sell on a position.
 * Rendered inside TransactionsDialog in place of the list, so the user never
 * juggles two stacked dialogs.
 */
export function TransactionForm({
  entryId,
  heldQuantity,
  transaction,
  initialType = "buy",
  onDone,
  onCancel,
}: {
  entryId: number
  heldQuantity: string
  transaction?: PortfolioTransaction
  initialType?: TransactionType
  onDone: () => void
  onCancel: () => void
}) {
  const { currency: userCurrency } = useCurrency()
  const createTx = useCreateTransaction(entryId)
  const updateTx = useUpdateTransaction()
  const isEdit = transaction !== undefined
  const isPending = createTx.isPending || updateTx.isPending

  const form = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultsFor(transaction, initialType, userCurrency),
  })

  const type = form.watch("type")
  const watchedCurrency = form.watch("currency")

  async function onSubmit(values: TransactionFormValues) {
    try {
      if (isEdit) {
        // PATCH only what changed. Re-sending an untouched date would reset
        // the time of day to midnight, which can reorder same-day writes and
        // make the backend's chronological sell check fail for no reason.
        // Compared against the original transaction rather than RHF's
        // dirtyFields, which is a render-time proxy and stays empty when
        // only read here.
        const original = defaultsFor(transaction, transaction.type, transaction.currency)
        const payload: Partial<TransactionPayload> = {}
        if (values.type !== original.type) payload.type = values.type
        if (values.quantity !== original.quantity) payload.quantity = values.quantity
        if (values.unit_price !== original.unit_price) payload.unit_price = values.unit_price
        // An emptied fee field means 0, not "erase" (the backend refuses null).
        const fee = values.fee ?? 0
        if (fee !== original.fee) payload.fee = fee
        if (values.currency !== original.currency) payload.currency = values.currency
        if (values.executed_at !== original.executed_at) payload.executed_at = values.executed_at
        if (Object.keys(payload).length > 0) {
          await updateTx.mutateAsync({ id: transaction.id, payload })
          toast.success("Transaction corrigée")
        }
      } else {
        await createTx.mutateAsync({
          type: values.type,
          quantity: values.quantity,
          unit_price: values.unit_price,
          ...(values.fee !== undefined && { fee: values.fee }),
          currency: values.currency,
          executed_at: values.executed_at,
        })
        toast.success(values.type === "buy" ? "Achat ajouté" : "Vente ajoutée")
      }
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 503) {
        // The backend stores the FX rate of executed_at for P&L; when that
        // source is down it refuses rather than record a wrong gain. The
        // form keeps its values so a retry is one click.
        form.setError("root", {
          message:
            "Taux de change historique indisponible pour l'instant. Rien n'a été enregistré : réessaie dans un moment.",
        })
        return
      }
      let mapped = false
      for (const [key, messages] of Object.entries(apiError.errors ?? {})) {
        if (!isField(key)) continue
        form.setError(key, { message: frenchDates(messages[0]) })
        mapped = true
      }
      if (!mapped) form.setError("root", { message: frenchDates(apiError.message) })
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <SegmentedControl
                label="Type"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "buy", label: "Achat" },
                  { value: "sell", label: "Vente" },
                ]}
                className="w-full"
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantité</FormLabel>
              <FormControl>
                <Input
                  {...numberInputProps}
                  placeholder="0.00"
                  {...field}
                  value={(field.value as string | number | undefined) ?? ""}
                />
              </FormControl>
              {type === "sell" && !isEdit && (
                <FormDescription>
                  Détenu aujourd'hui : {formatQuantity(heldQuantity)}.{" "}
                  <button
                    type="button"
                    className="text-foreground underline underline-offset-4"
                    onClick={() =>
                      form.setValue("quantity", Number(heldQuantity), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    Tout vendre
                  </button>
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{type === "buy" ? "Prix d'achat unitaire" : "Prix de vente unitaire"}</FormLabel>
                <FormControl>
                  <Input
                    {...numberInputProps}
                    placeholder="0.00"
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                  />
                </FormControl>
                <FormDescription>0 pour un airdrop ou un cadeau.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Devise</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    items={CURRENCY_CODES.map((code) => ({ value: code, label: code }))}
                  >
                    <SelectTrigger className="w-full sm:w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frais ({watchedCurrency})</FormLabel>
                <FormControl>
                  <Input
                    {...numberInputProps}
                    placeholder="0"
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="executed_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={MIN_EXECUTED_AT}
                    max={todayUtc()}
                    {...field}
                    value={(field.value as string | undefined) ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <p role="alert" className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : type === "buy" ? "Ajouter l'achat" : "Ajouter la vente"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
