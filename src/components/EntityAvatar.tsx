import { useEffect, useState } from "react"
import { safeImageUrl } from "@/lib/safe-url"
import { cn } from "@/lib/utils"

/**
 * Logo image with a monogram fallback - shown wherever a catalog entry
 * (asset or platform) needs a visual identity: table rows, search results,
 * and the live preview on the add/edit forms. Falls back to initials the
 * moment the image URL is empty OR fails to load (broken/typo'd URL),
 * rather than leaving a broken-image icon or a blank circle.
 */
export function EntityAvatar({
  src,
  label,
  toneClassName,
  className,
}: {
  src?: string | null
  // Used for the monogram (first 2 chars) when there's no image.
  label: string
  // Background + text color classes for the fallback monogram, e.g.
  // "bg-chart-1/15 text-chart-1" - defaults to a neutral muted tone.
  toneClassName?: string
  className?: string
}) {
  const [errored, setErrored] = useState(false)

  // A new src (e.g. picking a different search result) deserves a fresh
  // attempt rather than staying stuck on a previous load failure.
  useEffect(() => {
    setErrored(false)
  }, [src])

  const safeSrc = safeImageUrl(src)
  const showImage = Boolean(safeSrc) && !errored

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-medium",
        toneClassName ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {showImage ? (
        <img
          src={safeSrc ?? undefined}
          alt=""
          className="size-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{label.trim().slice(0, 2).toUpperCase() || "?"}</span>
      )}
    </div>
  )
}
