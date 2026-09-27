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
import { LogoPicker } from "@/components/LogoPicker"
import { useCreatePlatform, useUpdatePlatform } from "@/features/platforms/hooks"
import { platformFormSchema, type PlatformFormValues } from "@/features/platforms/schemas"
import { getCatalogErrorMessage } from "@/lib/catalog-errors"
import { KEEP_LOGO, resolveLogoPreview } from "@/lib/logo-upload"
import { useLogoDraft } from "@/lib/use-logo-draft"
import type { Platform } from "@/types/api"

const EMPTY_VALUES: PlatformFormValues = { name: "" }

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

  const [logoDraft, setLogoDraft] = useLogoDraft()
  const previewName = form.watch("name")
  const previewLogoUrl = resolveLogoPreview(platform?.logo_url ?? null, logoDraft)

  useEffect(() => {
    if (!open) return
    form.reset(platform ? { name: platform.name } : EMPTY_VALUES)
    setLogoDraft(KEEP_LOGO)
  }, [platform, open, form, setLogoDraft])

  async function onSubmit(values: PlatformFormValues) {
    try {
      if (isEdit) {
        const { logoError } = await updatePlatform.mutateAsync({
          id: platform.id,
          payload: values,
          logo: logoDraft,
        })
        if (logoError) {
          // The name is saved; stay open so the logo alone can be retried
          // (re-submitting only re-sends an idempotent PATCH).
          form.setError("root", {
            message: `Modifications enregistrées, mais pas le logo : ${logoError}`,
          })
          return
        }
        toast.success("Plateforme mise à jour")
      } else {
        const { logoError } = await createPlatform.mutateAsync({
          payload: values,
          logo: logoDraft,
        })
        if (logoError) {
          // The platform exists now - close rather than let a re-submit
          // POST it a second time.
          toast.warning(`Plateforme créée, mais sans logo : ${logoError}`, {
            description: "Tu peux l'ajouter en modifiant la plateforme.",
          })
        } else {
          toast.success("Plateforme créée")
        }
      }
      onOpenChange(false)
    } catch (error) {
      // The JSON save itself failed (403 not allowed to edit, 422, 429...).
      // The mutation stops there, so the logo is never sent after a
      // refused PATCH - it would only be refused too.
      form.setError("root", { message: getCatalogErrorMessage(error) })
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
            <LogoPicker
              currentUrl={platform?.logo_url ?? null}
              draft={logoDraft}
              onDraftChange={setLogoDraft}
              disabled={isPending}
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
