import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatTile({
  label,
  value,
  secondaryValue,
  icon,
  className,
}: {
  label: string
  value: ReactNode
  secondaryValue?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {secondaryValue && (
            <span className="text-muted-foreground text-sm">{secondaryValue}</span>
          )}
        </div>
        {icon && (
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
