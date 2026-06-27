import "server-only";

import { fetchRelanceDeliveriesForTableaux } from "@/lib/dashboard/fetch-relance-deliveries";
import {
  fetchAllTablesForUser,
  insertFullTable,
} from "@/lib/dashboard/tableau-db";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardInitialData } from "@/types/dashboard";
import { createTableData } from "@/types/tableau";

export async function loadDashboardDataForUser(
  userId: string,
): Promise<DashboardInitialData> {
  const admin = createAdminClient();
  let tables = await fetchAllTablesForUser(admin, userId);

  if (tables.length === 0) {
    const initial = createTableData();
    await insertFullTable(admin, userId, initial);
    tables = [initial];
    return { tables, deliveries: [] };
  }

  const tableauIds = tables.map((table) => table.id);
  const deliveries = await fetchRelanceDeliveriesForTableaux(admin, tableauIds);

  return { tables, deliveries };
}
