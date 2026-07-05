"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const IMPORT_ZONE_VISIBLE_STORAGE_KEY = "lockin-import-zone-visible";

type ImportZoneContextValue = {
  importZoneVisible: boolean;
  toggleImportZone: () => void;
};

const ImportZoneContext = createContext<ImportZoneContextValue | null>(null);

export function ImportZoneProvider({ children }: { children: ReactNode }) {
  const [importZoneVisible, setImportZoneVisible] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(IMPORT_ZONE_VISIBLE_STORAGE_KEY);
    if (stored === "0") {
      setImportZoneVisible(false);
    }
  }, []);

  const toggleImportZone = useCallback(() => {
    setImportZoneVisible((current) => {
      const next = !current;
      localStorage.setItem(IMPORT_ZONE_VISIBLE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      importZoneVisible,
      toggleImportZone,
    }),
    [importZoneVisible, toggleImportZone],
  );

  return (
    <ImportZoneContext.Provider value={value}>
      {children}
    </ImportZoneContext.Provider>
  );
}

export function useImportZone() {
  const context = useContext(ImportZoneContext);
  if (!context) {
    throw new Error("useImportZone doit être utilisé dans ImportZoneProvider.");
  }
  return context;
}
