import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * A password field masked by default with a reveal toggle - used for every
 * password entry in the app (login, register, account password change,
 * reset password, delete-account confirmation). Wraps Input rather than
 * duplicating its styling, so it stays visually identical everywhere
 * except for the added toggle button.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
