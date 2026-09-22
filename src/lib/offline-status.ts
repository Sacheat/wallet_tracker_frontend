import { useSyncExternalStore } from "react"

// Tiny external store (no context/provider needed) tracking whether the
// last network activity reached the backend at all - not the browser's own
// navigator.onLine, which only says the device has a network interface up,
// not that this specific backend is reachable. That distinction matters
// here: the Laravel dev server isn't running 24/7 (see api_reference
// memory), so "backend unreachable while the wifi is fine" is the realistic
// failure mode, not a literal offline device.
let offline = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function setOfflineStatus(next: boolean) {
  if (offline === next) return
  offline = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return offline
}

export function useOfflineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
