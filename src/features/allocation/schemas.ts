import { z } from "zod"
import type { AllocationTargets, AssetType } from "@/types/api"

// Same tolerance as the backend: 33.33 + 33.33 + 33.34 passes.
export const SUM_TOLERANCE = 0.01

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value

const percent = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Pourcentage invalide" })
    .min(0, "Minimum 0 %")
    .max(100, "Maximum 100 %")
    .optional(),
)

export const targetsSchema = z
  .object({ crypto: percent, stock: percent, etf: percent, gold: percent })
  .superRefine((values, ctx) => {
    const sum = sumTargets(values)
    if (Math.abs(sum - 100) > SUM_TOLERANCE) {
      ctx.addIssue({
        code: "custom",
        path: ["root"],
        message: `La somme doit faire 100 % (actuellement ${formatPercentValue(sum)} %).`,
      })
    }
  })

export type TargetsFormInput = z.input<typeof targetsSchema>
export type TargetsFormValues = z.output<typeof targetsSchema>

export function sumTargets(values: Partial<Record<AssetType, unknown>>) {
  const total = Object.values(values).reduce<number>((sum, v) => {
    const n = typeof v === "number" ? v : Number(v)
    return v === undefined || v === "" || !Number.isFinite(n) ? sum : sum + n
  }, 0)
  // Float noise (33.33 + 33.33 + 33.34 = 99.99999999999999) must not show.
  return Math.round(total * 100) / 100
}

export function formatPercentValue(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
}

// Empty and 0 both mean "0 %" for the backend; omit them from the payload.
export function toTargetsPayload(values: TargetsFormValues): AllocationTargets {
  const payload: AllocationTargets = {}
  for (const [type, value] of Object.entries(values) as Array<[AssetType, number | undefined]>) {
    if (value !== undefined && value > 0) payload[type] = value
  }
  return payload
}

/**
 * Integer percentages that sum to exactly 100, from the current allocation
 * (largest remainder method) - a starting point for the form.
 */
export function roundTo100(percents: Partial<Record<AssetType, number>>) {
  const entries = Object.entries(percents) as Array<[AssetType, number]>
  const floors = entries.map(([type, p]) => ({ type, floor: Math.floor(p), rest: p - Math.floor(p) }))
  let missing = 100 - floors.reduce((s, f) => s + f.floor, 0)
  for (const f of [...floors].sort((a, b) => b.rest - a.rest)) {
    if (missing <= 0) break
    f.floor += 1
    missing -= 1
  }
  return Object.fromEntries(floors.map((f) => [f.type, f.floor])) as Partial<Record<AssetType, number>>
}
