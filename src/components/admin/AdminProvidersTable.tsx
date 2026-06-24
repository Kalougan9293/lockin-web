"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteProviderAction,
  startImpersonationAction,
} from "@/app/actions/admin";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminProviderRow } from "@/lib/admin/queries";

type AdminProvidersTableProps = {
  providers: AdminProviderRow[];
};

function formatInscriptionDate(iso: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AdminProvidersTable({ providers }: AdminProvidersTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<AdminProviderRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleImpersonate(provider: AdminProviderRow) {
    setActionError(null);
    startTransition(async () => {
      const result = await startImpersonationAction(provider.id);
      if (result?.error) {
        setActionError(result.error);
      }
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteProviderAction(deleteTarget.id);
      if (result.error) {
        setActionError(result.error);
        setDeleteTarget(null);
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  if (providers.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-brand-card px-6 py-10 text-center text-sm text-brand-muted">
        Aucun client inscrit pour le moment.
      </p>
    );
  }

  return (
    <>
      {actionError ? (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-brand-card shadow-xl shadow-violet-950/20 ring-1 ring-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-sm">
            <thead className="border-b border-white/10 bg-violet-500/10 text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3.5 font-medium">Prénom</th>
                <th className="px-4 py-3.5 font-medium">Société</th>
                <th className="px-4 py-3.5 font-medium">Mail</th>
                <th className="px-4 py-3.5 font-medium">Factures</th>
                <th className="px-4 py-3.5 font-medium">Relances</th>
                <th className="px-4 py-3.5 font-medium">Pays</th>
                <th className="px-4 py-3.5 font-medium">Inscription</th>
                <th className="px-4 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {providers.map((provider) => (
                <tr
                  key={provider.id}
                  className="transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3.5 font-medium text-white">
                    {provider.prenom}
                  </td>
                  <td className="px-4 py-3.5 text-brand-muted">
                    {provider.nomSociete}
                  </td>
                  <td className="px-4 py-3.5 text-brand-muted">{provider.email}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums text-white/90">
                    {provider.invoiceCount}
                  </td>
                  <td className="px-4 py-3.5 text-center tabular-nums text-white/90">
                    {provider.relanceCount}
                  </td>
                  <td className="px-4 py-3.5 text-brand-muted">{provider.pays}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-brand-muted">
                    {formatInscriptionDate(provider.dateInscription)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleImpersonate(provider)}
                        title="Incarner ce client"
                        aria-label={`Incarner ${provider.prenom}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-500/15 text-base transition-colors hover:border-violet-400/45 hover:bg-violet-500/25 disabled:opacity-50"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setDeleteTarget(provider)}
                        title="Supprimer ce client"
                        aria-label={`Supprimer ${provider.prenom}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/25 bg-red-500/10 text-base transition-colors hover:border-red-400/45 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer le client"
        message={
          deleteTarget
            ? `Supprimer définitivement ${deleteTarget.prenom} (${deleteTarget.nomSociete}) ? Tous ses tableaux, factures et son compte seront effacés (RGPD).`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
