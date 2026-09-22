import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import * as authApi from "@/features/auth/api"
import { AuthLayout } from "@/features/auth/AuthLayout"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas"
import { toApiError } from "@/lib/http-client"
import { useRetryAfterCountdown } from "@/lib/use-retry-after-countdown"

export function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false)
  const retryAfter = useRetryAfterCountdown()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await authApi.forgotPassword(values.email)
      // The backend always answers 200 with the same message regardless of
      // whether the account exists - don't try to read anything into it,
      // just show the neutral confirmation state.
      setIsSent(true)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 429) {
        if (apiError.retryAfterSeconds) retryAfter.start(apiError.retryAfterSeconds)
        form.setError("root", {
          message: "Trop de tentatives. Patiente avant de réessayer.",
        })
      } else {
        form.setError("root", { message: apiError.message })
      }
    }
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      description="On t'envoie un lien de réinitialisation par email"
    >
      <Card>
        <CardContent>
          {isSent ? (
            <p className="text-muted-foreground text-sm">
              Si un compte existe avec cet email, un lien de réinitialisation
              vient d'être envoyé. Pense à vérifier tes spams.
            </p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                {form.formState.errors.root && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.root.message}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || retryAfter.secondsLeft > 0}
                  className="mt-1"
                >
                  {retryAfter.secondsLeft > 0
                    ? `Réessaie dans ${retryAfter.secondsLeft}s`
                    : form.formState.isSubmitting
                      ? "Envoi..."
                      : "Envoyer le lien"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        <Link to="/login" className="text-foreground font-medium underline underline-offset-4">
          Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  )
}
