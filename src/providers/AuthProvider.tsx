import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import * as authApi from "@/features/auth/api"
import type { LoginPayload, RegisterPayload } from "@/features/auth/api"
import { onUnauthenticated } from "@/lib/http-client"
import type { User } from "@/types/api"

export const authQueryKey = ["auth", "me"] as const

// Drops every cached response except the auth query itself. That one must
// be updated in place with setQueryData, never removed: the useQuery
// observer below doesn't listen for removals, so it would keep rendering
// the old user until something else happened to re-render this provider.
function removeAllButAuth(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== authQueryKey[0],
  })
}

// Tells the app's other open tabs that this tab's session ended, so they
// drop their in-memory cache right away instead of keeping someone's
// portfolio on screen until their next request happens to 401.
// One instance per tab: a BroadcastChannel never receives its own messages,
// so this tab doesn't re-handle the logout it just broadcast.
const authChannel =
  typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel("wallet-tracker-auth")

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  // For flows that end the session server-side on their own (password
  // change, account deletion): wipes the cache and signs other tabs out.
  endSession: () => void
  isLoginPending: boolean
  isRegisterPending: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: authQueryKey,
    queryFn: authApi.getCurrentUser,
    staleTime: Infinity,
  })

  // Every cached response belongs to whoever was signed in - the next
  // session (possibly a different user) must never see any of it. Query
  // keys aren't user-scoped, so the only safe move is dropping everything.
  const clearLocalSession = useCallback(() => {
    removeAllButAuth(queryClient)
    queryClient.setQueryData(authQueryKey, null)
  }, [queryClient])

  const endSession = useCallback(() => {
    clearLocalSession()
    authChannel?.postMessage("logout")
  }, [clearLocalSession])

  // Server said 401 on a request made while we believed we were signed in:
  // the session expired or was ended elsewhere. Only react once, while a
  // user is still cached - concurrent 401s from the same page would
  // otherwise each fire a toast.
  useEffect(
    () =>
      onUnauthenticated(() => {
        if (!queryClient.getQueryData(authQueryKey)) return
        endSession()
        toast.info("Ta session a expiré, reconnecte-toi.")
      }),
    [queryClient, endSession],
  )

  useEffect(() => {
    if (!authChannel) return
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "logout") clearLocalSession()
    }
    authChannel.addEventListener("message", handleMessage)
    return () => authChannel.removeEventListener("message", handleMessage)
  }, [clearLocalSession])

  const startSession = useCallback(
    (nextUser: User) => {
      // Defensive: if a previous session's data somehow survived (a logout
      // that failed on the network, a 401 no one reacted to), it must not be
      // served from cache to the account that just signed in.
      removeAllButAuth(queryClient)
      queryClient.setQueryData(authQueryKey, nextUser)
    },
    [queryClient],
  )

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: startSession,
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: startSession,
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: endSession,
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: Boolean(user),
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      endSession,
      isLoginPending: loginMutation.isPending,
      isRegisterPending: registerMutation.isPending,
    }),
    [user, isLoading, loginMutation, registerMutation, logoutMutation, endSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
