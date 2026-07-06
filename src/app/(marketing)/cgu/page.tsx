import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { LOCKIN_CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — LockIn",
  description: "Conditions d'utilisation du service LockIn.",
};

export default function CguPage() {
  return (
    <LegalPage title="Conditions Générales d'Utilisation">
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent
        l&apos;accès et l&apos;utilisation du service <strong>LockIn</strong>,
        plateforme en ligne de suivi de factures et d&apos;assistance aux relances
        de paiement, accessible notamment sur{" "}
        <strong>lockin.app</strong> (ou tout domaine officiel qui lui succède).
      </p>

      <h2>1. Objet du Service</h2>
      <p>
        LockIn permet aux professionnels de :
      </p>
      <ul>
        <li>
          centraliser leurs factures en attente de paiement dans des tableaux
          personnalisables ;
        </li>
        <li>
          importer des données depuis des fichiers PDF ou CSV, ou les saisir
          manuellement ;
        </li>
        <li>
          configurer jusqu&apos;à sept (7) étapes de relance par tableau, avec
          des délais calculés par rapport à la date d&apos;échéance de chaque
          facture ;
        </li>
        <li>
          programmer et suivre des relances par e-mail adressées à leurs clients
          débiteurs ;
        </li>
        <li>
          accéder à des outils d&apos;assistance au recouvrement amiable (lettres
          types, dossier d&apos;injonction de payer, attestation technique des
          relances envoyées).
        </li>
      </ul>
      <p>
        Le Service ne constitue pas un cabinet d&apos;avocats, un office
        d&apos;huissier de justice ni un conseil juridique. Il ne garantit ni le
        paiement des créances ni l&apos;issue d&apos;une procédure.
      </p>

      <h2>2. Acceptation</h2>
      <p>
        En créant un compte ou en utilisant le Service, vous déclarez avoir pris
        connaissance des présentes CGU et de la{" "}
        <a href="/confidentialite" className="text-violet-300 hover:text-violet-200">
          politique de confidentialité
        </a>
        , et les accepter sans réserve. Si vous n&apos;acceptez pas ces
        conditions, vous ne devez pas utiliser le Service.
      </p>

      <h2>3. Compte utilisateur</h2>
      <ul>
        <li>
          Vous devez fournir des informations exactes lors de l&apos;inscription
          (prénom, nom de société, adresse e-mail) et maintenir la
          confidentialité de vos identifiants.
        </li>
        <li>
          Vous êtes responsable de toute activité réalisée depuis votre compte.
        </li>
        <li>
          Le Service est destiné aux personnes majeures agissant dans un cadre
          professionnel (B2B).
        </li>
      </ul>

      <h2>4. Mode démonstration</h2>
      <p>
        L&apos;accès « Voir démo » permet de tester l&apos;interface sans
        création de compte. <strong>Aucune donnée saisie en mode démo n&apos;est
        enregistrée</strong> sur nos serveurs : ni tableaux, ni relances, ni
        envois d&apos;e-mails. Chaque nouvelle session démo repart sur un
        tableau vierge. Certaines actions (modification du profil, persistance)
        sont désactivées en démo.
      </p>

      <h2>5. Import de fichiers et exactitude des données</h2>
      <ul>
        <li>
          Le Service accepte l&apos;import de factures au format PDF (jusqu&apos;à
          20 fichiers et 5 Mo par fichier) ou CSV (jusqu&apos;à 1 Mo).
        </li>
        <li>
          L&apos;extraction automatique des champs depuis un PDF ou un CSV est
          réalisée sur nos serveurs via un service d&apos;intelligence
          artificielle (Anthropic) ; le fichier source{" "}
          <strong>n&apos;est pas conservé</strong> après traitement. Seules les
          informations que vous validez ou corrigez sont enregistrées.
        </li>
        <li>
          Les résultats d&apos;extraction automatique sont indicatifs : vous
          devez vérifier nom, montant, dates, e-mail et toute autre information
          avant toute relance ou action de recouvrement.
        </li>
        <li>
          Vous êtes seul responsable de l&apos;exactitude des données relatives
          à vos clients et factures.
        </li>
      </ul>

      <h2>6. Données clients et base légale</h2>
      <ul>
        <li>
          Vous garantissez disposer d&apos;une base légale pour traiter les
          données personnelles de vos débiteurs (exécution du contrat, intérêt
          légitime, obligation légale, selon votre situation).
        </li>
        <li>
          Vous garantissez disposer du droit d&apos;adresser à vos clients les
          relances par e-mail que vous configurez dans LockIn, notamment en
          respectant leurs éventuelles demandes d&apos;opposition ou de
          limitation.
        </li>
        <li>
          LockIn n&apos;exerce aucun contrôle métier sur le fond de vos créances
          et ne vérifie pas la validité de vos factures ou de vos relances.
        </li>
      </ul>

      <h2>7. Relances automatiques par e-mail</h2>
      <p>
        Lorsque vous renseignez l&apos;adresse e-mail d&apos;un client et une
        date d&apos;échéance valide, le Service peut envoyer automatiquement des
        relances selon le calendrier et les modèles de message que{" "}
        <strong>vous</strong> configurez pour chaque tableau.
      </p>
      <ul>
        <li>
          Les envois sont orchestrés par un système automatisé connecté à
          l&apos;API LockIn (planification quotidienne, file d&apos;attente
          technique, acquittement des envois).
        </li>
        <li>
          Si plusieurs factures du même client sont dues le même jour, les
          relances peuvent être regroupées en un seul e-mail pour limiter le
          nombre de messages reçus.
        </li>
        <li>
          Vous pouvez modifier vos étapes de relance, supprimer une ligne ou
          marquer une facture comme payée à tout moment ; les relances encore en
          attente pour cette facture sont alors annulées.
        </li>
        <li>
          Un journal technique des envois (date prévue, statut, horodatage) est
          conservé pour le suivi du Service et la génération des attestations de
          relance.
        </li>
      </ul>
      <p>
        Vous restez seul responsable du contenu des messages, du ton employé et
        du respect des règles applicables (loyauté commerciale, réclamation,
        etc.).
      </p>

      <h2>8. Documents générés (recouvrement)</h2>
      <p>
        Le Service propose notamment :
      </p>
      <ul>
        <li>une lettre de mise en demeure ;</li>
        <li>un dossier type pour injonction de payer ;</li>
        <li>
          une attestation listant les relances envoyées par e-mail via LockIn
          (horodatage, étapes « Relance #1 », « Relance #2 », etc.).
        </li>
      </ul>
      <p>
        Ces documents sont des <strong>aides à la rédaction</strong> à adapter à
        votre situation et à faire valider par un professionnel du droit le cas
        échéant. LockIn décline toute responsabilité quant aux conséquences
        d&apos;une procédure engagée sur la base de ces modèles sans
        vérification préalable.
      </p>

      <h2>9. Limites d&apos;utilisation</h2>
      <p>
        Pendant la phase de lancement, le Service est soumis aux limites
        suivantes (susceptibles d&apos;évoluer) :
      </p>
      <ul>
        <li>3 tableaux maximum par compte ;</li>
        <li>50 lignes (factures) maximum par tableau ;</li>
        <li>200 lignes maximum au total sur l&apos;ensemble des tableaux.</li>
      </ul>
      <p>
        LockIn se réserve le droit de faire évoluer ces plafonds, notamment dans
        le cadre d&apos;offres payantes futures.
      </p>

      <h2>10. Propriété intellectuelle</h2>
      <p>
        Le Service, son interface, sa marque, ses contenus éditoriaux et ses
        modèles de documents restent la propriété de LockIn. Vous conservez la
        propriété des données que vous saisissez. Vous nous accordez une
        licence limitée d&apos;hébergement et de traitement de ces données aux
        seules fins d&apos;exécution du Service.
      </p>

      <h2>11. Disponibilité et évolution</h2>
      <p>
        Le Service est fourni « en l&apos;état ». Nous nous efforçons d&apos;assurer
        une disponibilité raisonnable mais ne garantissons pas une absence
        d&apos;interruption, notamment en phase de développement. Nous pouvons
        faire évoluer les fonctionnalités, avec ou sans préavis, dans le respect
        de la réglementation applicable.
      </p>

      <h2>12. Limitation de responsabilité</h2>
      <p>
        Dans les limites autorisées par la loi applicable, LockIn ne pourra être
        tenu responsable des dommages indirects (perte de chiffre d&apos;affaires,
        préjudice commercial, erreurs d&apos;import automatique non vérifiées par
        l&apos;utilisateur, etc.). Notre responsabilité totale, toutes causes
        confondues, est limitée au montant des sommes éventuellement versées par
        l&apos;utilisateur au cours des douze (12) derniers mois, ou à zéro euro
        tant que le Service est proposé gratuitement.
      </p>

      <h2>13. Résiliation</h2>
      <ul>
        <li>
          Vous pouvez cesser d&apos;utiliser le Service à tout moment et supprimer
          votre compte depuis votre profil (« Supprimer mon compte »), ou nous
          écrire à{" "}
          <a
            href={`mailto:${LOCKIN_CONTACT_EMAIL}`}
            className="text-violet-300 hover:text-violet-200"
          >
            {LOCKIN_CONTACT_EMAIL}
          </a>
          .
        </li>
        <li>
          Nous pouvons suspendre ou résilier un compte en cas de violation des
          présentes CGU, d&apos;usage frauduleux, d&apos;envoi abusif de relances
          ou de risque pour la sécurité du Service.
        </li>
        <li>
          La suppression du compte entraîne l&apos;effacement des données
          associées, sous réserve des obligations légales de conservation et des
          sauvegardes techniques à durée limitée.
        </li>
      </ul>

      <h2>14. Tarification</h2>
      <p>
        Le Service peut être proposé gratuitement pendant la phase de lancement.
        Toute facturation future fera l&apos;objet d&apos;informations claires
        avant tout engagement payant et, le cas échéant, de conditions
        particulières.
      </p>

      <h2>15. Droit applicable et litiges</h2>
      <p>
        Les présentes CGU sont soumises au <strong>droit français</strong>. En
        cas de litige, et après tentative de résolution amiable, compétence est
        attribuée aux tribunaux français conformément aux règles légales en
        vigueur (notamment pour les consommateurs ou les professionnels, selon le
        cas).
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions relatives aux CGU :{" "}
        <a
          href={`mailto:${LOCKIN_CONTACT_EMAIL}`}
          className="text-violet-300 hover:text-violet-200"
        >
          {LOCKIN_CONTACT_EMAIL}
        </a>
        .
      </p>
    </LegalPage>
  );
}
