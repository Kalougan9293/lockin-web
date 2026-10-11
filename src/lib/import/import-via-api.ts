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

type ImportFilesOptions = {
  onFileProgress?: (current: number, total: number) => void;
};

async function postImportBatch(
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
    const error = new Error(failure.error ?? "Import impossible.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  if (!("ok" in data) || !data.ok || !Array.isArray(data.reviewQueue)) {
    throw new Error("Réponse d'import invalide.");
  }

  return data;
}

/**
 * Envoie les fichiers au serveur. Plusieurs PDF → 1 requête chacun
 * (évite timeout + limite body ~4,5 Mo de Vercel).
 */
export async function importFilesViaApi(
  tableId: string,
  files: File[],
  options?: ImportFilesOptions,
): Promise<ImportExtractSuccess> {
  if (files.length === 0) {
    throw new Error("Aucun fichier sélectionné.");
  }

  if (files.length === 1) {
    options?.onFileProgress?.(1, 1);
    return postImportBatch(tableId, files);
  }

  const reviewQueue: ImportReviewQueueItem[] = [];
  const errors: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    options?.onFileProgress?.(index + 1, files.length);

    try {
      const result = await postImportBatch(tableId, [file]);
      reviewQueue.push(...result.reviewQueue);
      errors.push(...result.errors);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import impossible.";
      errors.push(`${file.name} : ${message}`);

      const status =
        error && typeof error === "object" && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      // Quota / auth : inutile de continuer
      if (status === 401 || status === 403 || status === 429) {
        break;
      }
    }
  }

  if (reviewQueue.length === 0) {
    throw new Error(errors[0] ?? "Aucune facture exploitable.");
  }

  return { ok: true, reviewQueue, errors };
}
