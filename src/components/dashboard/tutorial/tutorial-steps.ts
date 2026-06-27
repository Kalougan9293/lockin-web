export type TutorialStep = {
  target: string;
  message: string;
};

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tutorial="import-zone"]',
    message:
      "Importez vos factures ici : glissez-déposez un ou plusieurs PDF (ou un CSV), ou cliquez pour parcourir. Vous pouvez aussi ajouter un client manuellement.",
  },
  {
    target: '[data-tutorial="table-title"]',
    message:
      "Voici le titre de votre tableau. Cliquez dessus pour le renommer et l'organiser comme vous le souhaitez.",
  },
  {
    target: '[data-tutorial="configure-btn"]',
    message:
      "Configurez ici le nombre de relances, le délai de chaque étape et le message envoyé à vos clients.",
  },
  {
    target: '[data-tutorial="table-left"]',
    message:
      "À gauche : vos colonnes client (nom, mail, montant, échéance…). Ajoutez, masquez ou réorganisez-les selon vos besoins.",
  },
  {
    target: '[data-tutorial="table-right"]',
    message:
      "À droite : les dates de relance et le statut de paiement — tout votre suivi en un coup d'œil.",
  },
];
