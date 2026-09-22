import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AvatarSection } from "@/features/account/AvatarSection"
import { CurrencySection } from "@/features/account/CurrencySection"
import { DangerZoneSection } from "@/features/account/DangerZoneSection"
import { PasswordSection } from "@/features/account/PasswordSection"
import { ProfileSection } from "@/features/account/ProfileSection"
import { useAuth } from "@/providers/AuthProvider"
import { useOnboarding } from "@/providers/OnboardingProvider"

export function AccountPage() {
  const { user } = useAuth()
  const { start } = useOnboarding()
  // ProtectedRoute guarantees a verified, authenticated user by the time
  // this route renders - guard is here only to satisfy TypeScript.
  if (!user) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mon compte</h1>
          <p className="text-muted-foreground text-sm">
            Gère ton profil, ton mot de passe et ton avatar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={start}>
          <CircleHelp /> Revoir le tutoriel
        </Button>
      </div>
      <AvatarSection user={user} />
      <ProfileSection user={user} />
      <CurrencySection />
      <PasswordSection />
      <DangerZoneSection />
    </div>
  )
}
