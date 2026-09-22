import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CHANGELOG_ENTRIES } from "@/features/changelog/entries"

export function WhatsNewDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quoi de neuf</DialogTitle>
        </DialogHeader>
        <ul className="flex max-h-96 flex-col gap-4 overflow-y-auto">
          {CHANGELOG_ENTRIES.map((entry) => (
            <li key={`${entry.date}-${entry.title}`} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{entry.title}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(entry.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{entry.description}</p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
