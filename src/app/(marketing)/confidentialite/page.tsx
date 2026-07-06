import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { LOCKIN_CONTACT_EMAIL } from "@/lib/contact";

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
        la plateforme de suivi et de relance de factures accessible sur{" "}
        <strong>lockin.app</strong> (ou tout domaine officiel qui lui succède).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est <strong>Jonathan Seroussi</strong>,
        92500 Rueil-Malmaison, France — SIREN en cours d&apos;attribution,
        éditeur du service LockIn (voir les{" "}
        <a href="/mentions-legales" className="text-violet-300 hover:text-violet-200">
          mentions légales
        </a>
        ). Pour toute question relative à vos données personnelles :{" "}
        <a
          href={`mailto:${LOCKIN_CONTACT_EMAIL}`}
          className="text-violet-300 hover:text-violet-200"
        >
          {LOCKIN_CONTACT_EMAIL}
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
          Vous restez responsable, en tant qu&apos;utilisateur professionnel, des
          données que vous saisissez concernant vos propres clients (débiteurs) et
          de votre conformité au RGPD vis-à-vis de ces personnes.
        </li>
        <li>
          Le mode démonstration (« Voir démo ») n&apos;enregistre aucune donnée
          sur nos serveurs.
        </li>
      </ul>

      <h2>3. Données traitées</h2>

      <h3>3.1. Données de compte (utilisateur du Service)</h3>
      <ul>
        <li>
          Adresse e-mail, mot de passe (stocké sous forme chiffrée par notre
          prestataire d&apos;authentification).
        </li>
        <li>Prénom, nom de société — fournis à l&apos;inscription ou dans le profil.</li>
        <li>
          Préférences d&apos;affichage (ex. format de date) : stockées
          localement dans votre navigateur (<code>localStorage</code>), non
          synchronisées entre appareils.
        </li>
      </ul>

      <h3>3.2. Données métier saisies par l&apos;utilisateur</h3>
      <p>
        Contenu des tableaux : noms, adresses e-mail, montants, dates
        d&apos;échéance, références, statut de paiement et tout champ
        personnalisé que vous ajoutez concernant vos clients et factures. Ces
        données sont hébergées pour vous permettre d&apos;utiliser le Service.
      </p>
      <p>
        <strong>Import PDF :</strong> lorsque vous importez une facture PDF, le
        fichier est transmis de façon sécurisée (HTTPS) à nos serveurs pour une
        extraction automatique des champs par intelligence artificielle. Le
        fichier PDF n&apos;est pas conservé sur nos serveurs après traitement.
        Seules les valeurs que vous validez dans l&apos;interface sont
        enregistrées.
      </p>
      <p>
        <strong>Import CSV :</strong> lorsque vous importez un fichier CSV, son
        contenu est transmis de façon sécurisée à nos serveurs pour une
        extraction et structuration par intelligence artificielle. Le fichier
        n&apos;est pas conservé sur nos serveurs après traitement ; seules les
        lignes que vous validez sont enregistrées.
      </p>

      <h3>3.3. Configuration des relances</h3>
      <p>
        Pour chaque tableau : étapes de relance (délai par rapport à
        l&apos;échéance, modèle de message), ordre des étapes et paramètres
        associés.
      </p>

      <h3>3.4. Journal des relances par e-mail</h3>
      <p>
        Lorsque la relance automatique est active, nous enregistrons pour chaque
        envoi programmé ou effectué :
      </p>
      <ul>
        <li>identifiants techniques (ligne, étape, tableau) ;</li>
        <li>date prévue d&apos;envoi ;</li>
        <li>
          statut (en attente, en file, envoyé, échec, annulé — notamment si la
          facture est marquée comme payée) ;
        </li>
        <li>
          le cas échéant : date d&apos;envoi, identifiant du message chez le
          prestataire d&apos;e-mails, message d&apos;erreur.
        </li>
      </ul>
      <p>
        Ces données servent au suivi du Service, à l&apos;anti-doublon, à
        l&apos;annulation automatique des relances obsolètes et à la génération
        des attestations de relance.
      </p>

      <h3>3.5. Contact avec LockIn</h3>
      <p>
        Le formulaire de contact ouvre votre client de messagerie (
        <code>mailto</code>) : votre message est envoyé depuis votre propre boîte
        e-mail. LockIn ne reçoit et ne stocke pas le contenu de ce message sur
        ses serveurs, sauf si vous nous l&apos;adressez directement par e-mail.
      </p>

      <h3>3.6. Données techniques</h3>
      <ul>
        <li>Cookies de session et d&apos;authentification (strictement nécessaires).</li>
        <li>
          Cookie d&apos;impersonation administrateur (usage interne restreint,
          uniquement pour le support technique autorisé).
        </li>
        <li>
          Journaux techniques limités côté hébergeur (sécurité, diagnostic
          d&apos;erreurs, performances) sans profilage commercial.
        </li>
      </ul>

      <h2>4. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Exécution du contrat</strong> : création de compte, stockage des
          tableaux, planification et envoi des relances, génération des documents
          d&apos;assistance au recouvrement.
        </li>
        <li>
          <strong>Intérêt légitime</strong> : sécurité du Service, prévention des
          abus et des envois massifs non autorisés, amélioration technique,
          preuve des relances effectuées.
        </li>
        <li>
          <strong>Obligation légale</strong> : le cas échéant, réponse aux
          autorités compétentes.
        </li>
      </ul>
      <p>
        <strong>Rôle des parties pour les e-mails de relance :</strong> vis-à-vis
        des coordonnées de vos clients débiteurs, vous agissez en principe en
        qualité de <strong>responsable de traitement</strong> ; LockIn intervient
        en tant que <strong>sous-traitant</strong> pour l&apos;exécution
        technique de l&apos;envoi, conformément à vos instructions (contenu des
        messages, calendrier, destinataires issus de vos tableaux). Un accord de
        sous-traitance (DPA) pourra être mis à disposition sur demande pour les
        clients professionnels qui en ont besoin.
      </p>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li>
          Données de compte et tableaux : conservées tant que votre compte est
          actif.
        </li>
        <li>
          Suppression d&apos;une ligne, d&apos;un tableau ou du compte : les
          données associées sont effacées de nos systèmes de production, sous
          réserve des sauvegardes techniques à durée limitée (généralement
          quelques semaines).
        </li>
        <li>
          Journal des relances : conservé tant que le compte et les lignes
          associées existent, puis supprimé avec elles ; durée maximale
          recommandée de trente-six (36) mois pour les envois déjà effectués si
          une conservation plus longue n&apos;est pas requise par la loi.
        </li>
        <li>Mode démo : aucune conservation côté serveur.</li>
        <li>Préférences navigateur : jusqu&apos;à suppression par l&apos;utilisateur.</li>
      </ul>

      <h2>6. Destinataires et sous-traitants</h2>
      <p>Vos données peuvent être traitées par les prestataires suivants :</p>
      <ul>
        <li>
          <strong>Supabase, Inc.</strong> — hébergement de la base de données et
          authentification (région du projet à configurer, de préférence au sein
          de l&apos;Union européenne).
        </li>
        <li>
          <strong>Netlify, Inc.</strong> — hébergement et exécution de
          l&apos;application web (infrastructure cloud).
        </li>
        <li>
          <strong>Anthropic, PBC</strong> — extraction automatique des champs
          lors de l&apos;import de factures PDF ou CSV (traitement IA
          transitoire, sans conservation du fichier source).
        </li>
        <li>
          <strong>Prestataire d&apos;e-mails</strong> (SMTP ou service
          transactionnel type Resend, Brevo, etc.) — envoi des relances
          automatiques.
        </li>
        <li>
          <strong>Outil d&apos;automatisation</strong> (ex. n8n) — orchestration
          technique des envois (appel API, déclenchement, acquittement), sans
          revente des données.
        </li>
      </ul>
      <p>
        Ces prestataires sont choisis pour leurs garanties de sécurité et sont
        liés par des obligations contractuelles de confidentialité et, le cas
        échéant, des clauses contractuelles types de l&apos;Union européenne.
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
          l&apos;interface, ou suppression complète du compte via le bouton
          « Supprimer mon compte » dans votre profil (action définitive).
        </li>
        <li>
          <strong>Portabilité</strong> : export de vos données au format CSV via
          le bouton « Exporter mes données » dans votre profil.
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
      <p>
        Si vous êtes le client final d&apos;un utilisateur LockIn (débiteur
        relancé par e-mail), adressez vos demandes d&apos;exercice de droits à
        l&apos;entreprise qui vous a facturé ; LockIn pourra vous orienter si
        nécessaire.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles
        raisonnables : authentification sécurisée, accès restreint aux données
        (politiques RLS en base de données), chiffrement en transit (HTTPS),
        cloisonnement des comptes utilisateurs, secret d&apos;API pour les
        opérations automatisées (relances).
      </p>

      <h2>9. Transferts hors Union européenne</h2>
      <p>
        Certains sous-traitants (notamment Netlify, Anthropic ou Supabase selon
        la région configurée) peuvent traiter des données hors de l&apos;Espace économique
        européen. Dans ce cas, nous veillons à ce que des garanties appropriées
        soient en place (décision d&apos;adéquation, clauses contractuelles
        types, etc.).
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
