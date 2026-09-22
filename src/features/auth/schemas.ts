import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  remember: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

// Matches the backend rule exactly: 15-64 characters, no composition
// requirement (uppercase/digit/symbol) — that's the NIST SP 800-63B
// recommendation the API follows. The backend additionally rejects
// passwords found in a known breach (HaveIBeenPwned), surfaced as a 422
// on `errors.password` that the form displays like any other field error.
export const passwordSchema = z
  .string()
  .min(15, "15 caractères minimum")
  .max(64, "64 caractères maximum")

export const registerSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis"),
    email: z.string().min(1, "L'email est requis").email("Email invalide"),
    password: passwordSchema,
    password_confirmation: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirmation"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    password_confirmation: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirmation"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
