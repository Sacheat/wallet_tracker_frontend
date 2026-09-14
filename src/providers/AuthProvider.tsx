import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useMemo, type ReactNode } from "react"
import * as authApi from "@/features/auth/api"
import type { LoginPayload, RegisterPayload } from "@/features/auth/api"
import type { User } from "@/types/api"

export const authQueryKey = ["auth", "me"] as const

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
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

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (loggedInUser) => {
      queryClient.setQueryData(authQueryKey, loggedInUser)
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (registeredUser) => {
      queryClient.setQueryData(authQueryKey, registeredUser)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Wipe every cached response, not just the user - the next session
      // (possibly a different user) must never see a stale portfolio/entries cache.
      queryClient.clear()
      queryClient.setQueryData(authQueryKey, null)
    },
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: Boolean(user),
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      isLoginPending: loginMutation.isPending,
      isRegisterPending: registerMutation.isPending,
    }),
    [user, isLoading, loginMutation, registerMutation, logoutMutation],
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
