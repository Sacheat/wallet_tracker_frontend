import { z } from "zod"

export const addPositionSchema = z.object({
  asset_id: z.number({ error: "Choisis un actif" }).int().positive(),
  platform_id: z.number({ error: "Choisis une plateforme" }).int().positive(),
  quantity: z.coerce
    .number({ error: "Quantité invalide" })
    .positive("La quantité doit être positive"),
})

// z.coerce.number() has a wider *input* type (unknown, pre-coercion) than its
// *output* type (number) - react-hook-form's form state is the input type,
// while the value handed to onSubmit is the output type after Zod parses it.
export type AddPositionFormInput = z.input<typeof addPositionSchema>
export type AddPositionFormValues = z.output<typeof addPositionSchema>

export const editQuantitySchema = z.object({
  quantity: z.coerce
    .number({ error: "Quantité invalide" })
    .positive("La quantité doit être positive"),
})

export type EditQuantityFormInput = z.input<typeof editQuantitySchema>
export type EditQuantityFormValues = z.output<typeof editQuantitySchema>
