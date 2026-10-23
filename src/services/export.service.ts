import { api } from "@/utils/api";
import type {
  ExportFormat,
  ExportJob,
  ID,
  RequestExportPayload,
} from "@/types";

const EXTENSION: Record<ExportFormat, string> = {
  json: "json",
  csv: "csv",
  xlsx: "xlsx",
};

/**
 * Authenticated file download — strips any leading `/api` from a job's
 * `downloadUrl` (AxiosKit already prepends the baseURL) and triggers the
 * browser save dialog with a sensible filename.
 */
export async function downloadExportFile(job: ExportJob): Promise<void> {
  if (!job.downloadUrl) {
    throw new Error("Export belum siap di-unduh.");
  }
  // Strip baseURL prefix so AxiosKit's `/api` baseURL doesn't double-stack.
  const url = job.downloadUrl.replace(/^\/api/, "");
  const ext = EXTENSION[job.format] ?? "bin";
  const filename = `monage-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
  await api().download(url, { filename });
}

/**
 * Minta backend membuat file export. Response = `ExportJob` dengan status
 * `queued` / `processing` / `completed`. Saat `completed`, `downloadUrl`
 * langsung bisa di-anchor.
 */
export function requestExport(
  payload: RequestExportPayload,
): Promise<ExportJob> {
  return api().post<ExportJob>("/export", payload);
}

/** Polling status job ekspor. */
export function fetchExportJob(id: ID): Promise<ExportJob> {
  return api().get<ExportJob>(`/export/jobs/${id}`);
}

/**
 * Daftar job export user (riwayat 30 hari terakhir, semua status).
 */
export function fetchExportJobs(): Promise<ExportJob[]> {
  return api().get<ExportJob[]>("/export/jobs");
}
