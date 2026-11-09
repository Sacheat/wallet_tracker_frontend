import { LogOut, User as UserIcon, UserCog } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/initials"
import { useAuth } from "@/providers/AuthProvider"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleLogout() {
    try {
      await logout()
      navigate("/login", { replace: true })
    } catch {
      toast.error("La déconnexion a échoué, réessaie.")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="gap-2 px-1.5 xl:px-2" aria-label="Menu du compte">
            <Avatar className="size-6">
              <AvatarImage src={user.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="text-xs">
                {getInitials(user.name) || <UserIcon className="size-3.5" />}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm xl:inline">{user.name}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-muted-foreground text-xs">{user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/account")}>
          <UserCog /> Mon compte
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
