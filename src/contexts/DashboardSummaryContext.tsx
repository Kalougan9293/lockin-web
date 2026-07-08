"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type DashboardSummary = {
  recoveredAmount: number;
  pendingAmount: number;
  paidCount: number;
  inProgressCount: number;
  sentRelancesCount: number;
};

type DashboardSummaryContextValue = {
  summary: DashboardSummary | null;
  setSummary: (value: DashboardSummary | null) => void;
};

const DashboardSummaryContext = createContext<DashboardSummaryContextValue | null>(null);

export function DashboardSummaryProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const value = useMemo(
    () => ({
      summary,
      setSummary,
    }),
    [summary],
  );

  return (
    <DashboardSummaryContext.Provider value={value}>
      {children}
    </DashboardSummaryContext.Provider>
  );
}

export function useDashboardSummary() {
  const context = useContext(DashboardSummaryContext);
  if (!context) {
    throw new Error("useDashboardSummary doit être utilisé dans DashboardSummaryProvider.");
  }
  return context;
}

export function useDashboardSummaryOptional() {
  return useContext(DashboardSummaryContext);
}
