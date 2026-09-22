import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/PasswordInput"
import { useAuth } from "@/providers/AuthProvider"
import { toApiError } from "@/lib/http-client"
import { useRetryAfterCountdown } from "@/lib/use-retry-after-countdown"
import { AuthLayout } from "@/features/auth/AuthLayout"
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas"

export function RegisterPage() {
  const { register: registerUser, isRegisterPending } = useAuth()
  const navigate = useNavigate()
  const retryAfter = useRetryAfterCountdown()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerUser(values)
      navigate("/", { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 429) {
        if (apiError.retryAfterSeconds) retryAfter.start(apiError.retryAfterSeconds)
        form.setError("root", {
          message: "Trop de tentatives. Patiente avant de réessayer.",
        })
      } else if (apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          form.setError(field as keyof RegisterFormValues, {
            message: messages[0],
          })
        }
      } else {
        form.setError("root", { message: apiError.message })
      }
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      description="Suis crypto, actions, or et ETF au même endroit"
    >
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>
                      15 caractères minimum, sans contrainte de casse ou de chiffre.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button
                type="submit"
                disabled={isRegisterPending || retryAfter.secondsLeft > 0}
                className="mt-1"
              >
                {retryAfter.secondsLeft > 0
                  ? `Réessaie dans ${retryAfter.secondsLeft}s`
                  : isRegisterPending
                    ? "Création..."
                    : "Créer le compte"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Déjà un compte ?{" "}
        <Link to="/login" className="text-foreground font-medium underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}
