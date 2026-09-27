import { CONTACT_EMAIL, PUBLICATION_MANAGER } from "@/features/legal/constants"
import { LegalLayout, LegalSection } from "@/features/legal/LegalLayout"

export function LegalNoticePage() {
  return (
    <LegalLayout title="Mentions légales">
      <LegalSection title="Éditeur du site">
        <p>
          Ce site est un projet personnel réalisé dans le cadre d'un exercice scolaire,
          sans activité commerciale.
        </p>
        <dl className="grid gap-1">
          <div>
            <dt className="inline font-medium">Responsable de la publication : </dt>
            <dd className="inline">{PUBLICATION_MANAGER}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Contact : </dt>
            <dd className="inline">
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection title="Hébergement">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <span className="font-medium">Serveur d'application et base de données :</span>{" "}
            ALWAYSDATA, SARL au capital de 200 000 €, RCS Paris 492 893 490, 91 rue du
            Faubourg Saint Honoré, 75008 Paris, France.
          </li>
          <li>
            <span className="font-medium">Site web (interface) :</span> Vercel Inc., 440 N
            Barranca Avenue #4133, Covina, CA 91723, États-Unis.
          </li>
        </ul>
      </LegalSection>
    </LegalLayout>
  )
}
