import { TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityAvatar } from "@/components/EntityAvatar"
import { GainLossValue } from "@/components/GainLossValue"
import { usePortfolioMovers, type PortfolioMover } from "@/features/market/hooks"
import { ASSET_TYPE_CHART_CLASS, ASSET_TYPE_CHART_TEXT_CLASS } from "@/lib/format"
import { cn } from "@/lib/utils"

function MoverRow({ mover }: { mover: PortfolioMover }) {
  return (
    <Link
      to={`/assets/${mover.asset.id}`}
      className="hover:bg-accent/50 -mx-2 flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors"
    >
      <span className="flex items-center gap-2">
        <EntityAvatar
          src={mover.asset.logo_url}
          label={mover.asset.symbol}
          toneClassName={cn(
            `${ASSET_TYPE_CHART_CLASS[mover.asset.type]}/15`,
            ASSET_TYPE_CHART_TEXT_CLASS[mover.asset.type],
          )}
          className="size-5 text-[0.6rem]"
        />
        <span className="font-medium">{mover.asset.name}</span>
        <span className="text-muted-foreground">{mover.asset.symbol}</span>
      </span>
      <GainLossValue value={mover.change24h} />
    </Link>
  )
}

export function PortfolioMoversCard() {
  const { gainers, losers, isLoading, hasHoldings, hasData } = usePortfolioMovers()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="size-4" /> Mouvements (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !hasHoldings ? (
          <p className="text-muted-foreground text-sm">
            Ajoute des positions pour voir tes plus gros mouvements.
          </p>
        ) : !hasData ? (
          <p className="text-muted-foreground text-sm">
            Pas encore assez d'historique pour calculer une variation sur 24h
            — ça se remplit au fil des prochaines heures.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">Hausses</p>
              {gainers.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune hausse pour l'instant.</p>
              ) : (
                gainers.map((mover) => <MoverRow key={mover.asset.id} mover={mover} />)
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">Baisses</p>
              {losers.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune baisse pour l'instant.</p>
              ) : (
                losers.map((mover) => <MoverRow key={mover.asset.id} mover={mover} />)
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
