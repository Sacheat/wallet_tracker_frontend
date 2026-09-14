import { z } from "zod"

export const platformFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  logo_url: z.union([z.string().url("URL invalide"), z.literal("")]).optional(),
})

export type PlatformFormValues = z.infer<typeof platformFormSchema>
