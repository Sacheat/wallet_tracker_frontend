import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, TriangleAlert } from "lucide-react"
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
import { useCreatePortfolioEntry, usePortfolioEntries } from "@/features/portfolio/hooks"
import {
  addPositionSchema,
  type AddPositionFormInput,
  type AddPositionFormValues,
} from "@/features/portfolio/schemas"
import { toApiError } from "@/lib/http-client"
import { ASSET_TYPE_LABELS } from "@/lib/format"

export function AddPositionDialog() {
  const [open, setOpen] = useState(false)
  const { data: assets = [] } = useAssets()
  const { data: platforms = [] } = usePlatforms()
  const { data: entries = [] } = usePortfolioEntries()
  const createEntry = useCreatePortfolioEntry()

  const form = useForm<AddPositionFormInput, unknown, AddPositionFormValues>({
    resolver: zodResolver(addPositionSchema),
    defaultValues: { asset_id: undefined, platform_id: undefined, quantity: undefined },
  })

  const watchedAssetId = form.watch("asset_id")
  const watchedPlatformId = form.watch("platform_id")
  const existingEntry = entries.find(
    (e) => e.asset_id === watchedAssetId && e.platform_id === watchedPlatformId,
  )

  async function onSubmit(values: AddPositionFormValues) {
    try {
      await createEntry.mutateAsync(values)
      toast.success("Position ajoutée")
      form.reset({ asset_id: undefined, platform_id: undefined, quantity: undefined })
      setOpen(false)
    } catch (error) {
      const apiError = toApiError(error)
      form.setError("root", { message: apiError.message })
    }
  }

  const catalogIsEmpty = assets.length === 0 || platforms.length === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <DialogTrigger render={<Button><Plus /> Ajouter une position</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une position</DialogTitle>
          <DialogDescription>
            Choisis un actif du catalogue, la plateforme où il est détenu, et la
            quantité.
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                        type="number"
                        step="any"
                        min="0"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...field}
                        value={(field.value as string | number | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {existingEntry && (
                <div className="border-warning/40 bg-warning/10 flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                  <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
                  <span>
                    Tu as déjà une position sur cet actif et cette plateforme
                    (quantité actuelle : {existingEntry.quantity}). Modifie sa
                    quantité depuis le tableau plutôt que d'en créer une
                    nouvelle — le backend refuse les doublons.
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
