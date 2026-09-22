import { useEffect, useRef, useState } from "react"

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

/**
 * Eases from the previous value to a new one over `duration` ms instead of
 * snapping - used on the portfolio's hero total so a refetch (after adding/
 * editing a position, or a manual refresh) visibly shows what changed
 * rather than just replacing the number. Skips the animation entirely
 * (jumps straight to target) on first render, when the target is null, and
 * when the user has requested reduced motion.
 */
export function useAnimatedNumber(target: number | null, duration = 700) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (target === null) return
    const targetValue = target
    if (fromRef.current === null || prefersReducedMotion()) {
      fromRef.current = targetValue
      setValue(targetValue)
      return
    }
    const from = fromRef.current
    if (from === targetValue) return

    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (targetValue - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = targetValue
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}
