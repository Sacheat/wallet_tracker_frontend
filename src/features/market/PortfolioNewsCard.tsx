import { Newspaper } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortfolioEntries, usePortfolioNews } from "@/features/portfolio/hooks"
import { parseApiDate } from "@/lib/parse-date"
import { cn } from "@/lib/utils"

export function PortfolioNewsCard() {
  const { data: news = [], isLoading } = usePortfolioNews()
  const { data: entries = [] } = usePortfolioEntries()
  const [filter, setFilter] = useState<string | null>(null)

  const assetIdBySymbol = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of entries) map.set(entry.asset.symbol, entry.asset.id)
    return map
  }, [entries])

  const symbols = useMemo(
    () => [...new Set(news.map((item) => item.asset_symbol).filter(Boolean))] as string[],
    [news],
  )

  const filteredNews = filter ? news.filter((item) => item.asset_symbol === filter) : news

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Newspaper className="size-4" /> Actualités de ton portefeuille
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {symbols.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={filter === null ? "secondary" : "ghost"}
              onClick={() => setFilter(null)}
            >
              Tout
            </Button>
            {symbols.map((symbol) => (
              <Button
                key={symbol}
                size="sm"
                variant={filter === symbol ? "secondary" : "ghost"}
                onClick={() => setFilter(symbol)}
              >
                {symbol}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune actualité pour le moment — seuls les actifs crypto détenus
            en ont, et l'historique se construit avec le temps.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {filteredNews.map((item, index) => {
              const publishedAt = parseApiDate(item.published_at)
              const hasLink = item.url.startsWith("http")
              const assetId = item.asset_symbol
                ? assetIdBySymbol.get(item.asset_symbol)
                : undefined
              return (
                <li key={`${item.title}-${index}`} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {hasLink ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
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
                  </div>
                  {item.asset_symbol && (
                    <Badge
                      variant="secondary"
                      className={cn(assetId && "cursor-pointer")}
                      render={assetId ? <Link to={`/assets/${assetId}`} /> : undefined}
                    >
                      {item.asset_symbol}
                    </Badge>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
