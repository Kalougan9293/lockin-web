import {
  isAmountColumnLabel,
  parseAmountToStorage,
} from "@/lib/preferences/currency-format";
import type { DateFormatPreference } from "@/lib/preferences/date-format";
import {
  isDateColumnLabel,
  parseDateInputToIso,
} from "@/lib/preferences/date-format";

import type { ParsedInvoiceFields } from "./parse-invoice-fields";

export function normalizeImportFields(
  fields: ParsedInvoiceFields,
  dateFormat: DateFormatPreference,
): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const [label, raw] of Object.entries(fields)) {
    const trimmed = raw?.trim() ?? "";
    if (!trimmed) continue;

    if (isDateColumnLabel(label)) {
      payload[label] = parseDateInputToIso(trimmed, dateFormat);
    } else if (isAmountColumnLabel(label)) {
      payload[label] = parseAmountToStorage(trimmed);
    } else {
      payload[label] = trimmed;
    }
  }

  return payload;
}
