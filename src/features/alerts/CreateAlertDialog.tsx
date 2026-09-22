import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
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
import { getAlertErrorMessage, useCreateAlert } from "@/features/alerts/hooks"
import {
  createAlertSchema,
  type CreateAlertFormInput,
  type CreateAlertFormValues,
} from "@/features/alerts/schemas"
import { ALERT_TYPE_LABELS, ALERT_WINDOW_LABELS, ASSET_TYPE_LABELS } from "@/lib/format"
import { useCurrency } from "@/providers/CurrencyProvider"
import type { CreateAlertPayload } from "@/features/alerts/api"

const NEEDS_ASSET = new Set(["price_above", "price_below", "percent_change"])

export function CreateAlertDialog() {
  const [open, setOpen] = useState(false)
  const { data: assets = [] } = useAssets()
  const createAlert = useCreateAlert()
  const { currency } = useCurrency()

  const form = useForm<CreateAlertFormInput, unknown, CreateAlertFormValues>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: { type: "price_above" },
  })

  const type = form.watch("type")

  async function onSubmit(values: CreateAlertFormValues) {
    const payload: CreateAlertPayload = { type: values.type }
    if (NEEDS_ASSET.has(values.type)) payload.asset_id = values.asset_id
    if (values.type === "percent_change") {
      payload.percent_threshold = values.percent_threshold
      payload.window = values.window
    } else {
      payload.threshold = values.threshold
    }

    try {
      await createAlert.mutateAsync(payload)
      toast.success("Alerte créée")
      form.reset({ type: "price_above" })
      setOpen(false)
    } catch (error) {
      form.setError("root", { message: getAlertErrorMessage(error) })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset({ type: "price_above" })
      }}
    >
      <DialogTrigger render={<Button><Plus /> Créer une alerte</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une alerte</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'alerte</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={ALERT_TYPE_LABELS}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {NEEDS_ASSET.has(type) && (
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actif</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                              {asset.name} ({asset.symbol}) · {ASSET_TYPE_LABELS[asset.type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "percent_change" ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="percent_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variation (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          min="0"
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
                  name="window"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fenêtre</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          items={ALERT_WINDOW_LABELS}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ALERT_WINDOW_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
            ) : (
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type.startsWith("portfolio")
                        ? `Valeur totale (${currency})`
                        : `Prix (${currency})`}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        {...field}
                        value={(field.value as string | number | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.formState.errors.root && (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={createAlert.isPending}>
                {createAlert.isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
