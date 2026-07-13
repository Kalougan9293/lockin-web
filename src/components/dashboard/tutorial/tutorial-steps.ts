export type TutorialStep = {
  target?: string;
  message: string;
  spotlight?: boolean;
};

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tutorial="import-target"]',
    message: "Choisissez le tableau qui accueillera vos données.",
  },
  {
    target: '[data-tutorial="import-actions"]',
    message:
      "Importez vos fichiers PDF ou CSV, ou ajoutez un client manuellement. Renseignez uniquement les informations souhaitées.",
  },
  {
    target: '[data-tutorial="table-title"]',
    message: "Personnalisez ici le nom de votre tableau.",
  },
  {
    target: '[data-tutorial="table-left"]',
    message:
      "Gérez vos colonnes (nom, e-mail, montant, etc.) : triez-les, réorganisez-les par glisser-déposer, ou redimensionnez-les selon vos besoins.",
  },
  {
    target: '[data-tutorial="add-column-btn"]',
    message:
      "Cliquez sur ce « + » pour ajouter une colonne (téléphone, lien de paiement, etc.). La croix sur une colonne la masque sans la supprimer — pratique pour alléger le tableau.",
  },
  {
    target: '[data-tutorial="add-client-btn"]',
    message:
      "Cliquez sur ce « + » pour ajouter un client à la main : même action que l'étape 2, accessible à tout moment depuis le tableau.",
  },
  {
    target: '[data-tutorial="configure-btn"]',
    message:
      "Gérez ici le nombre, rythme et message de vos relances. N'oubliez pas de cocher le CC si vous voulez recevoir les relances en copie.",
  },
  {
    target: '[data-tutorial="table-right"]',
    message:
      "Suivez toutes vos relances en un coup d'œil. Chaque échéance dispose d'un menu d'actions. Sélectionnez « Payé » pour arrêter immédiatement les relances.",
  },
  {
    spotlight: false,
    message:
      "Les relances sont envoyées automatiquement chaque matin à 08 h 30. Une fois les données enregistrées, vous n'avez plus rien à faire.",
  },
];

export const TUTORIAL_STEP_COUNT = DASHBOARD_TUTORIAL_STEPS.length;
