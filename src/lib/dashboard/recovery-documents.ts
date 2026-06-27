import type { RecoveryInvoiceFields, RelanceProofEntry } from "./recovery";

const LOCKIN_BRAND = "LockIn";

const LOCKIN_LOGO_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
  <rect x="5" y="10" width="14" height="11" rx="2" fill="#6d28d9"/>
  <circle cx="12" cy="15.5" r="1.5" fill="#ede9fe"/>
  <rect x="11.25" y="15.5" width="1.5" height="3" rx="0.75" fill="#ede9fe"/>
</svg>`;

const PRINT_PAGE_CONFIG = `
  @page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }

  @media print {
    html {
      margin: 0 !important;
      padding: 0 !important;
    }

    body {
      background: #ffffff !important;
      color: #111111 !important;
      font-size: 12pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-height: auto !important;
      background: transparent !important;
    }

    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      display: block;
      clear: both;
    }

    tr, p, .tribunal-box, .info-box, .certification, .signature-block, li {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    thead {
      display: table-header-group;
    }

    table {
      page-break-inside: auto;
    }
  }
`;

const LETTER_PRINT_STYLES = `
  ${PRINT_PAGE_CONFIG}
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: Georgia, "Times New Roman", serif;
    color: #111827;
    background: #f3f4f6;
    line-height: 1.65;
  }
  .page {
    display: block;
    width: 100%;
    max-width: 210mm;
    margin: 0 auto 24px;
    padding: 20mm 15mm;
    background: #fff;
    clear: both;
  }
  .lockin-stamp {
    display: block;
    max-width: 100%;
    margin: 0 0 18px;
    text-align: right;
  }
  .lockin-stamp-row {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    max-width: 100%;
  }
  .lockin-stamp-brand {
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #5b21b6;
  }
  .lockin-stamp-note {
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 8pt;
    line-height: 1.35;
    color: #6b7280;
    margin: 4px 0 0;
    text-align: right;
  }
  .letter-content {
    width: 100%;
    max-width: 100%;
  }
  .letter-content h1 {
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 17px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 6px;
  }
  .subtitle {
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #6b7280;
    font-size: 12px;
    margin: 0 0 28px;
  }
  .letter-paragraph {
    margin: 0 0 14px;
    font-size: 14px;
  }
  .certification {
    margin-top: 28px;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 10px;
    color: #4b5563;
    width: 100%;
    max-width: 100%;
  }
  .certification strong {
    display: block;
    margin-bottom: 3px;
    color: #374151;
  }
  .doc-footer {
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 9px;
    color: #9ca3af;
    text-align: center;
  }
`;

const ATTESTATION_PRINT_STYLES = `
  ${PRINT_PAGE_CONFIG}
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #111827;
    background: #f3f4f6;
    line-height: 1.55;
  }
  .page {
    display: block;
    width: 100%;
    max-width: 210mm;
    margin: 0 auto 24px;
    padding: 20mm 15mm;
    background: #fff;
    clear: both;
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 6px;
    color: #111827;
    letter-spacing: -0.01em;
  }
  h2 {
    font-size: 15px;
    font-weight: 600;
    margin: 22px 0 8px;
    color: #1f2937;
  }
  .subtitle {
    color: #6b7280;
    font-size: 12px;
    margin: 0 0 22px;
  }
  .page-body {
    width: 100%;
    max-width: 100%;
  }
  .official-body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 14px;
    line-height: 1.7;
    color: #111827;
  }
  .official-body p { margin: 0 0 14px; }
  .field-line {
    border-bottom: 1px solid #9ca3af;
    display: inline-block;
    min-width: 140px;
    max-width: 100%;
    padding-bottom: 1px;
  }
  .signature-block {
    margin-top: 36px;
    font-size: 14px;
    line-height: 2;
  }
  .info-box,
  .tribunal-box {
    margin: 18px 0;
    padding: 14px 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    width: 100%;
    max-width: 100%;
  }
  .info-box strong,
  .tribunal-box strong { color: #111827; }
  .checklist {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    width: 100%;
    max-width: 100%;
  }
  .checklist li {
    display: block;
    padding: 9px 0 9px 22px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;
    position: relative;
  }
  .checklist li:last-child { border-bottom: none; }
  .checklist li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 11px;
    width: 13px;
    height: 13px;
    border: 1.5px solid #9ca3af;
    border-radius: 2px;
  }
  .numbered-list {
    margin: 10px 0 0;
    padding-left: 20px;
    font-size: 13px;
    width: 100%;
    max-width: 100%;
  }
  .numbered-list li { margin-bottom: 8px; }
  table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    margin: 16px 0 8px;
    font-size: 12px;
    table-layout: fixed;
  }
  th {
    background: #f9fafb;
    color: #374151;
    text-align: left;
    padding: 9px 8px;
    border-bottom: 2px solid #e5e7eb;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  td {
    padding: 9px 8px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  tr:last-child td { border-bottom: none; }
  .status-ok {
    display: inline-block;
    background: #dcfce7;
    color: #166534;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
  }
  .meta-grid {
    display: block;
    margin-bottom: 18px;
    font-size: 12px;
    width: 100%;
    max-width: 100%;
  }
  .meta-row {
    display: block;
    padding: 6px 0;
    border-bottom: 1px solid #f3f4f6;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .meta-row strong {
    display: inline-block;
    min-width: 100px;
    color: #6b7280;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .lockin-stamp {
    display: block;
    max-width: 100%;
    margin: 0 0 16px;
    text-align: right;
  }
  .lockin-stamp-row {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    max-width: 100%;
  }
  .lockin-stamp-brand {
    font-size: 13px;
    font-weight: 700;
    color: #5b21b6;
  }
  .lockin-stamp-note {
    font-size: 8pt;
    line-height: 1.35;
    color: #6b7280;
    margin: 4px 0 0;
    text-align: right;
  }
  .certification {
    margin-top: 24px;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 10px;
    color: #4b5563;
    width: 100%;
    max-width: 100%;
  }
  .certification strong {
    display: block;
    margin-bottom: 3px;
    color: #374151;
  }
  .doc-footer {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    font-size: 9px;
    color: #9ca3af;
    text-align: center;
  }
`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatGeneratedDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function certificationId(date: Date) {
  return `LK-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getTime()).slice(-6)}`;
}

function lockinStampHtml() {
  return `
    <div class="lockin-stamp">
      <div class="lockin-stamp-row">
        ${LOCKIN_LOGO_SVG}
        <span class="lockin-stamp-brand">${LOCKIN_BRAND}</span>
      </div>
      <p class="lockin-stamp-note">Document enregistré et certifié sur la plateforme de recouvrement LockIn</p>
    </div>
  `;
}

function certificationFooter(generatedAt: Date) {
  const certId = certificationId(generatedAt);
  const generatedLabel = formatGeneratedDateTime(generatedAt);

  return `
    <div class="certification">
      <strong>Certification numérique LockIn</strong>
      Identifiant unique : ${certId} · Généré le ${generatedLabel}
    </div>
    <footer class="doc-footer">${LOCKIN_BRAND} · Document confidentiel · Usage procédural</footer>
  `;
}

function letterBodyToHtml(letterBody: string) {
  return letterBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p class="letter-paragraph">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n");
}

function buildInjonctionRequestPage(fields: RecoveryInvoiceFields) {
  const amount = fields.amountDisplay || "—";
  const reference = fields.reference || "—";
  const invoiceDate = fields.invoiceDate || "—";
  const dueDate = fields.dueDate || "—";
  const debtor = fields.clientName || "—";
  const debtorMail = fields.mail ? ` (${fields.mail})` : "";

  return `
    <section class="page page-break">
      <main class="page-body official-body">
        <p style="text-align:right;margin-bottom:28px">À l'attention de Monsieur le Président du Tribunal</p>

        <h1 style="font-family:Georgia,serif;text-align:center;font-size:17px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:24px">
          Requête en injonction de payer
        </h1>

        <p><strong>Madame, Monsieur le Président,</strong></p>

        <p>
          Je soussigné(e) <span class="field-line">&nbsp;</span>, demeurant ou ayant mon siège social à
          <span class="field-line">&nbsp;</span>, agissant en qualité de créancier(ère),
          ai l'honneur de solliciter de votre juridiction une injonction de payer à l'encontre de :
        </p>

        <p>
          <strong>Débiteur :</strong> ${escapeHtml(debtor)}${escapeHtml(debtorMail)}<br />
          <strong>Montant réclamé :</strong> ${escapeHtml(amount)}&nbsp;€<br />
          <strong>Facture n° :</strong> ${escapeHtml(reference)} · <strong>Date :</strong> ${escapeHtml(invoiceDate)} · <strong>Échéance :</strong> ${escapeHtml(dueDate)}
        </p>

        <p>
          <strong>Exposé des faits</strong><br />
          La créance résulte d'une facture demeurée impayée malgré les relances amiables adressées au débiteur
          (notifications par email via la plateforme LockIn, puis mise en demeure par LRAR restée sans réponse).
          Le montant du principal réclamé s'élève à <strong>${escapeHtml(amount)}&nbsp;€</strong>.
        </p>

        <p>
          <strong>Demande au tribunal</strong><br />
          Je vous prie de bien vouloir ordonner au débiteur ci-dessus désigné de me payer la somme de
          <strong>${escapeHtml(amount)}&nbsp;€</strong>, ainsi que les intérêts et indemnités légalement dus,
          et de condamner le débiteur aux dépens.
        </p>

        <p>Je joins à la présente requête les pièces justificatives listées en page suivante.</p>

        <div class="signature-block">
          Fait à <span class="field-line">&nbsp;</span>, le <span class="field-line">&nbsp;</span><br /><br />
          Signature :
        </div>
      </main>
    </section>
  `;
}

function buildNoticeEnvoiPage(fields: RecoveryInvoiceFields) {
  const debtor = fields.clientName || "—";

  return `
    <section class="page page-break">
      ${lockinStampHtml()}
      <main class="page-body">
        <h1>Notice d'envoi &amp; Liste des pièces</h1>
        <p class="subtitle">Dossier d'injonction de payer — Débiteur : ${escapeHtml(debtor)}</p>

        <h2>Comment constituer et envoyer votre dossier</h2>
        <p style="font-size:13px;color:#374151">
          Rassemblez les pièces dans l'ordre ci-dessous, puis adressez l'ensemble au greffe du tribunal compétent
          (recommandé avec accusé de réception).
        </p>

        <ol class="numbered-list">
          <li><strong>La requête signée</strong> (page 1 de ce document), datée et signée de votre main.</li>
          <li><strong>La facture impayée</strong> (original ou copie certifiée conforme).</li>
          <li><strong>La copie de la mise en demeure</strong> adressée au débiteur.</li>
          <li><strong>La preuve d'envoi LRAR</strong> (accusé de réception ou relevé de distribution).</li>
          <li><strong>L'attestation LockIn</strong> (page 3) — preuve des relances amiables par email.</li>
        </ol>

        <div class="info-box">
          <p style="margin:0 0 8px"><strong>Frais de greffe</strong></p>
          <p style="margin:0">
            Joignez un chèque de <strong>33,47&nbsp;€</strong> à l'ordre du <strong>greffe du tribunal</strong>
            (montant indicatif — vérifiez auprès du greffe compétent).
          </p>
        </div>

        <h2>Tribunal compétent</h2>
        <div class="tribunal-box">
          <p style="margin:0 0 8px">
            <strong>Tribunal de Commerce</strong> — si votre débiteur est une <strong>entreprise ou un commerçant</strong>.
          </p>
          <p style="margin:0">
            <strong>Tribunal Judiciaire</strong> — si votre débiteur est un <strong>particulier ou un artisan</strong>.
          </p>
        </div>

        <p style="font-size:12px;color:#6b7280;margin-top:16px">
          Adressez le dossier au greffe du tribunal du ressort du domicile ou du siège social du débiteur.
          Conservez une copie complète de l'envoi et la preuve de dépôt.
        </p>
      </main>
    </section>
  `;
}

function buildAttestationPage(
  fields: RecoveryInvoiceFields,
  history: RelanceProofEntry[],
  generatedAt: Date,
) {
  const debtorEmail = fields.mail || "—";
  const rows =
    history.length > 0
      ? history
          .map(
            (entry) => `
        <tr>
          <td>${escapeHtml(entry.sentDate)}</td>
          <td>${escapeHtml(entry.stepName)}</td>
          <td>${escapeHtml(entry.channel)}</td>
          <td>${escapeHtml(debtorEmail)}</td>
          <td><span class="status-ok">Délivré</span></td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px">Aucune relance automatique enregistrée comme envoyée.</td></tr>`;

  return `
    <section class="page">
      ${lockinStampHtml()}
      <main class="page-body">
        <h1>Attestation Officielle de Relance LockIn</h1>
        <p class="subtitle">Certification de l'historique des notifications automatiques transmises au débiteur</p>

        <div class="meta-grid">
          <div class="meta-row"><strong>Débiteur</strong> ${escapeHtml(fields.clientName)}</div>
          <div class="meta-row"><strong>Email</strong> ${escapeHtml(debtorEmail)}</div>
          <div class="meta-row"><strong>Facture n°</strong> ${escapeHtml(fields.reference || "—")}</div>
          <div class="meta-row"><strong>Montant</strong> ${escapeHtml(fields.amountDisplay || "—")} €</div>
          <div class="meta-row"><strong>Date facture</strong> ${escapeHtml(fields.invoiceDate || "—")}</div>
          <div class="meta-row"><strong>Échéance</strong> ${escapeHtml(fields.dueDate || "—")}</div>
        </div>

        <p style="font-size:12px;color:#374151;margin-bottom:6px">
          LockIn certifie que les relances automatiques ci-dessous ont été programmées, générées et délivrées
          sur l'adresse email du débiteur via la plateforme LockIn, conformément au calendrier de recouvrement configuré.
        </p>

        <table>
          <thead>
            <tr>
              <th>Date d'envoi</th>
              <th>Étape</th>
              <th>Canal</th>
              <th>Destinataire</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="font-size:11px;color:#6b7280;margin-top:12px">
          Ce document atteste des démarches amiables préalables et peut être joint à la requête en injonction de payer.
        </p>
      </main>
      ${certificationFooter(generatedAt)}
    </section>
  `;
}

export function buildMiseEnDemeureStyledHtml(
  letterBody: string,
  fields: RecoveryInvoiceFields,
  generatedAt: Date = new Date(),
): string {
  const reference = fields.reference || "—";
  const title = `Mise en demeure — Facture ${reference}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${LETTER_PRINT_STYLES}</style>
</head>
<body>
  <section class="page">
    ${lockinStampHtml()}
    <main class="letter-content">
      <h1>Mise en demeure de payer</h1>
      <p class="subtitle">Facture n° ${escapeHtml(reference)} · Destinataire : ${escapeHtml(fields.clientName)}</p>
      ${letterBodyToHtml(letterBody)}
    </main>
    ${certificationFooter(generatedAt)}
  </section>
</body>
</html>`;
}

export function buildAttestationStyledHtml(
  fields: RecoveryInvoiceFields,
  history: RelanceProofEntry[],
  generatedAt: Date = new Date(),
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Dossier injonction LockIn — ${escapeHtml(fields.clientName)}</title>
  <style>${ATTESTATION_PRINT_STYLES}</style>
</head>
<body>
  ${buildInjonctionRequestPage(fields)}
  ${buildNoticeEnvoiPage(fields)}
  ${buildAttestationPage(fields, history, generatedAt)}
</body>
</html>`;
}

function openPrintableDocument(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}

export function downloadMiseEnDemeurePdf(
  fields: RecoveryInvoiceFields,
  letterBody: string,
) {
  const html = buildMiseEnDemeureStyledHtml(letterBody, fields);
  const safeRef = (fields.reference || "facture").replace(/[^\w.-]+/g, "_");
  openPrintableDocument(html, `mise-en-demeure-${safeRef}.html`);
}

export function downloadProofAttestationPdf(
  fields: RecoveryInvoiceFields,
  history: RelanceProofEntry[],
) {
  const html = buildAttestationStyledHtml(fields, history);
  const safeName = (fields.clientName || "client").replace(/[^\w.-]+/g, "_");
  openPrintableDocument(html, `attestation-relance-lockin-${safeName}.html`);
}

/** @deprecated Utiliser downloadProofAttestationPdf */
export function downloadProofDossier(
  fields: RecoveryInvoiceFields,
  _content: string,
) {
  downloadProofAttestationPdf(fields, []);
}
