import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSaveAllocationTargets } from "@/features/allocation/hooks"
import {
  formatPercentValue,
  roundTo100,
  SUM_TOLERANCE,
  sumTargets,
  targetsSchema,
  toTargetsPayload,
  type TargetsFormInput,
  type TargetsFormValues,
} from "@/features/allocation/schemas"
import { ASSET_TYPE_CHART_CLASS, ASSET_TYPE_LABELS, ASSET_TYPE_ORDER } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import { cn } from "@/lib/utils"
import type { AllocationTargets, AssetType } from "@/types/api"

function toFormValues(targets: AllocationTargets): TargetsFormInput {
  return {
    crypto: targets.crypto,
    stock: targets.stock,
    etf: targets.etf,
    gold: targets.gold,
  }
}

/**
 * Targets per asset type. The whole set is replaced at once (PUT), since
 * they only make sense together: the sum is shown live and saving is
 * blocked until it reaches 100 %. The backend checks it again (422).
 */
export function TargetsDialog({
  open,
  onOpenChange,
  targets,
  currentPercents,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  targets: AllocationTargets
  // Current allocation, offered as a starting point.
  currentPercents: Partial<Record<AssetType, number>>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Objectifs de répartition</DialogTitle>
          <DialogDescription>
            La part visée pour chaque type d'actif. Un type laissé vide est visé à 0 % :
            s'il est détenu, le rééquilibrage proposera de le vendre.
          </DialogDescription>
        </DialogHeader>
        {/* Remount on each opening so the form starts from the saved targets. */}
        {open && (
          <TargetsForm
            targets={targets}
            currentPercents={currentPercents}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TargetsForm({
  targets,
  currentPercents,
  onDone,
}: {
  targets: AllocationTargets
  currentPercents: Partial<Record<AssetType, number>>
  onDone: () => void
}) {
  const save = useSaveAllocationTargets()
  const [confirmClear, setConfirmClear] = useState(false)
  const hasSavedTargets = Object.keys(targets).length > 0

  const form = useForm<TargetsFormInput, unknown, TargetsFormValues>({
    resolver: zodResolver(targetsSchema),
    defaultValues: toFormValues(targets),
  })

  const values = useWatch({ control: form.control })
  const sum = sumTargets(values)
  const isComplete = Math.abs(sum - 100) <= SUM_TOLERANCE
  const remaining = Math.round((100 - sum) * 100) / 100

  async function submit(payload: AllocationTargets, successMessage: string) {
    try {
      await save.mutateAsync(payload)
      toast.success(successMessage)
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      form.setError("root", { message: apiError.errors?.targets?.[0] ?? apiError.message })
    }
  }

  const hasCurrent = Object.values(currentPercents).some((p) => (p ?? 0) > 0)

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((v) => submit(toTargetsPayload(v), "Objectifs enregistrés"))}
        className="grid gap-4"
      >
        <div className="grid grid-cols-2 gap-3">
          {ASSET_TYPE_ORDER.map((type) => (
            <FormField
              key={type}
              control={form.control}
              name={type}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <span className={cn("size-2.5 rounded-full", ASSET_TYPE_CHART_CLASS[type])} aria-hidden />
                    {ASSET_TYPE_LABELS[type]}
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        max="100"
                        placeholder="0"
                        className="pr-7"
                        {...field}
                        value={(field.value as string | number | undefined) ?? ""}
                      />
                    </FormControl>
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm">
                      %
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div
          aria-live="polite"
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
            isComplete ? "border-gain/40 bg-gain/5" : "border-warning/40 bg-warning/10",
          )}
        >
          <span>
            Total : <span className="font-semibold tabular-nums">{formatPercentValue(sum)} %</span>
          </span>
          <span className="text-muted-foreground text-xs">
            {isComplete
              ? "Prêt à enregistrer"
              : remaining > 0
                ? `Il manque ${formatPercentValue(remaining)} %`
                : `${formatPercentValue(-remaining)} % de trop`}
          </span>
        </div>

        {hasCurrent && (
          <button
            type="button"
            className="text-primary w-fit text-xs underline-offset-4 hover:underline"
            onClick={() => form.reset(toFormValues(roundTo100(currentPercents)), { keepDefaultValues: true })}
          >
            Partir de ma répartition actuelle
          </button>
        )}

        {form.formState.errors.root && (
          <p role="alert" className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        {confirmClear ? (
          <div className="border-destructive/30 bg-destructive/5 grid gap-2 rounded-md border px-3 py-2 text-sm">
            <p>
              Effacer tous les objectifs ? L'écart et le rééquilibrage ne seront plus
              calculés, et une alerte d'écart de répartition ne pourra plus se déclencher.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmClear(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={save.isPending}
                onClick={() => submit({}, "Objectifs effacés")}
              >
                Effacer
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="sm:justify-between">
            {hasSavedTargets ? (
              <Button type="button" variant="ghost" onClick={() => setConfirmClear(true)}>
                Effacer les objectifs
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!isComplete || save.isPending}>
              {save.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  )
}
