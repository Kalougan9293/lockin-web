import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { LOCKIN_CONTACT_EMAIL } from "@/lib/contact";

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
        numérique (LCEN), les informations suivantes sont portées à la
        connaissance des utilisateurs du site et du service <strong>LockIn</strong>.
      </p>

      <h2>Éditeur du site et du Service</h2>
      <p>
        <strong>LockIn</strong> — plateforme de suivi de factures et de relances
        de paiement à destination des professionnels.
        <br />
        <br />
        <strong>Jonathan Seroussi</strong>
        <br />
        92500 Rueil-Malmaison, France
        <br />
        SIREN : en cours d&apos;attribution
        <br />
        Directeur de la publication : Jonathan Seroussi
        <br />
        Contact :{" "}
        <a
          href={`mailto:${LOCKIN_CONTACT_EMAIL}`}
          className="text-violet-300 hover:text-violet-200"
        >
          {LOCKIN_CONTACT_EMAIL}
        </a>
      </p>

      <h2>Nature du Service</h2>
      <p>
        LockIn est un service en ligne (SaaS) permettant aux professionnels de
        gérer des tableaux de factures en attente de paiement, d&apos;importer
        des données (PDF, CSV), de configurer des relances par e-mail et
        d&apos;accéder à des documents d&apos;assistance au recouvrement
        amiable. Le Service est accessible notamment à l&apos;adresse{" "}
        <strong>lockin.app</strong>.
      </p>
      <p>
        LockIn n&apos;est ni un cabinet d&apos;avocats ni un office
        d&apos;huissier. Les documents générés sont des modèles à adapter ; ils
        ne constituent pas un conseil juridique.
      </p>

      <h2>Hébergement</h2>
      <p>
        <strong>Application web</strong> — hébergée par{" "}
        <strong>Netlify, Inc.</strong>
        <br />
        101 2nd Street, San Francisco, CA 94105, États-Unis
        <br />
        <a
          href="https://www.netlify.com"
          className="text-violet-300 hover:text-violet-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          netlify.com
        </a>
      </p>
      <p>
        <strong>Données applicatives</strong> (comptes, tableaux, journal des
        relances) et <strong>authentification</strong> — hébergées via{" "}
        <strong>Supabase, Inc.</strong>
        <br />
        Infrastructure cloud — région du projet à vérifier dans le tableau de
        bord Supabase (région UE recommandée pour les données européennes).
        <br />
        <a
          href="https://supabase.com"
          className="text-violet-300 hover:text-violet-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          supabase.com
        </a>
      </p>
      <p>
        <strong>Envoi des relances par e-mail</strong> — orchestré par un outil
        d&apos;automatisation (ex. n8n) et un prestataire de messagerie
        transactionnelle (SMTP ou API), configurés par l&apos;éditeur du
        Service.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le site et le Service LockIn
        (textes, graphismes, logo, structure, logiciels, modèles de documents)
        est protégé par le droit de la propriété intellectuelle. Toute
        reproduction, représentation ou exploitation non autorisée est interdite.
      </p>
      <p>
        Les données et contenus que vous saisissez dans le Service restent votre
        propriété ; LockIn n&apos;en revendique pas la titularité.
      </p>

      <h2>Données personnelles et conditions d&apos;utilisation</h2>
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
        Conformément à l&apos;article 6-I-5 de la LCEN, pour signaler un contenu
        illicite hébergé via le Service :{" "}
        <a
          href={`mailto:${LOCKIN_CONTACT_EMAIL}`}
          className="text-violet-300 hover:text-violet-200"
        >
          {LOCKIN_CONTACT_EMAIL}
        </a>
        , en précisant la date du constat, l&apos;URL ou l&apos;élément concerné,
        vos coordonnées et les motifs du signalement.
      </p>

      <h2>Crédits</h2>
      <p>
        Interface et développement : LockIn. Extraction automatique des factures
        (PDF, CSV) : service d&apos;intelligence artificielle{" "}
        <strong>Anthropic</strong> (voir la{" "}
        <a href="/confidentialite" className="text-violet-300 hover:text-violet-200">
          politique de confidentialité
        </a>
        ).
      </p>
    </LegalPage>
  );
}
