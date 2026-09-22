import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarCropDialog } from "@/features/account/AvatarCropDialog"
import { useDeleteAvatar } from "@/features/account/hooks"
import { toApiError } from "@/lib/http-client"
import { getInitials } from "@/lib/initials"
import type { User } from "@/types/api"

export function AvatarSection({ user }: { user: User }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const deleteAvatar = useDeleteAvatar()

  async function handleDelete() {
    try {
      await deleteAvatar.mutateAsync()
      toast.success("Avatar supprimé")
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Avatar</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarImage src={user.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{getInitials(user.name) || <span>?</span>}</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
            Changer
          </Button>
          {user.avatar_url && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleteAvatar.isPending}
            >
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
      <AvatarCropDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  )
}
