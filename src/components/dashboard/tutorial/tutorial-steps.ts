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
      'Gérez vos colonnes (nom, e-mail, montant, etc.) : ajoutez, masquez, triez et réorganisez-les. La croix masque une colonne, elle ne la supprime pas. Le "+" vous la remet.',
  },
  {
    target: '[data-tutorial="configure-btn"]',
    message:
      'Vous pouvez recevoir les relances en copie en cochant "CC".',
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
