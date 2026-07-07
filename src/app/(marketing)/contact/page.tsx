import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { LOCKIN_CONTACT_EMAIL } from "@/lib/contact";
import { RELANCE_EMAIL_SERVICE_LINE } from "@/lib/dashboard/relance-email-body";

export const metadata: Metadata = {
  title: "Contact — LockIn",
  description: "Contacter l'équipe LockIn.",
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <p>
        <strong>{RELANCE_EMAIL_SERVICE_LINE}</strong>
      </p>
      <p>
        Vous avez reçu une relance par e-mail et souhaitez nous écrire, ou vous
        êtes utilisateur du service : contactez-nous à l&apos;adresse ci-dessous.
      </p>
      <p>
        <a
          href={`mailto:${LOCKIN_CONTACT_EMAIL}`}
          className="font-medium text-white underline-offset-2 hover:underline"
        >
          {LOCKIN_CONTACT_EMAIL}
        </a>
      </p>
      <p className="text-brand-muted">
        Nous répondons dans les meilleurs délais. Pour une question liée à une
        facture précise, merci d&apos;indiquer la référence et le nom de
        l&apos;entreprise émettrice.
      </p>
    </LegalPage>
  );
}
