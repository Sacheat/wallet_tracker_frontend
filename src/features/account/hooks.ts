import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as accountApi from "@/features/account/api"
import { authQueryKey } from "@/providers/AuthProvider"
import type { User } from "@/types/api"

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: (user) => {
      // The response already reflects a reset email_verified_at when the
      // email changed - ProtectedRoute reacts to that on its own.
      queryClient.setQueryData(authQueryKey, user)
    },
  })
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: accountApi.updatePassword })
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.updateCurrency,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user)
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.completeOnboarding,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user)
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.uploadAvatar,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user)
    },
  })
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.deleteAvatar,
    onSuccess: () => {
      // 204 no content - patch the cached user locally instead of refetching.
      queryClient.setQueryData<User | null>(authQueryKey, (current) =>
        current ? { ...current, avatar_url: null } : current,
      )
    },
  })
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: accountApi.deleteAccount })
}
