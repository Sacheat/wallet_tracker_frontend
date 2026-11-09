export interface ChangelogEntry {
  date: string
  title: string
  description: string
}

// Written for the person using the app, not as dev notes - what changed
// and why it's useful to them. Newest first. Update this list by hand when
// something worth telling users about ships; not every commit belongs here.
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-11-09",
    title: "Une app pensée pour le mobile",
    description:
      "Sur téléphone, la navigation passe dans une barre d'onglets en bas de l'écran et le haut de page ne prend plus qu'une ligne. Tes positions s'affichent en cartes lisibles plutôt qu'en tableau à faire défiler.",
  },
  {
    date: "2026-11-09",
    title: "Journal d'achats et de ventes",
    description:
      "Chaque position garde maintenant l'historique de tes achats et ventes, avec prix, frais et date. Ta quantité se met à jour toute seule, et tu peux corriger ou supprimer une opération depuis « Achats et ventes ».",
  },
  {
    date: "2026-11-09",
    title: "Plus-values latentes et réalisées",
    description:
      "Vois combien tu as gagné ou perdu, position par position et au total, avec ton prix moyen d'achat. Les plus-values tiennent compte du taux de change du jour de chaque opération.",
  },
  {
    date: "2026-11-09",
    title: "Évolution de ton portefeuille",
    description:
      "Une courbe montre la valeur de ton portefeuille sur 7 jours, 30 jours, 90 jours ou 1 an, à côté du montant que tu as investi.",
  },
  {
    date: "2026-11-09",
    title: "Objectifs de répartition",
    description:
      "Fixe la part que tu veux pour chaque type d'actif. La page Répartition t'indique les écarts, ce qu'il faudrait acheter ou vendre pour rééquilibrer, et comment répartir une nouvelle somme à investir.",
  },
  {
    date: "2026-11-09",
    title: "Alerte d'écart de répartition",
    description:
      "Sois prévenu quand un type d'actif s'éloigne trop de ton objectif, du nombre de points que tu choisis.",
  },
  {
    date: "2026-09-28",
    title: "Récupère tes données",
    description:
      "Télécharge tout ce qui est lié à ton compte dans un fichier, depuis la page Compte. Les mentions légales et la politique de confidentialité sont accessibles en bas de chaque page.",
  },
  {
    date: "2026-09-27",
    title: "Logos du catalogue",
    description:
      "Ajoute un logo à un actif ou une plateforme en envoyant directement une image, plutôt qu'en collant une adresse web.",
  },
  {
    date: "2026-09-22",
    title: "Nouveau look",
    description:
      "Une identité visuelle plus affirmée dans toute l'app, avec quelques animations et effets soignés sur les chiffres clés.",
  },
  {
    date: "2026-09-22",
    title: "Tutoriel de bienvenue",
    description:
      "Un petit tour guidé propose de te montrer les fonctionnalités principales à la première connexion. Relançable à tout moment depuis ton compte.",
  },
  {
    date: "2026-09-22",
    title: "Créer une alerte en langage naturel",
    description:
      "Décris ton alerte avec tes mots (« préviens-moi si le bitcoin dépasse 100000 ») plutôt que de remplir un formulaire - un aperçu te confirme ce qui a été compris avant de créer quoi que ce soit.",
  },
  {
    date: "2026-09-22",
    title: "Devise d'affichage personnalisable",
    description:
      "Choisis la devise dans laquelle tous les montants de l'app s'affichent, depuis ton compte.",
  },
  {
    date: "2026-09-15",
    title: "Portefeuille enrichi",
    description:
      "Variation 24h et mini-graphique 7 jours par ligne, tri et recherche, regroupement par plateforme, export CSV.",
  },
  {
    date: "2026-09-14",
    title: "Alertes de prix et notifications",
    description:
      "Sois prévenu par email ou Discord quand un actif ou ton portefeuille franchit un seuil que tu définis.",
  },
]
