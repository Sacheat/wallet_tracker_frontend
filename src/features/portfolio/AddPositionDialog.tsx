import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, Plus, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useAssets } from "@/features/assets/hooks"
import { usePlatforms } from "@/features/platforms/hooks"
import type { PortfolioEntryPayload } from "@/features/portfolio/api"
import { useCreatePortfolioEntry, usePortfolioEntries } from "@/features/portfolio/hooks"
import {
  addPositionSchema,
  MIN_EXECUTED_AT,
  todayUtc,
  type AddPositionFormInput,
  type AddPositionFormValues,
} from "@/features/portfolio/schemas"
import { CURRENCY_CODES } from "@/lib/currency"
import { ASSET_TYPE_LABELS } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import { useCurrency } from "@/providers/CurrencyProvider"
import { cn } from "@/lib/utils"

const FORM_FIELDS = [
  "asset_id",
  "platform_id",
  "quantity",
  "unit_price",
  "fee",
  "currency",
  "executed_at",
] as const satisfies readonly (keyof AddPositionFormInput)[]

type FieldName = (typeof FORM_FIELDS)[number]

function isFormField(key: string): key is FieldName {
  return (FORM_FIELDS as readonly string[]).includes(key)
}

const PURCHASE_FIELDS: FieldName[] = ["unit_price", "fee", "currency", "executed_at"]

/**
 * Only send what the user actually filled in, so the backend applies its own
 * defaults (fee 0, user.currency, now). currency is meaningless without an
 * amount, so it is dropped when neither price nor fee was given.
 */
function toPayload(values: AddPositionFormValues): PortfolioEntryPayload {
  const hasAmount = values.unit_price !== undefined || values.fee !== undefined
  return {
    asset_id: values.asset_id,
    platform_id: values.platform_id,
    quantity: values.quantity,
    ...(values.unit_price !== undefined && { unit_price: values.unit_price }),
    ...(values.fee !== undefined && { fee: values.fee }),
    ...(hasAmount && values.currency && { currency: values.currency }),
    ...(values.executed_at && { executed_at: values.executed_at }),
  }
}

const numberInputProps = {
  type: "number",
  step: "any",
  min: "0",
  inputMode: "decimal",
} as const

export function AddPositionDialog() {
  const [open, setOpen] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const { currency: userCurrency } = useCurrency()
  const { data: assets = [] } = useAssets()
  const { data: platforms = [] } = usePlatforms()
  const { data: entries = [] } = usePortfolioEntries()
  const createEntry = useCreatePortfolioEntry()

  const emptyValues: AddPositionFormInput = {
    asset_id: undefined as unknown as number,
    platform_id: undefined as unknown as number,
    quantity: undefined,
    unit_price: undefined,
    fee: undefined,
    currency: userCurrency,
    executed_at: undefined,
  }

  const form = useForm<AddPositionFormInput, unknown, AddPositionFormValues>({
    resolver: zodResolver(addPositionSchema),
    defaultValues: emptyValues,
  })

  const watchedAssetId = form.watch("asset_id")
  const watchedPlatformId = form.watch("platform_id")
  const existingEntry = entries.find(
    (e) => e.asset_id === watchedAssetId && e.platform_id === watchedPlatformId,
  )

  function resetAll() {
    form.reset(emptyValues)
    setShowPurchase(false)
  }

  async function onSubmit(values: AddPositionFormValues) {
    try {
      await createEntry.mutateAsync(toPayload(values))
      toast.success("Position ajoutée")
      resetAll()
      setOpen(false)
    } catch (error) {
      const apiError = toApiError(error)
      let mappedToField = false
      for (const [key, messages] of Object.entries(apiError.errors ?? {})) {
        if (!isFormField(key)) continue
        form.setError(key, { message: messages[0] })
        mappedToField = true
        // A server error on a field hidden in the collapsed section would be
        // invisible - open it so the user sees what to fix.
        if (PURCHASE_FIELDS.includes(key)) setShowPurchase(true)
      }
      if (!mappedToField) form.setError("root", { message: apiError.message })
    }
  }

  const catalogIsEmpty = assets.length === 0 || platforms.length === 0
  const watchedCurrency = form.watch("currency") ?? userCurrency

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetAll()
      }}
    >
      <DialogTrigger
        render={
          <Button data-tour="add-position">
            <Plus /> Ajouter une position
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une position</DialogTitle>
          <DialogDescription>
            Choisis un actif du catalogue, la plateforme où il est détenu, et la
            quantité achetée.
          </DialogDescription>
        </DialogHeader>

        {catalogIsEmpty ? (
          <p className="text-muted-foreground text-sm">
            Le catalogue d'actifs ou de plateformes est vide.{" "}
            <Link to="/catalog" className="text-foreground underline underline-offset-4">
              Ajoute d'abord un actif et une plateforme
            </Link>
            .
          </p>
        ) : (
          <Form {...form}>
            {/* noValidate: the min/max attributes still constrain the date
                picker, but errors come from Zod so they all look the same. */}
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actif</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        items={assets.map((asset) => ({
                          value: asset.id,
                          label: `${asset.name} (${asset.symbol}) · ${ASSET_TYPE_LABELS[asset.type]}`,
                        }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un actif" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name} ({asset.symbol}) ·{" "}
                              {ASSET_TYPE_LABELS[asset.type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platform_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plateforme</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        items={platforms.map((platform) => ({
                          value: platform.id,
                          label: platform.name,
                        }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner une plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border">
                <button
                  type="button"
                  className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium"
                  aria-expanded={showPurchase}
                  aria-controls="add-position-purchase"
                  onClick={() => setShowPurchase((v) => !v)}
                >
                  <span>
                    Prix d'achat{" "}
                    <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", showPurchase && "rotate-180")}
                  />
                </button>
                {/* Kept mounted (hidden) so values survive a collapse/expand. */}
                <div
                  id="add-position-purchase"
                  hidden={!showPurchase}
                  className="grid gap-4 border-t px-3 pt-3 pb-4"
                >
                  <p className="text-muted-foreground text-xs">
                    Renseigne le prix pour suivre la plus-value de cette position.
                    Tu pourras aussi le compléter plus tard.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <FormField
                      control={form.control}
                      name="unit_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix unitaire</FormLabel>
                          <FormControl>
                            <Input
                              {...numberInputProps}
                              placeholder="0.00"
                              {...field}
                              value={(field.value as string | number | undefined) ?? ""}
                            />
                          </FormControl>
                          <FormDescription>Prix payé pour une unité.</FormDescription>
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
                          <FormDescription>Total payé en frais.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="executed_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'achat</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              min={MIN_EXECUTED_AT}
                              max={todayUtc()}
                              {...field}
                              value={(field.value as string | undefined) ?? ""}
                            />
                          </FormControl>
                          <FormDescription>Aujourd'hui si vide.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {existingEntry && (
                <div className="border-warning/40 bg-warning/10 flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                  <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
                  <span>
                    Tu as déjà une position sur cet actif et cette plateforme
                    (quantité actuelle : {existingEntry.quantity}). Ajoute plutôt un
                    achat via « Achats et ventes » dans le menu de sa ligne.
                  </span>
                </div>
              )}
              {form.formState.errors.root && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={createEntry.isPending || Boolean(existingEntry)}>
                  {createEntry.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
