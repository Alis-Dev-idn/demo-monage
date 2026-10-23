import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@dep/axios";
import * as dashboardService from "@/services/dashboard.service";
import { eventBus } from "@/utils/eventBus";
import type { DashboardSummary } from "@/types";

export interface UseDashboardResult {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.fetchDashboardSummary();
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const offTx = eventBus.on("transaction:changed", () => void load());
    const offAcc = eventBus.on("account:changed", () => void load());
    return () => {
      offTx();
      offAcc();
    };
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
