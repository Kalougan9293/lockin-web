import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

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
        de paiement.
      </p>

      <h2>1. Objet</h2>
      <p>
        LockIn permet aux professionnels de centraliser leurs factures en
        attente de paiement, de configurer des étapes de relance, et d&apos;accéder
        à des outils d&apos;assistance (documents types, attestations techniques)
        en vue de faciliter le recouvrement amiable. Le Service ne constitue pas
        un cabinet d&apos;avocats, un huissier de justice ou un conseil juridique.
      </p>

      <h2>2. Acceptation</h2>
      <p>
        En créant un compte ou en utilisant le Service, vous acceptez les présentes
        CGU et la{" "}
        <a href="/confidentialite" className="text-violet-300 hover:text-violet-200">
          politique de confidentialité
        </a>
        . Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser
        le Service.
      </p>

      <h2>3. Compte utilisateur</h2>
      <ul>
        <li>
          Vous devez fournir des informations exactes lors de l&apos;inscription
          et maintenir la confidentialité de vos identifiants.
        </li>
        <li>
          Vous êtes responsable de toute activité réalisée depuis votre compte.
        </li>
        <li>
          Le Service est destiné aux personnes majeures agissant dans un cadre
          professionnel.
        </li>
      </ul>

      <h2>4. Mode démonstration</h2>
      <p>
        L&apos;accès « Voir démo » permet de tester l&apos;interface sans création
        de compte. <strong>Aucune donnée saisie en mode démo n&apos;est
        enregistrée</strong> sur nos serveurs. Chaque nouvelle session démo
        repart sur un tableau vierge.
      </p>

      <h2>5. Données saisies et responsabilité</h2>
      <ul>
        <li>
          Vous êtes seul responsable de l&apos;exactitude des informations
          relatives à vos clients et factures (montants, échéances, coordonnées).
        </li>
        <li>
          Vous garantissez disposer d&apos;une base légale pour traiter les
          données personnelles de vos débiteurs et, le cas échéant, pour leur
          adresser des relances par e-mail.
        </li>
        <li>
          LockIn n&apos;exerce aucun contrôle métier sur le fond de vos créances
          et ne garantit pas le paiement des factures.
        </li>
      </ul>

      <h2>6. Relances automatiques</h2>
      <p>
        Lorsque la fonctionnalité de relance par e-mail sera disponible, les
        envois seront effectués selon le calendrier et les modèles que{" "}
        <strong>vous</strong> configurez. Vous pouvez à tout moment modifier,
        suspendre ou arrêter vos relances en ajustant vos tableaux ou en marquant
        une facture comme payée. Les journaux techniques d&apos;envoi pourront
        être conservés conformément à la politique de confidentialité.
      </p>

      <h2>7. Documents générés (recouvrement)</h2>
      <p>
        Les modèles fournis (mise en demeure, dossier d&apos;injonction de payer,
        attestations de relance) sont des <strong>aides à la rédaction</strong> à
        adapter à votre situation. Ils ne remplacent pas l&apos;avis d&apos;un
        professionnel du droit. LockIn décline toute responsabilité quant aux
        conséquences d&apos;une procédure engagée sur la base de ces documents
        sans vérification préalable.
      </p>

      <h2>8. Propriété intellectuelle</h2>
      <p>
        Le Service, son interface, sa marque et ses contenus éditoriaux restent
        la propriété de LockIn. Vous conservez la propriété des données que vous
        saisissez. Vous nous accordez une licence limitée d&apos;hébergement et de
        traitement de ces données aux seules fins d&apos;exécution du Service.
      </p>

      <h2>9. Disponibilité et évolution</h2>
      <p>
        Le Service est fourni « en l&apos;état ». Nous nous efforçons d&apos;assurer
        une disponibilité raisonnable mais ne garantissons pas une absence
        d&apos;interruption. Nous pouvons faire évoluer les fonctionnalités, avec
        ou sans préavis, notamment en phase de développement.
      </p>

      <h2>10. Limitation de responsabilité</h2>
      <p>
        Dans les limites autorisées par la loi applicable, LockIn ne pourra être
        tenu responsable des dommages indirects (perte de chiffre d&apos;affaires,
        perte de données due à une mauvaise utilisation, etc.). Notre
        responsabilité totale, toutes causes confondues, est limitée au montant
        des sommes éventuellement versées par l&apos;utilisateur au cours des
        douze (12) derniers mois, ou à zéro euro tant que le Service est proposé
        gratuitement.
      </p>

      <h2>11. Résiliation</h2>
      <ul>
        <li>
          Vous pouvez cesser d&apos;utiliser le Service à tout moment et demander
          la suppression de votre compte.
        </li>
        <li>
          Nous pouvons suspendre ou résilier un compte en cas de violation des
          présentes CGU, d&apos;usage frauduleux ou de risque pour la sécurité du
          Service.
        </li>
        <li>
          La suppression du compte entraîne l&apos;effacement des données
          associées, sous réserve des obligations légales de conservation et des
          sauvegardes techniques à durée limitée.
        </li>
      </ul>

      <h2>12. Tarification</h2>
      <p>
        Le Service peut être proposé gratuitement pendant la phase de lancement.
        Toute facturation future fera l&apos;objet d&apos;informations claires
        avant tout engagement payant.
      </p>

      <h2>13. Droit applicable et litiges</h2>
      <p>
        Les présentes CGU sont soumises au <strong>droit français</strong>. En
        cas de litige, et après tentative de résolution amiable, compétence est
        attribuée aux tribunaux français conformément aux règles légales en
        vigueur (notamment pour les consommateurs ou les professionnels, selon le
        cas).
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions relatives aux CGU :{" "}
        <a href="mailto:contact@lockin.app" className="text-violet-300 hover:text-violet-200">
          contact@lockin.app
        </a>
        .
      </p>
    </LegalPage>
  );
}
