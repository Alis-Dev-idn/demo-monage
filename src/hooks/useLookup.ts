import { useContext, useMemo } from "react";
import { LookupContext, type LookupContextValue } from "@/contexts/LookupContext";
import type { Account, Category, CategoryKind, ID, Saving } from "@/types";

export function useLookup(): LookupContextValue {
  const ctx = useContext(LookupContext);
  if (!ctx) throw new Error("useLookup() harus dipanggil di dalam <LookupProvider>");
  return ctx;
}

export function useAccountById(id: ID | null | undefined): Account | undefined {
  const { accounts } = useLookup();
  return useMemo(() => accounts.find((a) => a._id === id), [accounts, id]);
}

export function useCategoryById(id: ID | null | undefined): Category | undefined {
  const { categories } = useLookup();
  return useMemo(() => categories.find((c) => c._id === id), [categories, id]);
}

export function useSavingById(id: ID | null | undefined): Saving | undefined {
  const { savings } = useLookup();
  return useMemo(() => savings.find((s) => s._id === id), [savings, id]);
}

export function useCategoriesByKind(kind: CategoryKind): Category[] {
  const { categories } = useLookup();
  return useMemo(
    () => categories.filter((c) => c.kind === kind).sort((a, b) => a.order - b.order),
    [categories, kind],
  );
}
