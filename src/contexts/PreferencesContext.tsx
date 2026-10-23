import { createContext, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  formatCurrency as formatCurrencyUtil,
  formatDate as formatDateUtil,
  type DateFormatVariant,
} from "@/utils/format";
import type { UserPreferences } from "@/types";

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: "IDR",
  dateFormat: "DD/MM/YYYY",
  theme: "light",
  budgetNotification: { enabled: true, warnThreshold: 75, overThreshold: 100 },
};

export interface PreferencesContextValue {
  preferences: UserPreferences;
  update: (patch: Partial<UserPreferences>) => Promise<void>;
  formatCurrency: (amount: number, opts?: { signed?: boolean }) => string;
  formatDate: (iso: string, variant?: DateFormatVariant) => string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { user, updatePreferences } = useAuth();
  const preferences = user?.preferences ?? DEFAULT_PREFERENCES;

  const update = useCallback(
    async (patch: Partial<UserPreferences>) => {
      await updatePreferences(patch);
    },
    [updatePreferences],
  );

  const formatCurrency = useCallback<PreferencesContextValue["formatCurrency"]>(
    (amount, opts) => formatCurrencyUtil(amount, opts),
    [],
  );

  const formatDate = useCallback<PreferencesContextValue["formatDate"]>(
    (iso, variant) => formatDateUtil(iso, variant, preferences.dateFormat),
    [preferences.dateFormat],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, update, formatCurrency, formatDate }),
    [preferences, update, formatCurrency, formatDate],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
