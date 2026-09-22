import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssetSearch, useCreateAsset, useUpdateAsset } from "@/features/assets/hooks"
import { assetFormSchema, type AssetFormValues } from "@/features/assets/schemas"
import { ASSET_TYPE_LABELS } from "@/lib/format"
import { toApiError } from "@/lib/http-client"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import type { Asset, AssetSearchResult } from "@/types/api"

const EMPTY_VALUES: AssetFormValues = {
  name: "",
  symbol: "",
  type: "crypto",
  external_id: "",
  logo_url: "",
}

export function AssetFormDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const isEdit = asset !== null
  const isPending = createAsset.isPending || updateAsset.isPending

  // Search only makes sense when creating - editing an existing catalog
  // entry already has its own identity (id, external_id).
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const debouncedQuery = useDebouncedValue(searchQuery, 300)
  // Matches the backend's own `q` validation (2-100 chars) - no point
  // firing a request that can only 422.
  const searchEnabled = !isEdit && debouncedQuery.trim().length >= 2
  const { data: searchResults = [], isFetching: isSearching } = useAssetSearch(
    debouncedQuery,
    searchEnabled,
  )
  const showResults = isSearchFocused && searchEnabled

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    setSearchQuery("")
    form.reset(
      asset
        ? {
            name: asset.name,
            symbol: asset.symbol,
            type: asset.type,
            external_id: asset.external_id ?? "",
            logo_url: asset.logo_url ?? "",
          }
        : EMPTY_VALUES,
    )
  }, [asset, open, form])

  function handleSelectResult(result: AssetSearchResult) {
    form.setValue("name", result.name, { shouldDirty: true })
    form.setValue("symbol", result.symbol.slice(0, 10), { shouldDirty: true })
    form.setValue("type", result.type, { shouldDirty: true })
    form.setValue("external_id", result.external_id, { shouldDirty: true })
    setSearchQuery("")
    setIsSearchFocused(false)
  }

  async function onSubmit(values: AssetFormValues) {
    const payload = {
      ...values,
      external_id: values.external_id || null,
      logo_url: values.logo_url || null,
    }
    try {
      if (isEdit) {
        await updateAsset.mutateAsync({ id: asset.id, payload })
        toast.success("Actif mis à jour")
      } else {
        await createAsset.mutateAsync(payload)
        toast.success("Actif créé")
      }
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      form.setError("root", { message: apiError.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'actif" : "Ajouter un actif"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {!isEdit && (
              <div className="relative">
                <Label htmlFor="asset-search">Rechercher un actif (optionnel)</Label>
                <div className="relative mt-2">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    id="asset-search"
                    placeholder="bitcoin, Apple, VOO..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </div>
                {showResults && (
                  <div className="bg-popover absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md">
                    {isSearching ? (
                      <p className="text-muted-foreground p-3 text-sm">Recherche...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-muted-foreground p-3 text-sm">
                        Aucun résultat — pour l'or, remplis les champs manuellement
                        (identifiant provider <code>GC=F</code>).
                      </p>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.external_id}`}
                          type="button"
                          // onMouseDown fires before the input's onBlur, so the
                          // click registers instead of the dropdown closing first.
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectResult(result)
                          }}
                          className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-medium">{result.name}</span>
                            <span className="text-muted-foreground shrink-0">
                              {result.symbol}
                            </span>
                          </span>
                          <Badge variant="secondary" className="shrink-0">
                            {ASSET_TYPE_LABELS[result.type]}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Bitcoin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbole</FormLabel>
                    <FormControl>
                      <Input placeholder="BTC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={ASSET_TYPE_LABELS}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="external_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identifiant provider (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="bitcoin, AAPL, GC=F..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du logo (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
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
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
