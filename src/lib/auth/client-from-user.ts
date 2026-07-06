import type { User } from "@supabase/supabase-js";

import {
  type ActivityDomain,
  isActivityDomain,
} from "@/lib/auth/activity-domains";

export type ClientProfilePayload = {
  idClient: string;
  prenomClient: string;
  nomSociete: string;
  domaineActivite?: ActivityDomain;
};

export function buildClientPayloadFromAuthUser(user: User): ClientProfilePayload {
  const metadata = user.user_metadata ?? {};
  const domaineRaw = String(metadata.domaine_activite ?? "").trim();

  return {
    idClient: user.id,
    prenomClient: String(metadata.prenom_client ?? "").trim(),
    nomSociete: String(metadata.nom_societe ?? "").trim(),
    ...(isActivityDomain(domaineRaw) ? { domaineActivite: domaineRaw } : {}),
  };
}

export function getActivityDomainFromAuthUser(user: User): string | null {
  const domaineRaw = String(user.user_metadata?.domaine_activite ?? "").trim();
  return isActivityDomain(domaineRaw) ? domaineRaw : null;
}
