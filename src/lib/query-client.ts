import { QueryClient } from "@tanstack/react-query"
import axios from "axios"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response?.status) {
          // Don't retry client errors (auth, validation, not found, etc.) -
          // only transient network/server failures are worth a retry.
          if (error.response.status < 500) return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
