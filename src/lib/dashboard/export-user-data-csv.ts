import Papa from "papaparse";

import type { ProfileData } from "@/app/actions/profile";
import type { TableData } from "@/types/tableau";

function collectColumnLabels(tables: TableData[]): string[] {
  const labels = new Set<string>();

  for (const table of tables) {
    for (const column of [...table.leftColumns, ...table.hiddenLeftColumns]) {
      labels.add(column.label);
    }
  }

  return [...labels].sort((a, b) => a.localeCompare(b, "fr"));
}

export function buildUserDataExportCsv(
  profile: ProfileData,
  tables: TableData[],
): string {
  const exportedAt = new Date().toISOString();
  const columnLabels = collectColumnLabels(tables);
  const rows: Record<string, string>[] = [];

  rows.push({
    type: "profil",
    tableau: "",
    ligne_id: "",
    email: profile.email,
    prenom: profile.prenom,
    societe: profile.nomSociete,
    date_export: exportedAt,
  });

  for (const table of tables) {
    for (const [index, step] of table.relanceSteps.entries()) {
      rows.push({
        type: "relance",
        tableau: table.name,
        ligne_id: "",
        etape: `Relance ${index + 1}`,
        delai_jours: String(step.days),
        message: step.messageTemplate,
        date_export: exportedAt,
      });
    }

    const columns = [...table.leftColumns, ...table.hiddenLeftColumns];

    for (const row of table.rows) {
      const entry: Record<string, string> = {
        type: "facture",
        tableau: table.name,
        ligne_id: row.id,
        date_export: exportedAt,
      };

      for (const label of columnLabels) {
        const column = columns.find((item) => item.label === label);
        entry[label] = column ? (row.values[column.id]?.trim() ?? "") : "";
      }

      rows.push(entry);
    }
  }

  return Papa.unparse(rows, {
    delimiter: ";",
    header: true,
  });
}

export function buildUserDataExportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `lockin-export-${stamp}.csv`;
}
