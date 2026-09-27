import { z } from "zod"

export const assetFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  symbol: z.string().min(1, "Le symbole est requis").max(10, "10 caractères maximum"),
  type: z.enum(["crypto", "stock", "gold", "etf"], { error: "Choisis un type" }),
  external_id: z.string().optional(),
  logo_url: z
    .union([z.url({ protocol: /^https$/, error: "URL https:// requise" }), z.literal("")])
    .optional(),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>
