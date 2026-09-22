import { driver, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import "@/features/onboarding/tour.css"
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { TOUR_STEPS } from "@/features/onboarding/steps"
import { hasSeenTour, markTourSeen } from "@/features/onboarding/tour-seen"
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
  const driverRef = useRef<Driver | null>(null)
  const autoStartedRef = useRef(false)

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
      onDestroyed: () => {
        markTourSeen()
      },
      onNextClick: (_element, _step, opts) => {
        const nextIndex = (opts.state.activeIndex ?? 0) + 1
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
      })),
    )
    const firstStep = TOUR_STEPS[0]
    if (firstStep.route && firstStep.route !== window.location.pathname) {
      navigate(firstStep.route)
    }
    d.drive(0)
  }

  // Auto-start once, the first time an authenticated + verified user who
  // hasn't seen the tour loads the app. The verified check matters because
  // ProtectedRoute blocks the whole app behind VerifyEmailScreen otherwise -
  // starting the tour there would spotlight elements that don't exist yet.
  useEffect(() => {
    if (autoStartedRef.current) return
    if (!isAuthenticated || !user) return
    if (user.email_verified_at === null) return
    if (hasSeenTour()) return
    autoStartedRef.current = true
    const timer = setTimeout(start, 600)
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
