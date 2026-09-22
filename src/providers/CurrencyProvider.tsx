import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useUpdateCurrency } from "@/features/account/hooks"
import { useExchangeRates } from "@/features/market/hooks"
import { convertFromUsd, formatMoney } from "@/lib/currency"
import { useAuth } from "@/providers/AuthProvider"
import type { CurrencyCode } from "@/types/api"

interface CurrencyContextValue {
  currency: CurrencyCode
  isRatesLoading: boolean
  ratesUnavailable: boolean
  convert: (amountUsd: number) => number | null
  format: (amountUsd: number) => string
  setCurrency: (currency: CurrencyCode) => Promise<void>
  isUpdating: boolean
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

/**
 * Single source of truth for the user's global currency preference
 * (persisted server-side on the user, see [[api-reference]]) and for
 * converting/formatting any USD-native amount into it. Every screen that
 * renders money should go through useCurrency().format(usdAmount) instead
 * of importing formatUsd/formatEur directly, so a currency change updates
 * the whole app at once.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const currency = user?.currency ?? "USD"
  const {
    data: rates,
    isLoading: isRatesLoading,
    isError: ratesUnavailable,
  } = useExchangeRates({ enabled: currency !== "USD" })
  const updateCurrency = useUpdateCurrency()

  const value = useMemo<CurrencyContextValue>(() => {
    const convert = (amountUsd: number) => convertFromUsd(amountUsd, currency, rates)
    return {
      currency,
      isRatesLoading: currency !== "USD" && isRatesLoading,
      ratesUnavailable: currency !== "USD" && ratesUnavailable,
      convert,
      format: (amountUsd: number) => formatMoney(convert(amountUsd), currency),
      setCurrency: async (next) => {
        await updateCurrency.mutateAsync(next)
      },
      isUpdating: updateCurrency.isPending,
    }
  }, [currency, rates, isRatesLoading, ratesUnavailable, updateCurrency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
