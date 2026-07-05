import type { ImportReviewQueueItem } from "./process-server-import";

export type ImportExtractSuccess = {
  ok: true;
  reviewQueue: ImportReviewQueueItem[];
  errors: string[];
};

export type ImportApiFailure = {
  error: string;
  errors?: string[];
};

export async function importFilesViaApi(
  tableId: string,
  files: File[],
): Promise<ImportExtractSuccess> {
  const formData = new FormData();
  formData.append("tableId", tableId);
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/import", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as ImportExtractSuccess | ImportApiFailure;

  if (!response.ok) {
    const failure = data as ImportApiFailure;
    throw new Error(failure.error ?? "Import impossible.");
  }

  if (!("ok" in data) || !data.ok || !Array.isArray(data.reviewQueue)) {
    throw new Error("Réponse d'import invalide.");
  }

  return data;
}
