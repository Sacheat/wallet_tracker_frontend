import { useEffect, useRef, useState } from "react"

/**
 * Live countdown seeded from a 429 response's `Retry-After` header
 * (see `ApiErrorShape.retryAfterSeconds` in `http-client.ts`). `secondsLeft`
 * is 0 when idle; callers typically disable a submit button and swap its
 * label while it counts down.
 */
export function useRetryAfterCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function start(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSecondsLeft(seconds)
    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  return { secondsLeft, start }
}
