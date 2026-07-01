"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  buildCallScript,
  buildMiseEnDemeureLetterBody,
  buildRelanceProofHistory,
  extractRecoveryFields,
} from "@/lib/dashboard/recovery";
import {
  downloadMiseEnDemeurePdf,
  downloadProofAttestationPdf,
} from "@/lib/dashboard/recovery-documents";
import { fredoka } from "@/lib/fonts/fredoka";
import type { RelanceDeliveryRow } from "@/types/database";
import type { ClientRow, ColumnDef, RelanceStep } from "@/types/tableau";

type RecoveryDrawerProps = {
  open: boolean;
  onClose: () => void;
  row: ClientRow;
  columns: ColumnDef[];
  relanceSteps: RelanceStep[];
  deliveries?: RelanceDeliveryRow[];
  simulateRelances?: boolean;
};

const STEPS = [
  {
    id: 1,
    emoji: "📞",
    title: "Levier Humain",
    subtitle: "Contact direct avec le débiteur",
  },
  {
    id: 2,
    emoji: "✉️",
    title: "Levier Pré-juridique",
    subtitle: "Mise en demeure formelle",
  },
  {
    id: 3,
    emoji: "⚖️",
    title: "Levier Juridique",
    subtitle: "Dossier pour le Tribunal de Commerce",
  },
] as const;

const STEP1_INFO_TEXT =
  "📞 Pas de retour par mail (oubli, courrier en spam, mauvaise adresse…) ? L'appel direct est fortement recommandé avant de poursuivre le recouvrement : un échange direct permet souvent de débloquer la situation et d'obtenir une date de virement.";

const STEP2_INFO_TEXT =
  "⚠️ Sans paiement amiable, envoyez une mise en demeure officielle : obligatoire avant toute action en justice. Imprimez-la et expédiez-la en LRAR (Lettre Recommandée avec Accusé de Réception).";

const STEP3_INFO_TEXT =
  "⚖️ Si la mise en demeure reste sans réponse après 8 jours, vous pouvez déposer une demande d'Injonction de Payer au tribunal (coût ~35€). C'est une procédure rapide, sans avocat, et les frais de justice/huissier validés par le juge sont légalement mis à la charge de votre débiteur en cas de succès.";

function StepCard({
  step,
  children,
  compactTitle = false,
  showSubtitle = true,
}: {
  step: (typeof STEPS)[number];
  children: ReactNode;
  compactTitle?: boolean;
  showSubtitle?: boolean;
}) {
  const accentClass =
    step.id === 1
      ? "border-violet-400/20 ring-violet-400/10"
      : step.id === 2
        ? "border-amber-400/20 ring-amber-400/10"
        : "border-rose-400/20 ring-rose-400/10";

  return (
    <section
      className={`rounded-2xl border bg-white/[0.03] p-5 shadow-lg shadow-violet-950/20 ring-1 ${accentClass}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-lg ring-1 ring-violet-400/30"
          aria-hidden
        >
          {step.emoji}
        </span>
        <div>
          {compactTitle ? (
            <h3 className={`${fredoka.className} text-lg font-semibold leading-tight`}>
              <span className="text-violet-300">Étape {step.id} :</span>{" "}
              <span className="text-white">{step.title}</span>
            </h3>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">
                Étape {step.id}
              </p>
              <h3 className={`${fredoka.className} text-lg font-semibold text-white`}>
                {step.title}
              </h3>
            </>
          )}
          {showSubtitle ? (
            <p className="text-sm text-brand-muted">{step.subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function DismissibleInfoBox({
  visible,
  onDismiss,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
}) {
  if (!visible) return null;

  return (
    <div className="relative mb-4 rounded-xl border border-violet-400/35 bg-violet-950/50 px-4 py-3.5 pr-10 text-sm leading-relaxed text-violet-100/95 shadow-inner shadow-violet-950/40">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer l'encadré explicatif"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-violet-300/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        ×
      </button>
      {children}
    </div>
  );
}

export function RecoveryDrawer({
  open,
  onClose,
  row,
  columns,
  relanceSteps,
  deliveries = [],
  simulateRelances = false,
}: RecoveryDrawerProps) {
  const fields = extractRecoveryFields(row, columns);
  const callScript = buildCallScript(fields);
  const proofHistory = buildRelanceProofHistory(
    row,
    columns,
    relanceSteps,
    deliveries,
    new Date(),
    simulateRelances,
  );

  const [letterDraft, setLetterDraft] = useState("");
  const [showStep1Info, setShowStep1Info] = useState(true);
  const [showStep2Info, setShowStep2Info] = useState(true);
  const [showStep3Info, setShowStep3Info] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLetterDraft(
      buildMiseEnDemeureLetterBody(extractRecoveryFields(row, columns)),
    );
    setShowStep1Info(true);
    setShowStep2Info(true);
    setShowStep3Info(true);
  }, [open, row, columns, relanceSteps]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleDownloadMiseEnDemeure() {
    downloadMiseEnDemeurePdf(fields, letterDraft);
  }

  function handleExportProof() {
    downloadProofAttestationPdf(fields, proofHistory);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer l'assistance recouvrement"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-recovery-backdrop-in"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-drawer-title"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-brand-card shadow-2xl shadow-black/60 animate-recovery-drawer-in sm:max-w-lg"
      >
        <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent px-6 py-5">
          <div className="text-center">
            <p
              id="recovery-drawer-title"
              className="text-xs font-semibold uppercase tracking-widest text-red-300/90"
            >
              Assistance recouvrement
            </p>
            <p className="mt-2 text-sm font-light leading-snug text-white/90">
              {fields.clientName}
              {fields.phone ? (
                <>
                  {" · "}
                  <a
                    href={`tel:${fields.phone.replace(/\s/g, "")}`}
                    className="tabular-nums transition-colors hover:text-white"
                  >
                    {fields.phone}
                  </a>
                </>
              ) : (
                <span className="text-white/50"> · Numéro non renseigné</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <StepCard step={STEPS[0]} compactTitle showSubtitle={false}>
            <DismissibleInfoBox
              visible={showStep1Info}
              onDismiss={() => setShowStep1Info(false)}
            >
              {STEP1_INFO_TEXT}
            </DismissibleInfoBox>

            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-brand-muted">
              Script d&apos;appel suggéré
            </p>
            <blockquote className="rounded-xl border border-white/8 bg-brand-surface/80 px-4 py-3 text-center text-sm leading-relaxed text-white/90">
              &ldquo;{callScript}&rdquo;
            </blockquote>
          </StepCard>

          <StepCard step={STEPS[1]} compactTitle showSubtitle={false}>
            <DismissibleInfoBox
              visible={showStep2Info}
              onDismiss={() => setShowStep2Info(false)}
            >
              {STEP2_INFO_TEXT}
            </DismissibleInfoBox>

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
              Texte de la mise en demeure
            </p>
            <textarea
              value={letterDraft}
              onChange={(event) => setLetterDraft(event.target.value)}
              rows={14}
              className="mb-4 w-full resize-y rounded-xl border border-white/10 bg-brand-surface/90 px-4 py-3 text-sm leading-relaxed text-white/90 outline-none ring-violet-400/30 placeholder:text-brand-muted/50 focus:border-violet-400/40 focus:ring-2"
              aria-label="Texte de la mise en demeure"
            />
            <button
              type="button"
              onClick={handleDownloadMiseEnDemeure}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-opacity hover:opacity-90"
            >
              Télécharger le PDF
            </button>
          </StepCard>

          <StepCard step={STEPS[2]} compactTitle showSubtitle={false}>
            <DismissibleInfoBox
              visible={showStep3Info}
              onDismiss={() => setShowStep3Info(false)}
            >
              {STEP3_INFO_TEXT}
            </DismissibleInfoBox>

            <button
              type="button"
              onClick={handleExportProof}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-opacity hover:opacity-90"
            >
              Télécharger le PDF
            </button>
          </StepCard>
        </div>
      </aside>
    </div>
  );
}
