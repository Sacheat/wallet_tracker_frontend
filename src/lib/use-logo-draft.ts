import { useCallback, useEffect, useRef, useState } from "react"
import { KEEP_LOGO, type LogoDraft } from "@/lib/logo-upload"

/**
 * Draft state for a catalog logo, owning the blob: preview URL's lifetime:
 * revoked whenever the draft moves on and when the dialog unmounts.
 */
export function useLogoDraft() {
  const [draft, setDraftState] = useState<LogoDraft>(KEEP_LOGO)
  const previewUrlRef = useRef<string | null>(null)

  const setDraft = useCallback((next: LogoDraft) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = next.kind === "replace" ? next.previewUrl : null
    setDraftState(next)
  }, [])

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  return [draft, setDraft] as const
}
