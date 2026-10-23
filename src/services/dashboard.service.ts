import { api } from "@/utils/api";
import type { DashboardSummary } from "@/types";

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return api().get<DashboardSummary>("/dashboard/summary");
}
