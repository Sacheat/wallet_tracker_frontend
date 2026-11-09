import { z } from "zod"
import { CURRENCY_CODES } from "@/lib/currency"
import type { CurrencyCode } from "@/types/api"

// Backend bound (422 beyond it) - mirrored for immediate feedback.
export const MAX_QUANTITY = 999_999_999_999

// Earliest executed_at the backend accepts (Bitcoin-era data floor).
export const MIN_EXECUTED_AT = "1999-01-04"

/**
 * Today as YYYY-MM-DD in UTC. The backend reads a bare date as UTC midnight
 * and refuses the future, so a user east of UTC picking their local "today"
 * just after midnight would get a 422 - capping on the UTC date avoids that.
 */
export function todayUtc() {
  return new Date().toISOString().slice(0, 10)
}

// <input> hands back "" for an empty field: treat it as "not provided" so
// the optional fields stay optional instead of failing number coercion.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value

const amount = (label: string, invalidMessage = `${label} invalide`) =>
  z.coerce.number({ error: invalidMessage }).min(0, `${label} ne peut pas être négatif`)

const optionalAmount = (label: string) =>
  z.preprocess(emptyToUndefined, amount(label).optional())

const quantitySchema = z.coerce
  .number({ error: "Quantité invalide" })
  .positive("La quantité doit être positive")
  .max(MAX_QUANTITY, "Quantité trop grande (999 999 999 999 maximum)")

const currencySchema = z.enum(CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]])

const dateSchema = z
  .string({ error: "Date requise" })
  .min(1, "Date requise")
  .refine((d) => d >= MIN_EXECUTED_AT, "Date antérieure au 04/01/1999")
  .refine((d) => d <= todayUtc(), "La date ne peut pas être dans le futur")

export const addPositionSchema = z.object({
  asset_id: z.number({ error: "Choisis un actif" }).int().positive(),
  platform_id: z.number({ error: "Choisis une plateforme" }).int().positive(),
  quantity: quantitySchema,
  // Opening buy - all optional (contract 08/11/2026). Without unit_price the
  // position's performance stays null until the price is filled in later.
  unit_price: optionalAmount("Prix"),
  fee: optionalAmount("Frais"),
  currency: currencySchema.optional(),
  executed_at: z.preprocess(emptyToUndefined, dateSchema.optional()),
})

// z.coerce.number() has a wider *input* type (unknown, pre-coercion) than its
// *output* type (number) - react-hook-form's form state is the input type,
// while the value handed to onSubmit is the output type after Zod parses it.
export type AddPositionFormInput = z.input<typeof addPositionSchema>
export type AddPositionFormValues = z.output<typeof addPositionSchema>

/**
 * Buy/sell on an existing position. unit_price is required here (0 is valid:
 * airdrop, gift) - unlike the opening buy - and the backend refuses null on
 * PATCH, so the edit form requires it too: that's also the main edit case
 * (filling in the price of a migrated opening buy).
 */
export const transactionSchema = z.object({
  type: z.enum(["buy", "sell"]),
  quantity: quantitySchema,
  // Empty -> undefined -> NaN after coercion -> the "required" message.
  unit_price: z.preprocess(
    emptyToUndefined,
    amount("Prix", "Prix requis"),
  ),
  fee: optionalAmount("Frais"),
  currency: currencySchema,
  executed_at: dateSchema,
})

export type TransactionFormInput = z.input<typeof transactionSchema>
export type TransactionFormValues = z.output<typeof transactionSchema>

/**
 * Backend validation messages embed ISO dates ("Vente impossible : au
 * 2026-06-01, ..."): show them the way the rest of the UI writes dates.
 */
export function frenchDates(message: string) {
  return message.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, "$3/$2/$1")
}
