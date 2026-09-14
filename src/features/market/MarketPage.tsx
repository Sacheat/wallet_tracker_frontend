import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { assetsKeys } from "@/features/assets/hooks"
import { AllocationBar } from "@/features/market/AllocationBar"
import { FearGreedGauge } from "@/features/market/FearGreedGauge"
import { PortfolioMoversCard } from "@/features/market/PortfolioMoversCard"
import { PortfolioNewsCard } from "@/features/market/PortfolioNewsCard"
import { portfolioKeys, usePortfolioEntries } from "@/features/portfolio/hooks"
import { ASSET_TYPE_LABELS } from "@/lib/format"

export function MarketPage() {
  const queryClient = useQueryClient()
  const { data: entries = [] } = usePortfolioEntries()

  const nonCryptoAssets = [
    ...new Map(
      entries
        .filter((entry) => entry.asset.type !== "crypto")
        .map((entry) => [entry.asset.id, entry.asset] as const),
    ).values(),
  ]

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["market"] })
    queryClient.invalidateQueries({ queryKey: portfolioKeys.news })
    queryClient.invalidateQueries({ queryKey: portfolioKeys.valued })
    queryClient.invalidateQueries({ queryKey: portfolioKeys.entries })
    queryClient.invalidateQueries({ queryKey: assetsKeys.all })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Marché</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw /> Actualiser
        </Button>
      </div>

      {nonCryptoAssets.length > 0 && (
        <div className="border-border bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Le Fear &amp; Greed Index et les actualités ne couvrent que la
            crypto —{" "}
            {nonCryptoAssets
              .map((asset) => `${asset.name} (${ASSET_TYPE_LABELS[asset.type]})`)
              .join(", ")}{" "}
            n'y apparaissent pas.
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationBar />
        <FearGreedGauge />
      </div>

      <PortfolioMoversCard />
      <PortfolioNewsCard />
    </div>
  )
}
