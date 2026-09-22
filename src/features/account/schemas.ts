import { z } from "zod"
import { passwordSchema } from "@/features/auth/schemas"

/**
 * `current_password` is only required by the backend when `email` changes -
 * built as a function of the account's current email so the conditional
 * check can compare against it directly, the same conditional-field
 * pattern as `features/alerts/schemas.ts`.
 */
export function buildProfileSchema(currentEmail: string) {
  return z
    .object({
      name: z.string().min(1, "Le nom est requis"),
      email: z.string().min(1, "L'email est requis").email("Email invalide"),
      current_password: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.email !== currentEmail && !data.current_password) {
        ctx.addIssue({
          code: "custom",
          path: ["current_password"],
          message: "Requis pour changer d'email",
        })
      }
    })
}

export type ProfileFormValues = z.infer<ReturnType<typeof buildProfileSchema>>

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Le mot de passe actuel est requis"),
    password: passwordSchema,
    password_confirmation: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirmation"],
  })

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
})

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>
