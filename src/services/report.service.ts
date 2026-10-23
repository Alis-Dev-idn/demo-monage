import { api } from "@/utils/api";
import type { ReportData } from "@/types";

export interface FetchReportParams {
  from: string;
  to: string;
  groupBy?: "day" | "month";
  [key: string]: unknown;
}

export function fetchReport(params: FetchReportParams): Promise<ReportData> {
  return api().get<ReportData>("/reports", { params });
}

export interface ExportReportXlsxParams {
  from: string;
  to: string;
  groupBy?: "day" | "month";
  /** YYYY-MM — when both are set the BE adds a "Perbandingan Anggaran" sheet. */
  comparisonFrom?: string;
  comparisonTo?: string;
  [key: string]: unknown;
}

/**
 * Stream the Reports page as a multi-sheet Excel workbook from the BE. The
 * server uses ExcelJS's streaming writer so memory stays flat even for users
 * with tens of thousands of transactions.
 *
 * Params are encoded into the URL query string because `DownloadOptions`
 * doesn't carry a `params` field — the equivalent `api().get(url, {params})`
 * shape doesn't apply to the blob-typed download path.
 */
export async function exportReportXlsx(
  params: ExportReportXlsxParams,
  filename: string,
): Promise<void> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    qs.append(k, String(v));
  }
  const url = `/reports/export?${qs.toString()}`;
  await api().download(url, { filename });
}
