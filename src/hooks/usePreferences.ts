import { useContext } from "react";
import {
  PreferencesContext,
  type PreferencesContextValue,
} from "@/contexts/PreferencesContext";

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences() harus dipanggil di dalam <PreferencesProvider>");
  return ctx;
}

export type { PreferencesContextValue } from "@/contexts/PreferencesContext";
