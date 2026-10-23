import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@dep/axios";
import * as accountService from "@/services/account.service";
import * as categoryService from "@/services/category.service";
import * as savingService from "@/services/saving.service";
import { eventBus } from "@/utils/eventBus";
import { useAuth } from "@/hooks/useAuth";
import type { Account, Category, Saving } from "@/types";

export interface LookupContextValue {
  accounts: Account[];
  categories: Category[];
  savings: Saving[];
  isLoading: boolean;
  error: ApiError | null;
  refetchAccounts: () => Promise<void>;
  refetchCategories: () => Promise<void>;
  refetchSavings: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const LookupContext = createContext<LookupContextValue | null>(null);

interface LookupProviderProps {
  children: ReactNode;
}

export function LookupProvider({ children }: LookupProviderProps) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAccounts = useCallback(async () => {
    const data = await accountService.fetchAccounts();
    setAccounts(data);
  }, []);

  const fetchCategories = useCallback(async () => {
    const data = await categoryService.fetchCategories();
    setCategories(data);
  }, []);

  const fetchSavings = useCallback(async () => {
    const data = await savingService.fetchSavings();
    setSavings(data);
  }, []);

  const refetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAccounts(), fetchCategories(), fetchSavings()]);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchAccounts, fetchCategories, fetchSavings]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccounts([]);
      setCategories([]);
      setSavings([]);
      return;
    }
    void refetchAll();
  }, [isAuthenticated, isBootstrapping, refetchAll]);

  useEffect(() => {
    const offAcc = eventBus.on("account:changed", () => void fetchAccounts().catch(() => {}));
    const offCat = eventBus.on("category:changed", () => void fetchCategories().catch(() => {}));
    const offTx = eventBus.on("transaction:changed", () => {
      // saldo akun berubah saat transaksi CRUD; setor/tarik tabungan juga.
      void fetchAccounts().catch(() => {});
      void fetchSavings().catch(() => {});
    });
    return () => {
      offAcc();
      offCat();
      offTx();
    };
  }, [fetchAccounts, fetchCategories, fetchSavings]);

  const value = useMemo<LookupContextValue>(
    () => ({
      accounts,
      categories,
      savings,
      isLoading,
      error,
      refetchAccounts: fetchAccounts,
      refetchCategories: fetchCategories,
      refetchSavings: fetchSavings,
      refetchAll,
    }),
    [accounts, categories, savings, isLoading, error, fetchAccounts, fetchCategories, fetchSavings, refetchAll],
  );

  return <LookupContext.Provider value={value}>{children}</LookupContext.Provider>;
}
