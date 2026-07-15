"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ImportZoneContextValue = {
  importZoneVisible: boolean;
  toggleImportZone: () => void;
};

const ImportZoneContext = createContext<ImportZoneContextValue | null>(null);

export function ImportZoneProvider({ children }: { children: ReactNode }) {
  const [importZoneVisible, setImportZoneVisible] = useState(true);

  const toggleImportZone = useCallback(() => {
    setImportZoneVisible((current) => !current);
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
