import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"
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
import { useAuth } from "@/providers/AuthProvider"
import { toApiError } from "@/lib/http-client"
import { useRetryAfterCountdown } from "@/lib/use-retry-after-countdown"
import { AuthLayout } from "@/features/auth/AuthLayout"
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas"

export function LoginPage() {
  const { login, isLoginPending } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const retryAfter = useRetryAfterCountdown()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values)
      const from = (location.state as { from?: Location })?.from
      navigate(from?.pathname ?? "/", { replace: true })
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
      title="Connexion"
      description="Accède à ton portefeuille multi-actifs"
    >
      <Card>
        <CardContent>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Mot de passe</FormLabel>
                      <Link
                        to="/forgot-password"
                        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
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
                disabled={isLoginPending || retryAfter.secondsLeft > 0}
                className="mt-1"
              >
                {retryAfter.secondsLeft > 0
                  ? `Réessaie dans ${retryAfter.secondsLeft}s`
                  : isLoginPending
                    ? "Connexion..."
                    : "Se connecter"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link to="/register" className="text-foreground font-medium underline underline-offset-4">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  )
}
