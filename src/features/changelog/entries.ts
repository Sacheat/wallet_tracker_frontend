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
