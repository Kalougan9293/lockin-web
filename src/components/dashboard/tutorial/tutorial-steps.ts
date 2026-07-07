export type TutorialStep = {
  target: string;
  message: string;
};

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tutorial="import-zone"]',
    message:
      "Choisissez d'abord le tableau de destination, puis importez un fichier (PDF ou CSV) ou ajoutez un client manuellement.",
  },
  {
    target: '[data-tutorial="table-title"]',
    message: "Ici, le titre de votre tableau que vous pouvez personnaliser.",
  },
  {
    target: '[data-tutorial="table-left"]',
    message:
      "Vos colonnes client (nom, mail, montant, échéance…). Ajoutez-les, masquez-les et réorganisez-les selon vos besoins.",
  },
  {
    target: '[data-tutorial="configure-btn"]',
    message:
      "Configurez ici le nombre de relances, le rythme et le ton de chaque étape, ainsi que le message envoyé à vos clients.",
  },
  {
    target: '[data-tutorial="table-right"]',
    message:
      'Les dates de relance en un coup d\'œil. Appuyez sur « PAYE ? » pour arrêter les relances instantanément.',
  },
];
