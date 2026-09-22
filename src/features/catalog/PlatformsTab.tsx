import { MoreHorizontal, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EntityAvatar } from "@/components/EntityAvatar"
import { PlatformFormDialog } from "@/features/platforms/PlatformFormDialog"
import { useDeletePlatform, usePlatforms } from "@/features/platforms/hooks"
import { toApiError } from "@/lib/http-client"
import type { Platform } from "@/types/api"

type FormTarget = "closed" | "create" | Platform

export function PlatformsTab() {
  const { data: platforms = [], isLoading } = usePlatforms()
  const deletePlatform = useDeletePlatform()
  const [formTarget, setFormTarget] = useState<FormTarget>("closed")
  const [deletingPlatform, setDeletingPlatform] = useState<Platform | null>(null)

  async function confirmDelete() {
    if (!deletingPlatform) return
    try {
      await deletePlatform.mutateAsync(deletingPlatform.id)
      toast.success("Plateforme supprimée")
    } catch (error) {
      const apiError = toApiError(error)
      toast.error(
        apiError.status === 409 ? apiError.message : "La suppression a échoué.",
      )
    } finally {
      setDeletingPlatform(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormTarget("create")}>
          <Plus /> Ajouter une plateforme
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm">
          <p className="font-medium">Le catalogue de plateformes est vide</p>
          <p className="text-muted-foreground mt-1">
            Ajoute la première plateforme pour pouvoir l'utiliser dans un
            portefeuille.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <EntityAvatar
                        src={platform.logo_url}
                        label={platform.name}
                        className="size-5 text-[0.6rem]"
                      />
                      {platform.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Actions">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setFormTarget(platform)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingPlatform(platform)}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PlatformFormDialog
        platform={formTarget === "closed" || formTarget === "create" ? null : formTarget}
        open={formTarget !== "closed"}
        onOpenChange={(open) => !open && setFormTarget("closed")}
      />

      <AlertDialog
        open={deletingPlatform !== null}
        onOpenChange={(open) => !open && setDeletingPlatform(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deletingPlatform?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Si la plateforme est encore utilisée
              dans un portefeuille (le tien ou celui d'un autre utilisateur), la
              suppression sera refusée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
