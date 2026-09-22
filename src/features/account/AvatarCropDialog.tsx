import { useCallback, useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUploadAvatar } from "@/features/account/hooks"
import { getCroppedImageBlob, type PixelCrop } from "@/lib/crop-image"
import { toApiError } from "@/lib/http-client"
import { cn } from "@/lib/utils"

// Matches the backend's POST /user/avatar constraints exactly - checked
// client-side to avoid a round-trip for an image that can never be accepted.
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 2 * 1024 * 1024
const MAX_DIMENSION = 4096

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error("Image invalide"))
    image.src = url
  })
}

export function AvatarCropDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const uploadAvatar = useUploadAvatar()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const croppedAreaRef = useRef<PixelCrop | null>(null)

  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  function reset() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    croppedAreaRef.current = null
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format non supporté — jpeg, png, webp ou gif (pas svg).")
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("L'image dépasse 2 Mo.")
      return
    }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await readImageDimensions(url)
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        toast.error(`Dimensions trop grandes (max ${MAX_DIMENSION}×${MAX_DIMENSION}px).`)
        URL.revokeObjectURL(url)
        return
      }
      setObjectUrl(url)
    } catch {
      toast.error("Impossible de lire cette image.")
      URL.revokeObjectURL(url)
    }
  }

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    croppedAreaRef.current = croppedAreaPixels
  }, [])

  async function handleSave() {
    if (!objectUrl || !croppedAreaRef.current) return
    try {
      const blob = await getCroppedImageBlob(objectUrl, croppedAreaRef.current)
      await uploadAvatar.mutateAsync(blob)
      toast.success("Avatar mis à jour")
      handleOpenChange(false)
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer l'avatar</DialogTitle>
        </DialogHeader>

        {objectUrl ? (
          <div className="flex flex-col gap-4">
            <div className="bg-muted relative h-64 w-full overflow-hidden rounded-lg">
              <Cropper
                image={objectUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom"
              className="accent-primary"
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-12 text-center text-sm transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border",
            )}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              handleFile(event.dataTransfer.files[0])
            }}
          >
            <p className="text-muted-foreground">Glisse une image ici, ou</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choisir un fichier
            </Button>
            <p className="text-muted-foreground text-xs">
              JPEG, PNG, WEBP ou GIF — 2 Mo max
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>
        )}

        <DialogFooter>
          {objectUrl && (
            <Button type="button" variant="ghost" onClick={reset}>
              Choisir une autre image
            </Button>
          )}
          <Button type="button" onClick={handleSave} disabled={!objectUrl || uploadAvatar.isPending}>
            {uploadAvatar.isPending ? "Envoi..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
