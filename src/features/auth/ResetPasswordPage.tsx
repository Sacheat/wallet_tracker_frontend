import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
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
import * as authApi from "@/features/auth/api"
import { AuthLayout } from "@/features/auth/AuthLayout"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas"
import { toApiError } from "@/lib/http-client"
import { useRetryAfterCountdown } from "@/lib/use-retry-after-countdown"

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const retryAfter = useRetryAfterCountdown()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token || !email) return
    try {
      await authApi.resetPassword({ token, email, ...values })
      toast.success("Mot de passe changé, tu peux te reconnecter.")
      navigate("/login", { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 429) {
        if (apiError.retryAfterSeconds) retryAfter.start(apiError.retryAfterSeconds)
        form.setError("root", {
          message: "Trop de tentatives. Patiente avant de réessayer.",
        })
      } else if (apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          form.setError(field as keyof ResetPasswordFormValues, {
            message: messages[0],
          })
        }
      } else {
        form.setError("root", { message: apiError.message })
      }
    }
  }

  // No token/email in the URL: the link is malformed or was opened
  // directly, not via the email - nothing to submit, so don't render a
  // form that can only fail.
  if (!token || !email) {
    return (
      <AuthLayout
        title="Lien invalide"
        description="Ce lien de réinitialisation est incomplet ou a expiré"
      >
        <Card>
          <CardContent className="text-muted-foreground text-sm">
            Redemande un lien de réinitialisation depuis la page de connexion.
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Demander un nouveau lien
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      description={`Choisis un nouveau mot de passe pour ${email}`}
    >
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
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
                      <Input type="password" autoComplete="new-password" {...field} />
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
                    ? "Changement..."
                    : "Changer le mot de passe"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
