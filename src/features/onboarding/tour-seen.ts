// TEMP until the backend ships `onboarding_completed_at` on the user (see
// api_reference memory - requested, not yet landed). Swap this module's
// implementation for reading/writing that field via PATCH /user once it
// does, and delete this file. sessionStorage (not localStorage) is
// deliberate: this is a throwaway stub, not meant to survive as the real
// cross-device persistence mechanism.
const STORAGE_KEY = "wt-onboarding-seen-temp"

export function hasSeenTour(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    // Storage inaccessible (private browsing, blocked, ...) - fail closed
    // rather than risk re-showing the tour on every navigation.
    return true
  }
}

export function markTourSeen(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1")
  } catch {
    // Nothing we can do - worst case the tour re-triggers next reload.
  }
}
