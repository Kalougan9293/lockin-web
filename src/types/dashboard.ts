import type { RelanceDeliveryRow } from "@/types/database";
import type { TableData } from "@/types/tableau";

export type DashboardInitialData = {
  tables: TableData[];
  deliveries: RelanceDeliveryRow[];
};
