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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUpdateAlert } from "@/features/alerts/hooks"
import {
  editAlertSchema,
  type EditAlertFormInput,
  type EditAlertFormValues,
} from "@/features/alerts/schemas"
import { ALERT_WINDOW_LABELS } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import type { PriceAlert } from "@/types/api"

export function EditAlertDialog({
  alert,
  onOpenChange,
}: {
  alert: PriceAlert | null
  onOpenChange: (open: boolean) => void
}) {
  const updateAlert = useUpdateAlert()

  const form = useForm<EditAlertFormInput, unknown, EditAlertFormValues>({
    resolver: zodResolver(editAlertSchema),
    defaultValues: {},
  })

  useEffect(() => {
    if (!alert) return
    form.reset({
      threshold: alert.threshold ?? undefined,
      percent_threshold: alert.percent_threshold ?? undefined,
      window: alert.window ?? undefined,
    })
  }, [alert, form])

  async function onSubmit(values: EditAlertFormValues) {
    if (!alert) return
    try {
      await updateAlert.mutateAsync({ id: alert.id, payload: values })
      toast.success("Alerte mise à jour")
      onOpenChange(false)
    } catch (error) {
      form.setError("root", { message: toApiError(error).message })
    }
  }

  async function toggleActive(isActive: boolean) {
    if (!alert) return
    try {
      await updateAlert.mutateAsync({ id: alert.id, payload: { is_active: isActive } })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  const isPercent = alert?.type === "percent_change"

  return (
    <Dialog open={alert !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'alerte</DialogTitle>
        </DialogHeader>

        {alert && (
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="alert-active">Active</Label>
            <Switch
              id="alert-active"
              checked={alert.is_active}
              onCheckedChange={toggleActive}
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {isPercent ? (
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
                            <SelectValue />
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
                    <FormLabel>Seuil ($)</FormLabel>
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
              <Button type="submit" disabled={updateAlert.isPending}>
                {updateAlert.isPending ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
