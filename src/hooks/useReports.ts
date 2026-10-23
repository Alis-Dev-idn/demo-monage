import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@dep/axios";
import * as reportService from "@/services/report.service";
import type { FetchReportParams } from "@/services/report.service";
import { eventBus } from "@/utils/eventBus";
import type { ReportData } from "@/types";

export interface UseReportsResult {
  data: ReportData | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useReports(params: FetchReportParams): UseReportsResult {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.fetchReport(params);
      setData(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const off = eventBus.on("transaction:changed", () => void load());
    return off;
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
