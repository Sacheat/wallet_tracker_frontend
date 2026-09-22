import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { EntityAvatar } from "@/components/EntityAvatar"
import { useCreatePlatform, useUpdatePlatform } from "@/features/platforms/hooks"
import { platformFormSchema, type PlatformFormValues } from "@/features/platforms/schemas"
import { toApiError } from "@/lib/http-client"
import type { Platform } from "@/types/api"

const EMPTY_VALUES: PlatformFormValues = { name: "", logo_url: "" }

export function PlatformFormDialog({
  platform,
  open,
  onOpenChange,
}: {
  platform: Platform | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createPlatform = useCreatePlatform()
  const updatePlatform = useUpdatePlatform()
  const isEdit = platform !== null
  const isPending = createPlatform.isPending || updatePlatform.isPending

  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(platformFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const previewName = form.watch("name")
  const previewLogoUrl = form.watch("logo_url")

  useEffect(() => {
    if (!open) return
    form.reset(
      platform
        ? { name: platform.name, logo_url: platform.logo_url ?? "" }
        : EMPTY_VALUES,
    )
  }, [platform, open, form])

  async function onSubmit(values: PlatformFormValues) {
    const payload = { ...values, logo_url: values.logo_url || null }
    try {
      if (isEdit) {
        await updatePlatform.mutateAsync({ id: platform.id, payload })
        toast.success("Plateforme mise à jour")
      } else {
        await createPlatform.mutateAsync(payload)
        toast.success("Plateforme créée")
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
          <DialogTitle>{isEdit ? "Modifier la plateforme" : "Ajouter une plateforme"}</DialogTitle>
        </DialogHeader>
        <Card size="sm" className="bg-muted/40">
          <CardContent className="flex items-center gap-3">
            <EntityAvatar src={previewLogoUrl} label={previewName || "?"} />
            <span className="truncate text-sm font-medium">
              {previewName || "Nom de la plateforme"}
            </span>
          </CardContent>
        </Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Binance" {...field} />
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
