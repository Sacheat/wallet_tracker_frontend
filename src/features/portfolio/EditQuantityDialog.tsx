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
import { useUpdatePortfolioEntry } from "@/features/portfolio/hooks"
import {
  editQuantitySchema,
  type EditQuantityFormInput,
  type EditQuantityFormValues,
} from "@/features/portfolio/schemas"
import { toApiError } from "@/lib/http-client"
import type { PortfolioRow } from "@/features/portfolio/hooks"

export function EditQuantityDialog({
  row,
  onOpenChange,
}: {
  row: PortfolioRow | null
  onOpenChange: (open: boolean) => void
}) {
  const updateEntry = useUpdatePortfolioEntry()

  const form = useForm<EditQuantityFormInput, unknown, EditQuantityFormValues>({
    resolver: zodResolver(editQuantitySchema),
    defaultValues: { quantity: 0 },
  })

  useEffect(() => {
    if (row) form.reset({ quantity: Number(row.quantity) })
  }, [row, form])

  async function onSubmit(values: EditQuantityFormValues) {
    if (!row) return
    try {
      await updateEntry.mutateAsync({ id: row.entryId, quantity: values.quantity })
      toast.success("Quantité mise à jour")
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      form.setError("root", { message: apiError.message })
    }
  }

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la quantité</DialogTitle>
        </DialogHeader>
        {row && (
          <p className="text-muted-foreground -mt-2 text-sm">
            {row.assetName} · {row.platformName}
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                      {...field}
                      value={(field.value as string | number | undefined) ?? ""}
                    />
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
              <Button type="submit" disabled={updateEntry.isPending}>
                {updateEntry.isPending ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
