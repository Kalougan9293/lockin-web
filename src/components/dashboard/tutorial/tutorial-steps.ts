export type TutorialStep = {
  target?: string;
  message: string;
  spotlight?: boolean;
};

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tutorial="import-target"]',
    message: "Étape 1 – Choisissez le tableau qui accueillera vos données.",
  },
  {
    target: '[data-tutorial="import-actions"]',
    message:
      "Étape 2 – Importez vos fichiers PDF ou CSV. Ou ajoutez un client manuellement. Renseignez uniquement les informations souhaitées.",
  },
  {
    target: '[data-tutorial="table-title"]',
    message: "Étape 3 – Personnalisez ici le nom de votre tableau.",
  },
  {
    target: '[data-tutorial="table-left"]',
    message:
      'Étape 4 – Gérez vos colonnes (nom, e-mail, montant, etc.) : ajoutez, masquez, triez et réorganisez-les. La croix masque une colonne, elle ne la supprime pas. Le "+" vous la remet.',
  },
  {
    target: '[data-tutorial="configure-btn"]',
    message:
      "Étape 5 – Configurez vos relances : nombre d'étapes (1 à 7), fréquence, ton et messages. Les variables disponibles dépendent des colonnes de votre tableau. Vous pouvez également ajouter des destinataires en copie (CC).",
  },
  {
    target: '[data-tutorial="table-right"]',
    message:
      "Étape 6 – Suivez toutes vos relances en un coup d'œil. Chaque échéance dispose d'un menu d'actions. Sélectionnez « Payé » pour arrêter immédiatement les relances.",
  },
  {
    spotlight: false,
    message:
      "Étape 7 – Les relances sont envoyées automatiquement chaque matin à 08 h 30, selon votre planning. Une fois les données enregistrées, vous n'avez plus rien à faire.",
  },
];
