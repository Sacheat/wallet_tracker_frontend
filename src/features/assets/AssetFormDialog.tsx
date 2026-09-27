import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { EntityAvatar } from "@/components/EntityAvatar"
import { LogoPicker } from "@/components/LogoPicker"
import { useAssetSearch, useCreateAsset, useUpdateAsset } from "@/features/assets/hooks"
import { assetFormSchema, type AssetFormValues } from "@/features/assets/schemas"
import {
  ASSET_TYPE_CHART_CLASS,
  ASSET_TYPE_CHART_TEXT_CLASS,
  ASSET_TYPE_LABELS,
} from "@/lib/format"
import { getCatalogErrorMessage } from "@/lib/catalog-errors"
import { KEEP_LOGO, resolveLogoPreview } from "@/lib/logo-upload"
import { useLogoDraft } from "@/lib/use-logo-draft"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { cn } from "@/lib/utils"
import type { Asset, AssetSearchResult } from "@/types/api"

const EMPTY_VALUES: AssetFormValues = {
  name: "",
  symbol: "",
  type: "crypto",
  external_id: "",
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

  // Live preview card at the top mirrors this exact row shape (avatar,
  // name, symbol, type badge) as it'll appear in the catalog table -
  // watch() re-renders on every keystroke, which is fine at this scale.
  const previewName = form.watch("name")
  const previewSymbol = form.watch("symbol")
  const previewType = form.watch("type")
  const [logoDraft, setLogoDraft] = useLogoDraft()
  const previewLogoUrl = resolveLogoPreview(asset?.logo_url ?? null, logoDraft)

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
          }
        : EMPTY_VALUES,
    )
    setLogoDraft(KEEP_LOGO)
  }, [asset, open, form, setLogoDraft])

  function handleSelectResult(result: AssetSearchResult) {
    form.setValue("name", result.name, { shouldDirty: true })
    form.setValue("symbol", result.symbol.slice(0, 10), { shouldDirty: true })
    form.setValue("type", result.type, { shouldDirty: true })
    form.setValue("external_id", result.external_id, { shouldDirty: true })
    setSearchQuery("")
    setIsSearchFocused(false)
  }

  // The provider id has no manual input anymore - it's either set by
  // picking a search result, or (for gold, which the search API doesn't
  // index at all - see api_reference memory) fixed to the one value the
  // backend expects. Clears it back out if the type moves away from gold,
  // so a stale "GC=F" can't silently linger on a non-gold asset.
  function handleTypeChange(value: AssetFormValues["type"] | null) {
    if (value === null) return
    form.setValue("type", value, { shouldDirty: true })
    if (value === "gold") {
      form.setValue("external_id", "GC=F", { shouldDirty: true })
    } else if (form.getValues("external_id") === "GC=F") {
      form.setValue("external_id", "", { shouldDirty: true })
    }
  }

  async function onSubmit(values: AssetFormValues) {
    const payload = { ...values, external_id: values.external_id || null }
    try {
      if (isEdit) {
        const { logoError } = await updateAsset.mutateAsync({
          id: asset.id,
          payload,
          logo: logoDraft,
        })
        if (logoError) {
          // The fields are saved; stay open so the logo alone can be
          // retried (re-submitting only re-sends an idempotent PATCH).
          form.setError("root", {
            message: `Modifications enregistrées, mais pas le logo : ${logoError}`,
          })
          return
        }
        toast.success("Actif mis à jour")
      } else {
        const { logoError } = await createAsset.mutateAsync({ payload, logo: logoDraft })
        if (logoError) {
          // The asset exists now - close rather than let a re-submit POST
          // it again (it would 422 on the unique symbol anyway).
          toast.warning(`Actif créé, mais sans logo : ${logoError}`, {
            description: "Tu peux l'ajouter en modifiant l'actif.",
          })
        } else {
          toast.success("Actif créé")
        }
      }
      onOpenChange(false)
    } catch (error) {
      // The JSON save itself failed (403 not allowed to edit, 422, 429...).
      // The mutation stops there, so the logo is never sent after a
      // refused PATCH - it would only be refused too.
      form.setError("root", { message: getCatalogErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'actif" : "Ajouter un actif"}</DialogTitle>
        </DialogHeader>
        <Card size="sm" className="bg-muted/40">
          <CardContent className="flex items-center gap-3">
            <EntityAvatar
              src={previewLogoUrl}
              label={previewSymbol || previewName || "?"}
              toneClassName={cn(
                `${ASSET_TYPE_CHART_CLASS[previewType]}/15`,
                ASSET_TYPE_CHART_TEXT_CLASS[previewType],
              )}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {previewName || "Nom de l'actif"}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {previewSymbol || "Symbole"}
              </span>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {ASSET_TYPE_LABELS[previewType]}
            </Badge>
          </CardContent>
        </Card>
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
                  <div
                    // A plain mousedown on the scrollbar (not on a result
                    // button) still bubbles here - without this, it blurs
                    // the input first and closes the dropdown before the
                    // click/drag can register, making the scrollbar
                    // unusable. Guarding at the container level (rather
                    // than only on each button) fixes that for any mousedown
                    // inside, including the scrollbar track itself.
                    onMouseDown={(e) => e.preventDefault()}
                    className="bg-popover border-border absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border p-1 shadow-lg"
                  >
                    {isSearching ? (
                      <p className="text-muted-foreground p-3 text-sm">Recherche...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-muted-foreground p-3 text-sm">
                        Aucun résultat — pour l'or, choisis simplement le type « Or »
                        dans le formulaire ci-dessous.
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
                          className="hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors"
                        >
                          <EntityAvatar
                            src={null}
                            label={result.symbol}
                            toneClassName={cn(
                              `${ASSET_TYPE_CHART_CLASS[result.type]}/15`,
                              ASSET_TYPE_CHART_TEXT_CLASS[result.type],
                            )}
                            className="size-7 text-[0.65rem]"
                          />
                          <span className="flex min-w-0 flex-1 items-center gap-2">
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
                        onValueChange={handleTypeChange}
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
            <LogoPicker
              currentUrl={asset?.logo_url ?? null}
              draft={logoDraft}
              onDraftChange={setLogoDraft}
              disabled={isPending}
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
