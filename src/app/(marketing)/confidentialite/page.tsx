import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité — LockIn",
  description:
    "Comment LockIn traite vos données personnelles et celles de vos clients (RGPD).",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p>
        La présente politique décrit comment <strong>LockIn</strong> (« nous »,
        « le Service ») traite les données à caractère personnel dans le cadre de
        la plateforme de suivi et de relance de factures accessible sur lockin.app
        (ou tout domaine officiel qui lui succède).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est l&apos;éditeur du Service LockIn
        (informations d&apos;identification complètes à compléter dans les
        mentions légales). Pour toute question relative à vos données :{" "}
        <a href="mailto:contact@lockin.app" className="text-violet-300 hover:text-violet-200">
          contact@lockin.app
        </a>
        .
      </p>

      <h2>2. Principes généraux</h2>
      <ul>
        <li>
          Nous collectons uniquement les données nécessaires au fonctionnement du
          Service.
        </li>
        <li>
          Nous ne vendons pas vos données et ne les utilisons pas à des fins
          publicitaires tierces.
        </li>
        <li>
          Vous restez responsable des données que vous saisissez concernant vos
          propres clients (débiteurs).
        </li>
        <li>
          Le mode démonstration (« Voir démo ») n&apos;enregistre aucune donnée
          sur nos serveurs.
        </li>
      </ul>

      <h2>3. Données traitées</h2>

      <h3>3.1. Données de compte (utilisateur du Service)</h3>
      <ul>
        <li>Adresse e-mail, mot de passe (hashé par notre prestataire d&apos;authentification).</li>
        <li>Prénom, nom de société, pays — fournis à l&apos;inscription.</li>
        <li>Préférences d&apos;affichage (ex. format de date) stockées localement dans votre navigateur.</li>
      </ul>

      <h3>3.2. Données métier saisies par l&apos;utilisateur</h3>
      <p>
        Contenu des tableaux : noms, e-mails, montants, dates, références et tout
        champ personnalisé que vous ajoutez concernant vos clients et factures.
        Ces données sont hébergées pour vous permettre d&apos;utiliser le Service.
      </p>

      <h3>3.3. Données techniques</h3>
      <ul>
        <li>Cookies de session et d&apos;authentification (strictement nécessaires).</li>
        <li>
          Journaux techniques limités (sécurité, diagnostic d&apos;erreurs) sans
          profilage commercial.
        </li>
      </ul>

      <h3>3.4. Relances par e-mail (fonctionnalité prévue)</h3>
      <p>
        Lorsque la relance automatique sera activée, nous traiterons les adresses
        e-mail de vos débiteurs et le contenu des messages que vous configurez,
        uniquement pour l&apos;envoi des relances que vous avez programmées. Des
        journaux d&apos;envoi (date, statut, identifiant technique du message)
        pourront être conservés pour preuve de service et amélioration du
        support.
      </p>

      <h2>4. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Exécution du contrat</strong> : création de compte, stockage des
          tableaux, génération de documents d&apos;assistance au recouvrement.
        </li>
        <li>
          <strong>Intérêt légitime</strong> : sécurité du Service, prévention des
          abus, amélioration technique.
        </li>
        <li>
          <strong>Obligation légale</strong> : le cas échéant, réponse aux
          autorités compétentes.
        </li>
      </ul>
      <p>
        Pour les e-mails de relance adressés à vos clients, vous agissez en qualité
        de responsable de traitement vis-à-vis de vos débiteurs ; LockIn intervient
        en tant que sous-traitant pour l&apos;exécution technique de l&apos;envoi,
        dans le cadre de vos instructions (contenu et calendrier des relances).
      </p>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li>
          Données de compte et tableaux : conservées tant que votre compte est
          actif.
        </li>
        <li>
          Suppression du compte ou d&apos;un tableau : les données associées sont
          effacées de nos systèmes de production, sous réserve des sauvegardes
          techniques à durée limitée.
        </li>
        <li>
          Journaux d&apos;envoi de relances : durée limitée au besoin de preuve et
          de support (durée précise à affiner avec le juriste).
        </li>
        <li>Mode démo : aucune conservation côté serveur.</li>
      </ul>

      <h2>6. Destinataires et sous-traitants</h2>
      <p>Vos données peuvent être traitées par :</p>
      <ul>
        <li>
          <strong>Supabase</strong> — hébergement base de données et
          authentification (infrastructure cloud ; vérifier la localisation des
          données retenue contractuellement).
        </li>
        <li>
          <strong>Prestataire d&apos;e-mails</strong> (ex. Resend, Brevo ou
          équivalent) — envoi des relances, lorsque la fonctionnalité est activée.
        </li>
        <li>
          <strong>Outils d&apos;automatisation</strong> (ex. n8n) — orchestration
          technique des envois, sans revente des données.
        </li>
      </ul>
      <p>
        Ces prestataires sont choisis pour leurs garanties de sécurité et sont
        liés par des obligations contractuelles de confidentialité et, le cas
        échéant, des clauses types de l&apos;Union européenne.
      </p>

      <h2>7. Vos droits (RGPD)</h2>
      <p>
        Conformément au Règlement (UE) 2016/679, vous disposez des droits
        d&apos;accès, de rectification, d&apos;effacement, de limitation, de
        portabilité et d&apos;opposition, dans les limites prévues par la loi.
      </p>
      <ul>
        <li>
          <strong>Rectification</strong> : via les paramètres de votre profil et
          l&apos;édition de vos tableaux.
        </li>
        <li>
          <strong>Effacement</strong> : suppression de lignes ou de tableaux dans
          l&apos;interface ; suppression complète du compte sur demande à{" "}
          <a href="mailto:contact@lockin.app" className="text-violet-300 hover:text-violet-200">
            contact@lockin.app
          </a>{" "}
          (ou via une fonction dédiée lorsqu&apos;elle sera disponible).
        </li>
        <li>
          <strong>Réclamation</strong> : auprès de la CNIL (
          <a
            href="https://www.cnil.fr"
            className="text-violet-300 hover:text-violet-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.cnil.fr
          </a>
          ).
        </li>
      </ul>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles
        raisonnables : authentification sécurisée, accès restreint aux données,
        chiffrement en transit (HTTPS), cloisonnement des comptes utilisateurs.
      </p>

      <h2>9. Transferts hors Union européenne</h2>
      <p>
        Si un sous-traitant traite des données hors de l&apos;Espace économique
        européen, nous veillons à ce que des garanties appropriées soient en place
        (décision d&apos;adéquation, clauses contractuelles types, etc.).
      </p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut être mise à jour. La date en tête de page sera
        révisée en cas de changement substantiel. Nous vous informerons par tout
        moyen approprié si la loi l&apos;exige.
      </p>
    </LegalPage>
  );
}
