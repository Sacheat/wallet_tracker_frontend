// Shared by the footer and the two legal pages, so the address shown
// everywhere stays the same one.
export const CONTACT_EMAIL = "sacha.libion@outlook.com"

// Legal notice "Responsable de la publication". Left as a visible
// placeholder on purpose: it has to be the real person's name, not
// something guessed from a username - fill it in before deploying.
export const PUBLICATION_MANAGER = "[Prénom Nom]"

export const LEGAL_ROUTES = {
  notice: "/mentions-legales",
  privacy: "/confidentialite",
} as const
