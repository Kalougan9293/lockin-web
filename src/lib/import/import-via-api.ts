import type { TableData } from "@/types/tableau";

export type ImportApiSuccess = {
  ok: true;
  table: TableData;
  importedCount: number;
  importedRowIds: string[];
  errors: string[];
};

export type ImportApiFailure = {
  error: string;
  errors?: string[];
  importedCount?: number;
};

export async function importFilesViaApi(
  tableId: string,
  files: File[],
): Promise<ImportApiSuccess> {
  const formData = new FormData();
  formData.append("tableId", tableId);
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/import", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as ImportApiSuccess | ImportApiFailure;

  if (!response.ok) {
    const failure = data as ImportApiFailure;
    throw new Error(failure.error ?? "Import impossible.");
  }

  if (!("ok" in data) || !data.ok || !data.table) {
    throw new Error("Réponse d'import invalide.");
  }

  return data;
}
