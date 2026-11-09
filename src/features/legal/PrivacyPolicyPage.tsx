import { Link } from "react-router-dom"
import { CONTACT_EMAIL, LEGAL_ROUTES } from "@/features/legal/constants"
import { LegalLayout, LegalSection, LegalTable } from "@/features/legal/LegalLayout"

function Mail() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
      {CONTACT_EMAIL}
    </a>
  )
}

const code = "bg-muted rounded px-1 py-0.5 font-mono text-xs"

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="28 septembre 2026">
      <LegalSection title="Qui est responsable de vos données ?">
        <p>
          Sacheat, éditeur de ce site (voir les{" "}
          <Link to={LEGAL_ROUTES.notice} className="underline underline-offset-4">
            mentions légales
          </Link>
          ). Pour toute question ou demande concernant vos données : <Mail />.
        </p>
      </LegalSection>

      <LegalSection title="Quelles données sont collectées, et pourquoi ?">
        <LegalTable
          headers={["Données", "Utilisation", "Base légale"]}
          rows={[
            [
              "Nom, adresse email, mot de passe (stocké uniquement sous forme chiffrée irréversible), photo de profil si vous en ajoutez une, devise d'affichage",
              "Créer et gérer votre compte, vous identifier",
              "Exécution du service que vous demandez",
            ],
            [
              "Positions de votre portefeuille (actif, plateforme, quantité) et alertes de prix",
              "Calculer la valeur de votre portefeuille, déclencher vos alertes",
              "Exécution du service",
            ],
            [
              "Préférences de notification et, si vous le renseignez, l'adresse d'un webhook Discord",
              "Vous envoyer alertes et résumés par le canal choisi",
              "Exécution du service",
            ],
            [
              "Historique de vos actions (création, modification, suppression d'éléments)",
              "Vous permettre de consulter votre historique, assurer la sécurité et la modération du catalogue partagé",
              "Exécution du service et intérêt légitime (sécurité)",
            ],
            [
              "Adresse IP et navigateur, enregistrés avec votre session de connexion ; journaux techniques d'erreurs",
              "Sécuriser l'accès (limitation des tentatives de connexion, détection d'abus) et corriger les problèmes",
              "Intérêt légitime (sécurité du service)",
            ],
            [
              "Texte saisi dans la création d'alerte en langage naturel",
              "Transformer votre demande en alerte",
              "Exécution du service",
            ],
          ]}
        />
        <p>
          Aucune donnée bancaire n'est collectée. Le site ne sert pas à acheter ou vendre
          des actifs.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site n'utilise que des cookies indispensables à son fonctionnement, exemptés
          de consentement par la CNIL. Aucun cookie publicitaire ni de mesure d'audience.
        </p>
        <LegalTable
          headers={["Cookie", "Rôle", "Durée"]}
          rows={[
            [
              <code key="cookie" className={code}>laravel-session</code>,
              "Maintenir votre connexion",
              "Supprimé après 2 heures d'inactivité ou à la déconnexion",
            ],
            [
              <code key="cookie" className={code}>XSRF-TOKEN</code>,
              "Protéger vos actions contre les requêtes frauduleuses (CSRF)",
              "2 heures",
            ],
            [
              <code key="cookie" className={code}>remember_web_…</code>,
              "Rester connecté, uniquement si vous cochez « Se souvenir de moi »",
              "13 mois",
            ],
          ]}
        />
      </LegalSection>

      <LegalSection title="Qui reçoit vos données ?">
        <p>
          Vos données ne sont ni vendues ni cédées. Elles sont transmises uniquement aux
          prestataires nécessaires au service :
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <span className="font-medium">[Hébergeur]</span> ([pays]) : hébergement
            de l'interface, du serveur et de la base de données, sur un serveur
            virtuel mis à disposition par [nom de l'école].
          </li>
          <li>
            <span className="font-medium">Brevo</span> (Sendinblue SAS, France) :
            envoi des emails (vérification, mot de passe oublié, alertes, résumés).
            Il reçoit votre adresse email et le contenu de ces emails.
          </li>
          <li>
            <span className="font-medium">Google, service Gemini</span> (États-Unis) :
            <ul className="mt-2 flex list-[circle] flex-col gap-1 pl-5">
              <li>
                pour le résumé quotidien ou hebdomadaire, si vous l'activez : la
                composition et la valeur de votre portefeuille, sans votre nom ni votre
                email ;
              </li>
              <li>pour la création d'alerte en langage naturel : le texte que vous saisissez.</li>
            </ul>
            <p className="mt-2">
              D'après les conditions de Google applicables depuis l'Espace économique
              européen, ces données ne sont pas utilisées pour améliorer ses produits.
            </p>
          </li>
          <li>
            <span className="font-medium">Discord</span> (États-Unis), uniquement si vous
            renseignez un webhook : le contenu de vos alertes et résumés.
          </li>
        </ul>
        <p>
          Les services de données de marché (CoinGecko, Yahoo Finance, CryptoCompare,
          Marketaux, Alternative.me, Frankfurter) ne reçoivent aucune donnée personnelle,
          seulement des identifiants d'actifs comme « bitcoin » ou « AAPL ».
        </p>
        <p>
          Certains prestataires sont situés aux États-Unis : vos données peuvent donc y
          être transférées, dans le cadre des garanties proposées par chacun d'eux dans ses
          propres conditions.
        </p>
      </LegalSection>

      <LegalSection title="Combien de temps sont-elles conservées ?">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Compte, portefeuille, alertes, préférences et photo de profil : jusqu'à la
            suppression de votre compte, puis supprimés immédiatement.
          </li>
          <li>
            Historique des actions : conservé après la suppression du compte, mais détaché
            de celui-ci. Il n'est alors plus rattaché à aucun utilisateur.
          </li>
          <li>
            Session de connexion (IP et navigateur compris) : le temps de la session, 2
            heures d'inactivité au maximum.
          </li>
          <li>Lien de réinitialisation de mot de passe : 60 minutes.</li>
          <li>Journaux techniques d'erreurs : 14 jours.</li>
          <li>Envois d'emails en échec : 7 jours.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>Vous pouvez à tout moment :</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <span className="font-medium">accéder à vos données et les récupérer</span> :
            bouton « Télécharger mes données » dans votre compte (fichier JSON) ;
          </li>
          <li>
            <span className="font-medium">les corriger</span> : depuis votre profil ;
          </li>
          <li>
            <span className="font-medium">les supprimer</span> : bouton de suppression du
            compte, effet immédiat ;
          </li>
          <li>
            <span className="font-medium">
              vous opposer à certains traitements ou les limiter
            </span>{" "}
            : désactivez les emails, les résumés ou le webhook Discord dans vos paramètres
            de notification.
          </li>
        </ul>
        <p>
          Pour toute autre demande : <Mail />. Vous pouvez aussi adresser une réclamation
          à la CNIL (
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            www.cnil.fr
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges sont chiffrés (HTTPS), les mots de passe sont stockés sous forme
          chiffrée irréversible, et l'accès à vos données est réservé à votre compte.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
