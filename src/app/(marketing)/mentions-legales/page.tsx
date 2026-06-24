import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales — LockIn",
  description: "Mentions légales du site et du service LockIn.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <p>
        Conformément aux dispositions des articles 6-III et 19 de la Loi n°
        2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
        numérique (LCEN).
      </p>

      <h2>Éditeur du site</h2>
      <p>
        <strong>LockIn</strong>
        <br />
        [Raison sociale / nom à compléter]
        <br />
        [Forme juridique — ex. SAS, EI]
        <br />
        [Adresse du siège social]
        <br />
        [Numéro SIREN / SIRET]
        <br />
        [Capital social — le cas échéant]
        <br />
        Directeur de la publication : [Nom à compléter]
        <br />
        Contact :{" "}
        <a href="mailto:contact@lockin.app" className="text-violet-300 hover:text-violet-200">
          contact@lockin.app
        </a>
      </p>

      <h2>Hébergement</h2>
      <p>
        Données applicatives et authentification hébergées via{" "}
        <strong>Supabase, Inc.</strong> — infrastructure cloud (localisation des
        serveurs selon la configuration du projet ; vérifier la région retenue
        dans le tableau de bord Supabase).
      </p>
      <p>
        Le site est déployé sur une infrastructure d&apos;hébergement web
        [Vercel ou équivalent — à compléter selon le déploiement effectif].
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le site LockIn (textes, graphismes,
        logo, structure, logiciels) est protégé par le droit de la propriété
        intellectuelle. Toute reproduction non autorisée est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Pour le traitement des données personnelles, consultez notre{" "}
        <a href="/confidentialite" className="text-violet-300 hover:text-violet-200">
          politique de confidentialité
        </a>
        . Pour les conditions d&apos;utilisation du Service, consultez les{" "}
        <a href="/cgu" className="text-violet-300 hover:text-violet-200">
          CGU
        </a>
        .
      </p>

      <h2>Signalement de contenu illicite</h2>
      <p>
        Pour signaler un contenu contraire à la loi :{" "}
        <a href="mailto:contact@lockin.app" className="text-violet-300 hover:text-violet-200">
          contact@lockin.app
        </a>
        , en précisant l&apos;URL concernée et les motifs du signalement.
      </p>
    </LegalPage>
  );
}
