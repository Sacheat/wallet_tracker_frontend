import { driver, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import "@/features/onboarding/tour.css"
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCompleteOnboarding } from "@/features/account/hooks"
import { TOUR_STEPS } from "@/features/onboarding/steps"
import { useAuth } from "@/providers/AuthProvider"

interface OnboardingContextValue {
  start: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

/**
 * Multi-page guided tour (driver.js). The step list (features/onboarding/
 * steps.ts) is fed to driver.js once via setSteps/drive - onNextClick/
 * onPrevClick are overridden globally so that navigating to a step's route
 * happens first, then driver.js's own `waitForElement` polls for the
 * target to mount before highlighting it (no custom wait/observer logic
 * needed - see the DriveStep.waitForElement option).
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const completeOnboarding = useCompleteOnboarding()
  const driverRef = useRef<Driver | null>(null)
  const autoStartedRef = useRef(false)
  // getDriver() below only builds the driver.js instance once (config
  // callbacks are captured at that point) - route the persistence call
  // through a ref updated every render instead of closing over `mutate`
  // directly, so onDestroyed always calls the current mutation, not a
  // stale one from whichever render first constructed the driver.
  const completeOnboardingRef = useRef(completeOnboarding.mutate)
  useEffect(() => {
    completeOnboardingRef.current = completeOnboarding.mutate
  }, [completeOnboarding.mutate])

  function getDriver() {
    if (driverRef.current) return driverRef.current
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      allowClose: true,
      popoverClass: "wt-tour-popover",
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Suivant",
      prevBtnText: "Précédent",
      doneBtnText: "Terminer",
      // Always marks onboarding as completed when the tour closes, whether
      // finished or skipped (closed early), and whether started
      // automatically or replayed manually from /account - a redundant
      // PATCH on an already-completed account is harmless (just bumps the
      // timestamp) and keeping this unconditional avoids a stale-closure
      // check on `user` (this callback is captured once, see the comment
      // above completeOnboardingRef).
      onDestroyed: () => {
        completeOnboardingRef.current()
      },
      onNextClick: (_element, _step, opts) => {
        const nextIndex = (opts.state.activeIndex ?? 0) + 1
        if (nextIndex >= TOUR_STEPS.length) {
          // Reached the end for real (clicked "Terminer", not closed early
          // via the X) - onDestroyed still handles the actual persistence.
          toast.success("Tu es prêt(e) ! 🎉", {
            description: "Relance ce tutoriel à tout moment depuis ton compte.",
          })
        }
        const nextStep = TOUR_STEPS[nextIndex]
        if (nextStep?.route && nextStep.route !== window.location.pathname) {
          navigate(nextStep.route)
        }
        opts.driver.moveNext()
      },
      onPrevClick: (_element, _step, opts) => {
        const prevIndex = (opts.state.activeIndex ?? 0) - 1
        const prevStep = TOUR_STEPS[prevIndex]
        if (prevStep?.route && prevStep.route !== window.location.pathname) {
          navigate(prevStep.route)
        }
        opts.driver.movePrevious()
      },
    })
    return driverRef.current
  }

  function start() {
    const d = getDriver()
    d.setSteps(
      TOUR_STEPS.map((step) => ({
        element: step.target,
        popover: { title: step.title, description: step.description },
        // Covers the delay between navigate() and the target actually
        // mounting on the new route - driver.js polls internally.
        waitForElement: 2000,
        skipMissingElement: true,
        // Interactive steps stay genuinely clickable (driver.js doesn't
        // disable pointer events on the highlighted element by default) -
        // a real click destroys the tour right as the element's own click
        // handler fires (e.g. AddPositionDialog opening), so the dialog
        // renders cleanly instead of sitting behind the tour's overlay.
        ...(step.interactive && {
          onHighlighted: (element?: Element) => {
            element?.addEventListener("click", () => d.destroy(), { once: true })
          },
        }),
      })),
    )
    const firstStep = TOUR_STEPS[0]
    if (firstStep.route && firstStep.route !== window.location.pathname) {
      navigate(firstStep.route)
    }
    d.drive(0)
  }

  // Offers the tour once, the first time an authenticated + verified user
  // who hasn't seen it loads the app - asks first rather than dropping a
  // full-screen spotlight on them unprompted. The verified check matters
  // because ProtectedRoute blocks the whole app behind VerifyEmailScreen
  // otherwise - offering the tour there would spotlight elements that
  // don't exist yet. Declining also marks it completed (no PATCH here
  // specifically - reuses the same completeOnboardingRef the tour itself
  // calls on close) so the prompt doesn't reappear every login; ignoring
  // the toast entirely (letting it time out) asks again next time.
  useEffect(() => {
    if (autoStartedRef.current) return
    if (!isAuthenticated || !user) return
    if (user.email_verified_at === null) return
    if (user.onboarding_completed_at !== null) return
    autoStartedRef.current = true
    const timer = setTimeout(() => {
      toast("On te fait visiter l'app ?", {
        description: "Un petit tour guidé, trente secondes montre en main.",
        duration: 15_000,
        action: { label: "C'est parti", onClick: () => start() },
        cancel: { label: "Non merci", onClick: () => completeOnboardingRef.current() },
      })
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  return (
    <OnboardingContext.Provider value={{ start }}>{children}</OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
