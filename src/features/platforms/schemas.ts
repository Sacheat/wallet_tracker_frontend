import { z } from "zod"

export const platformFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
})

export type PlatformFormValues = z.infer<typeof platformFormSchema>
