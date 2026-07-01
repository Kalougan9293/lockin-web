/**
 * Supprime tous les comptes clients sauf l'administrateur.
 * Usage : node scripts/purge-non-admin-users.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename) {
  try {
    const content = readFileSync(resolve(root, filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = (
  process.env.ADMIN_EMAIL ?? "jonathan.seroussi.92100@gmail.com"
).toLowerCase();

if (!url || !serviceRoleKey) {
  console.error("Variables Supabase manquantes (URL ou SERVICE_ROLE_KEY).");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < perPage) break;
    page += 1;
  }

  return users;
}

async function deleteUserData(userId) {
  const { error: tablesError } = await admin
    .from("tableaux")
    .delete()
    .eq("user_id", userId);
  if (tablesError) throw new Error(`tableaux: ${tablesError.message}`);

  const { error: clientError } = await admin
    .from("clients_lockin")
    .delete()
    .eq("id_client", userId);
  if (clientError) throw new Error(`clients_lockin: ${clientError.message}`);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) throw new Error(`auth: ${authError.message}`);
}

async function main() {
  console.log(`Conservation du compte admin : ${adminEmail}`);

  const users = await listAllUsers();
  const adminUser = users.find((u) => u.email?.toLowerCase() === adminEmail);

  if (!adminUser) {
    console.warn(
      "Attention : aucun utilisateur auth trouvé avec cet email admin.",
    );
  } else {
    console.log(`Admin trouvé : ${adminUser.id}`);
  }

  const toDelete = users.filter((u) => u.email?.toLowerCase() !== adminEmail);
  console.log(`${toDelete.length} compte(s) à supprimer sur ${users.length}.`);

  for (const user of toDelete) {
    const label = user.email ?? user.id;
    process.stdout.write(`Suppression de ${label}… `);
    try {
      await deleteUserData(user.id);
      console.log("OK");
    } catch (error) {
      console.log("ERREUR");
      console.error(`  ${error instanceof Error ? error.message : error}`);
    }
  }

  if (adminUser) {
    const { data: orphans, error: orphanListError } = await admin
      .from("clients_lockin")
      .select("id_client, email")
      .neq("id_client", adminUser.id);

    if (orphanListError) {
      console.error(`Orphelins clients_lockin : ${orphanListError.message}`);
    } else if ((orphans ?? []).length > 0) {
      const { error: orphanDeleteError } = await admin
        .from("clients_lockin")
        .delete()
        .neq("id_client", adminUser.id);
      if (orphanDeleteError) {
        console.error(`Purge orphelins : ${orphanDeleteError.message}`);
      } else {
        console.log(`${orphans.length} profil(s) orphelin(s) supprimé(s).`);
      }
    }
  }

  const remainingUsers = await listAllUsers();
  const { count: clientCount, error: countError } = await admin
    .from("clients_lockin")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error(`Comptage clients_lockin : ${countError.message}`);
  }

  console.log("\nRésumé :");
  console.log(`  Utilisateurs auth restants : ${remainingUsers.length}`);
  for (const u of remainingUsers) {
    console.log(`    - ${u.email ?? u.id}`);
  }
  console.log(`  Lignes clients_lockin restantes : ${clientCount ?? "?"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
