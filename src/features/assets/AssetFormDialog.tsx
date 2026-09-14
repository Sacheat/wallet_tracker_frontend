import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useCreateAsset, useUpdateAsset } from "@/features/assets/hooks"
import { assetFormSchema, type AssetFormValues } from "@/features/assets/schemas"
import { ASSET_TYPE_LABELS } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import type { Asset } from "@/types/api"

const EMPTY_VALUES: AssetFormValues = {
  name: "",
  symbol: "",
  type: "crypto",
  external_id: "",
  logo_url: "",
}

export function AssetFormDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const isEdit = asset !== null
  const isPending = createAsset.isPending || updateAsset.isPending

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      asset
        ? {
            name: asset.name,
            symbol: asset.symbol,
            type: asset.type,
            external_id: asset.external_id ?? "",
            logo_url: asset.logo_url ?? "",
          }
        : EMPTY_VALUES,
    )
  }, [asset, open, form])

  async function onSubmit(values: AssetFormValues) {
    const payload = {
      ...values,
      external_id: values.external_id || null,
      logo_url: values.logo_url || null,
    }
    try {
      if (isEdit) {
        await updateAsset.mutateAsync({ id: asset.id, payload })
        toast.success("Actif mis à jour")
      } else {
        await createAsset.mutateAsync(payload)
        toast.success("Actif créé")
      }
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      form.setError("root", { message: apiError.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'actif" : "Ajouter un actif"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Bitcoin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbole</FormLabel>
                    <FormControl>
                      <Input placeholder="BTC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={ASSET_TYPE_LABELS}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
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
            <FormField
              control={form.control}
              name="external_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identifiant provider (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="bitcoin, AAPL, GC=F..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du logo (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
