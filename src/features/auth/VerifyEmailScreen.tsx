import { Mail } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import * as authApi from "@/features/auth/api"
import { AuthLayout } from "@/features/auth/AuthLayout"
import { toApiError } from "@/lib/http-client"
import { useRetryAfterCountdown } from "@/lib/use-retry-after-countdown"
import { authQueryKey, useAuth } from "@/providers/AuthProvider"

/**
 * Full-screen block shown instead of the app shell while
 * `user.email_verified_at` is null - every /api/* call 403s for an
 * unverified account, so there's nothing useful to show underneath. Covers
 * both fresh signups and the re-verification triggered by an email change
 * (see PATCH /user in the account page, once built).
 */
export function VerifyEmailScreen() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [isSending, setIsSending] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const retryAfter = useRetryAfterCountdown()

  // The email's verification link opens in a new tab (browsers don't
  // reuse an existing one for that), so this tab never sees the redirect
  // that would otherwise refresh the cached user - offer a manual check
  // instead of promising an auto-update that won't happen here.
  async function handleCheckAgain() {
    setIsChecking(true)
    try {
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
    } finally {
      setIsChecking(false)
    }
  }

  async function handleResend() {
    setIsSending(true)
    setJustSent(false)
    try {
      await authApi.resendVerificationEmail()
      setJustSent(true)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 429 && apiError.retryAfterSeconds) {
        retryAfter.start(apiError.retryAfterSeconds)
      }
      toast.error(apiError.message)
    } finally {
      setIsSending(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      toast.error("La déconnexion a échoué, réessaie.")
    }
  }

  return (
    <AuthLayout
      title="Vérifie ton adresse email"
      description={
        user?.email
          ? `Un lien de vérification a été envoyé à ${user.email}.`
          : "Un lien de vérification t'a été envoyé par email."
      }
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
            <Mail className="size-5" />
          </div>
          <p className="text-muted-foreground text-sm">
            Clique sur le lien reçu par email pour activer ton compte — il
            s'ouvre dans un nouvel onglet. Pense à vérifier tes spams.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={handleResend}
              disabled={isSending || retryAfter.secondsLeft > 0}
              className="w-full"
            >
              {retryAfter.secondsLeft > 0
                ? `Réessaie dans ${retryAfter.secondsLeft}s`
                : isSending
                  ? "Envoi..."
                  : justSent
                    ? "Email renvoyé"
                    : "Renvoyer l'email"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckAgain}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? "Vérification..." : "J'ai vérifié, actualiser"}
            </Button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
          >
            Se déconnecter
          </button>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
