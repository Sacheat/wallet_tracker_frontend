import { ImageUp, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  KEEP_LOGO,
  LOGO_ACCEPTED_TYPES,
  LOGO_CONSTRAINTS_LABEL,
  resolveLogoPreview,
  validateLogoFile,
  type LogoDraft,
} from "@/lib/logo-upload"

export function LogoPicker({
  currentUrl,
  draft,
  onDraftChange,
  disabled,
}: {
  // The logo already saved on the resource, if any (null when creating).
  currentUrl: string | null
  draft: LogoDraft
  onDraftChange: (draft: LogoDraft) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    // Reset so picking the same file again after an error re-fires onChange.
    if (inputRef.current) inputRef.current.value = ""
    if (!file) return
    const validationError = await validateLogoFile(file)
    setError(validationError)
    if (validationError) return
    onDraftChange({ kind: "replace", file, previewUrl: URL.createObjectURL(file) })
  }

  function handleRemove() {
    setError(null)
    // Dropping a not-yet-uploaded file goes back to whatever is saved;
    // only an already-saved logo needs an explicit DELETE.
    onDraftChange(draft.kind === "replace" && currentUrl === null ? KEEP_LOGO : { kind: "remove" })
  }

  const hasLogo = resolveLogoPreview(currentUrl, draft) !== null

  return (
    <div className="grid gap-2">
      <Label>Logo (optionnel)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp />
          {hasLogo ? "Changer" : "Choisir une image"}
        </Button>
        {hasLogo && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={handleRemove}>
            <Trash2 />
            Retirer
          </Button>
        )}
        {draft.kind === "replace" && (
          <span className="text-muted-foreground min-w-0 truncate text-xs">{draft.file.name}</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={LOGO_ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <p className="text-muted-foreground text-xs">{LOGO_CONSTRAINTS_LABEL}</p>
      )}
    </div>
  )
}
