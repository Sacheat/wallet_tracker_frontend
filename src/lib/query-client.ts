import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import axios from "axios"
import { setOfflineStatus } from "@/lib/offline-status"

// A response-less axios error (no `error.response` at all) means the
// request never reached the backend - connection refused, DNS failure,
// CORS preflight rejection, etc. - as opposed to a 4xx/5xx, which means
// the server was reachable and just said no. Only the former is "offline"
// in the sense this app cares about.
function isNetworkError(error: unknown) {
  return axios.isAxiosError(error) && !error.response
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isNetworkError(error)) setOfflineStatus(true)
    },
    onSuccess: () => setOfflineStatus(false),
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isNetworkError(error)) setOfflineStatus(true)
    },
    onSuccess: () => setOfflineStatus(false),
  }),
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
