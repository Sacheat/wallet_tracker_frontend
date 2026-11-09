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
import { Badge } from "@/components/ui/badge"
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
import { AssetFormDialog } from "@/features/assets/AssetFormDialog"
import { useAssets, useDeleteAsset } from "@/features/assets/hooks"
import { ASSET_TYPE_AVATAR_TONE, ASSET_TYPE_LABELS } from "@/lib/format"
import { getCatalogErrorMessage } from "@/lib/catalog-errors"
import type { Asset } from "@/types/api"

type FormTarget = "closed" | "create" | Asset

export function AssetsTab() {
  const { data: assets = [], isLoading } = useAssets()
  const deleteAsset = useDeleteAsset()
  const [formTarget, setFormTarget] = useState<FormTarget>("closed")
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)

  async function confirmDelete() {
    if (!deletingAsset) return
    try {
      await deleteAsset.mutateAsync(deletingAsset.id)
      toast.success("Actif supprimé")
    } catch (error) {
      // 403 (not the creator / no longer only theirs) and 409 (still in
      // use) both carry an explicit backend message worth showing as-is.
      toast.error(getCatalogErrorMessage(error, "La suppression a échoué."))
    } finally {
      setDeletingAsset(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormTarget("create")}>
          <Plus /> Ajouter un actif
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm">
          <p className="font-medium">Le catalogue d'actifs est vide</p>
          <p className="text-muted-foreground mt-1">
            Ajoute le premier actif pour pouvoir l'utiliser dans un portefeuille.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden sm:table-cell">Symbole</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Identifiant provider</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <EntityAvatar
                        src={asset.logo_url}
                        label={asset.symbol}
                        toneClassName={ASSET_TYPE_AVATAR_TONE[asset.type]}
                        className="size-5 text-[0.6rem]"
                      />
                      <span className="flex flex-col">
                        {asset.name}
                        <span className="text-muted-foreground text-xs font-normal sm:hidden">
                          {asset.symbol}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {asset.symbol}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ASSET_TYPE_LABELS[asset.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {asset.external_id ?? "—"}
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
                        <DropdownMenuItem onClick={() => setFormTarget(asset)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingAsset(asset)}
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

      <AssetFormDialog
        asset={formTarget === "closed" || formTarget === "create" ? null : formTarget}
        open={formTarget !== "closed"}
        onOpenChange={(open) => !open && setFormTarget("closed")}
      />

      <AlertDialog
        open={deletingAsset !== null}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deletingAsset?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Impossible si cet actif est encore utilisé dans un portefeuille ou
              une alerte, y compris ceux d'un autre utilisateur.
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
