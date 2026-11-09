import { z } from "zod"

const ALERT_TYPES = [
  "price_above",
  "price_below",
  "percent_change",
  "portfolio_total_above",
  "portfolio_total_below",
  "allocation_drift",
] as const

// allocation_drift: gap between a type's share and its target, in points.
export const MAX_DRIFT_POINTS = 100

const ASSET_TYPES = new Set(["price_above", "price_below", "percent_change"])

// Backend bounds (422 beyond them) - mirrored for immediate feedback. The
// threshold is typed in the account's currency; the bound applies to that
// submitted value.
const MAX_THRESHOLD = 100_000_000_000
const MAX_THRESHOLD_MESSAGE = "100 000 000 000 maximum"

export const createAlertSchema = z
  .object({
    type: z.enum(ALERT_TYPES, { error: "Choisis un type d'alerte" }),
    asset_id: z.number().int().positive().optional(),
    threshold: z.coerce.number().optional(),
    // Empty field -> undefined (not 0), so the message says "required".
    percent_threshold: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().optional(),
    ),
    window: z.enum(["1h", "24h", "7d"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (ASSET_TYPES.has(data.type) && !data.asset_id) {
      ctx.addIssue({ code: "custom", path: ["asset_id"], message: "Choisis un actif" })
    }
    if (
      (data.type === "price_above" ||
        data.type === "price_below" ||
        data.type === "portfolio_total_above" ||
        data.type === "portfolio_total_below") &&
      !(data.threshold && data.threshold > 0)
    ) {
      ctx.addIssue({ code: "custom", path: ["threshold"], message: "Seuil requis, > 0" })
    } else if (data.threshold && data.threshold > MAX_THRESHOLD) {
      ctx.addIssue({ code: "custom", path: ["threshold"], message: MAX_THRESHOLD_MESSAGE })
    }
    if (data.type === "percent_change") {
      if (!(data.percent_threshold && data.percent_threshold > 0)) {
        ctx.addIssue({
          code: "custom",
          path: ["percent_threshold"],
          message: "Pourcentage requis, > 0",
        })
      } else if (data.percent_threshold > 1000) {
        ctx.addIssue({
          code: "custom",
          path: ["percent_threshold"],
          message: "1000% maximum",
        })
      }
      if (!data.window) {
        ctx.addIssue({ code: "custom", path: ["window"], message: "Choisis une fenêtre" })
      }
    }
    if (data.type === "allocation_drift") {
      const issue = driftIssue(data.percent_threshold)
      if (issue) ctx.addIssue({ code: "custom", path: ["percent_threshold"], message: issue })
    }
  })

export function driftIssue(value: number | undefined): string | null {
  if (value === undefined || !Number.isFinite(value)) return "Écart requis, en points"
  if (value < 1) return "1 point minimum"
  if (value > MAX_DRIFT_POINTS) return "100 points maximum"
  return null
}

export type CreateAlertFormInput = z.input<typeof createAlertSchema>
export type CreateAlertFormValues = z.output<typeof createAlertSchema>

export const editAlertSchema = z.object({
  threshold: z.coerce
    .number()
    .positive("Doit être positif")
    .max(MAX_THRESHOLD, MAX_THRESHOLD_MESSAGE)
    .optional(),
  percent_threshold: z.coerce.number().positive("Doit être positif").max(1000, "1000% maximum").optional(),
  window: z.enum(["1h", "24h", "7d"]).optional(),
})

export type EditAlertFormInput = z.input<typeof editAlertSchema>
export type EditAlertFormValues = z.output<typeof editAlertSchema>

export const notificationSettingsSchema = z.object({
  email_notifications_enabled: z.boolean(),
  discord_webhook_url: z.union([
    z
      .string()
      .regex(
        /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//,
        "Doit commencer par discord(app).com/api/webhooks/",
      )
      .max(255, "255 caractères maximum"),
    z.literal(""),
  ]),
  daily_digest_enabled: z.boolean(),
  weekly_digest_enabled: z.boolean(),
})

export type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>
