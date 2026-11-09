import { ArrowLeft, Newspaper } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityAvatar } from "@/components/EntityAvatar"
import { GainLossValue } from "@/components/GainLossValue"
import { PriceHistoryChart } from "@/components/PriceHistoryChart"
import { StatTile } from "@/components/StatTile"
import { useAsset, useAssetDetails, useAssetNews } from "@/features/assets/hooks"
import {
  ASSET_TYPE_AVATAR_TONE,
  ASSET_TYPE_LABELS,
} from "@/lib/format"
import { parseApiDate } from "@/lib/parse-date"
import { safeLinkUrl } from "@/lib/safe-url"
import { useAnimatedNumber } from "@/lib/use-animated-number"
import { useCurrency } from "@/providers/CurrencyProvider"

export function AssetDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { format } = useCurrency()

  const { data: asset, isLoading: assetLoading } = useAsset(id)
  const { data: details, isLoading: detailsLoading, isError: detailsError } = useAssetDetails(id)
  const { data: news = [] } = useAssetNews(id)
  const animatedPrice = useAnimatedNumber(details?.price_usd ?? null)

  if (assetLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!asset) {
    return <p className="text-muted-foreground text-sm">Actif introuvable.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Retour au portefeuille
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <EntityAvatar
          src={asset.logo_url}
          label={asset.symbol}
          toneClassName={ASSET_TYPE_AVATAR_TONE[asset.type]}
          className="size-9 text-sm"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{asset.name}</h1>
            <Badge variant="secondary">{ASSET_TYPE_LABELS[asset.type]}</Badge>
          </div>
          <span className="text-muted-foreground text-sm">{asset.symbol}</span>
        </div>
      </div>

      {detailsLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : detailsError || !details ? (
        <Card>
          <CardContent className="text-muted-foreground text-sm">
            {asset.type === "gold"
              ? "Le cours de l'or provient d'une source non officielle et est momentanément indisponible."
              : "Les données de marché pour cet actif sont momentanément indisponibles."}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              className="stat-hero"
              label="Prix actuel"
              value={format(animatedPrice ?? details.price_usd)}
              secondaryValue={
                <div className="flex gap-3">
                  <span>1h <GainLossValue value={details.change_percent["1h"]} /></span>
                  <span>24h <GainLossValue value={details.change_percent["24h"]} /></span>
                  <span>7j <GainLossValue value={details.change_percent["7d"]} /></span>
                </div>
              }
            />
            {details.market_cap_usd !== null && (
              <StatTile label="Capitalisation" value={format(details.market_cap_usd)} />
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Historique 7 jours</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceHistoryChart points={details.history_7d} formatPrice={format} />
            </CardContent>
          </Card>

          {details.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">À propos</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed">
                {details.description}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Newspaper className="size-4" /> Actualités
          </CardTitle>
        </CardHeader>
        <CardContent>
          {news.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune actualité disponible pour cet actif pour le moment.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {news.map((item, index) => {
                const publishedAt = parseApiDate(item.published_at)
                const href = safeLinkUrl(item.url)
                return (
                  <li key={`${item.title}-${index}`}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                    <div className="text-muted-foreground text-xs">
                      {item.source}
                      {publishedAt && ` · ${publishedAt.toLocaleDateString("fr-FR")}`}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
