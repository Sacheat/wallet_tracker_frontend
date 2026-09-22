export interface TourStep {
  // Route to navigate to before showing this step. Omitted = stays on
  // whatever page the previous step left off on (used for the welcome/end
  // steps, which have no target element either).
  route?: string
  // CSS selector for the element to spotlight. Omitted = a centered
  // popover with no cutout (welcome/end steps).
  target?: string
  title: string
  description: string
}

// Elements referenced by `target` carry a matching `data-tour="..."`
// attribute in their component - see AddPositionDialog, AllocationBar,
// CreateAlertDialog, CatalogPage, CurrencySection.
export const TOUR_STEPS: TourStep[] = [
  {
    title: "Bienvenue sur Portfolio Tracker 👋",
    description:
      "Petit tour des fonctionnalités principales, trente secondes montre en main. Tu peux le quitter à tout moment.",
  },
  {
    route: "/",
    target: '[data-tour="add-position"]',
    title: "Ajoute tes positions",
    description:
      "Commence par ajouter les actifs que tu possèdes - crypto, actions, or ou ETF - avec la plateforme sur laquelle ils se trouvent.",
  },
  {
    route: "/market",
    target: '[data-tour="market-allocation"]',
    title: "Vue d'ensemble du marché",
    description:
      "Répartition de ton portefeuille par type d'actif, actualités et indice de sentiment du marché.",
  },
  {
    route: "/alerts",
    target: '[data-tour="create-alert"]',
    title: "Crée des alertes",
    description:
      "Décris ton alerte en langage naturel (« préviens-moi si le bitcoin dépasse 100000 ») et confirme l'aperçu généré - ou utilise le formulaire manuel si tu préfères.",
  },
  {
    route: "/catalog",
    target: '[data-tour="catalog-tabs"]',
    title: "Catalogue partagé",
    description:
      "Gère les actifs et plateformes disponibles pour tout le monde - utile si celui que tu cherches n'existe pas encore.",
  },
  {
    route: "/account",
    target: '[data-tour="currency-selector"]',
    title: "Choisis ta devise",
    description: "Tous les montants de l'app s'affichent dans la devise que tu choisis ici.",
  },
  {
    title: "C'est tout !",
    description: "Tu peux relancer ce tutoriel à tout moment depuis ton compte.",
  },
]
