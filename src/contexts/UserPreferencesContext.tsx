"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DATE_FORMAT_STORAGE_KEY,
  type DateFormatPreference,
} from "@/lib/preferences/date-format";

type UserPreferencesContextValue = {
  dateFormat: DateFormatPreference;
  setDateFormat: (format: DateFormatPreference) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(
  null,
);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormatPreference>("fr");

  useEffect(() => {
    const stored = localStorage.getItem(DATE_FORMAT_STORAGE_KEY);
    if (stored === "fr" || stored === "iso") {
      setDateFormatState(stored);
    }
  }, []);

  function setDateFormat(format: DateFormatPreference) {
    setDateFormatState(format);
    localStorage.setItem(DATE_FORMAT_STORAGE_KEY, format);
  }

  return (
    <UserPreferencesContext.Provider value={{ dateFormat, setDateFormat }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      "useUserPreferences doit être utilisé dans UserPreferencesProvider.",
    );
  }
  return context;
}

export function useUserPreferencesOptional() {
  return useContext(UserPreferencesContext);
}
