import { Mail, Sparkles } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { WhatsNewDialog } from "@/features/changelog/WhatsNewDialog"
import { CONTACT_EMAIL, LEGAL_ROUTES } from "@/features/legal/constants"

export function Footer() {
  const [changelogOpen, setChangelogOpen] = useState(false)

  return (
    <footer className="border-border/60 mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs sm:px-6">
        <span>Portfolio Tracker — projet étudiant</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link to={LEGAL_ROUTES.notice} className="hover:text-foreground">
            Mentions légales
          </Link>
          <Link to={LEGAL_ROUTES.privacy} className="hover:text-foreground">
            Confidentialité
          </Link>
          <button
            type="button"
            onClick={() => setChangelogOpen(true)}
            className="hover:text-foreground inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" /> Quoi de neuf
          </button>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Portfolio Tracker - contact")}`}
            className="hover:text-foreground inline-flex items-center gap-1.5"
          >
            <Mail className="size-3.5" /> Nous contacter
          </a>
        </div>
      </div>
      <WhatsNewDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
    </footer>
  )
}
