import { api } from "@/utils/api";
import type {
  BackupConfig,
  BackupConnection,
  BackupJob,
  CloudFileItem,
  CloudProvider,
  ID,
  OAuthStartResponse,
} from "@/types";
import type { RestoreSummary } from "./restore.service";

/** Konfigurasi backup user (frekuensi, retensi, koneksi). */
export function fetchBackupConfig(): Promise<BackupConfig> {
  return api().get<BackupConfig>("/backup/config");
}

export type UpdateBackupConfigPayload = Partial<
  Pick<
    BackupConfig,
    "defaultProvider" | "autoBackup" | "retentionCount" | "notifyEmail"
  >
>;

export function updateBackupConfig(
  payload: UpdateBackupConfigPayload,
): Promise<BackupConfig> {
  // Server-assigned fields (scheduleSlot/scheduledTimeLabel/windowLabel) tidak
  // pernah dikirim balik — whitelist eksplisit menjaga payload bersih.
  const body: UpdateBackupConfigPayload = {};
  if ("defaultProvider" in payload) body.defaultProvider = payload.defaultProvider;
  if ("autoBackup" in payload) body.autoBackup = payload.autoBackup;
  if ("retentionCount" in payload) body.retentionCount = payload.retentionCount;
  if ("notifyEmail" in payload) body.notifyEmail = payload.notifyEmail;
  return api().patch<BackupConfig>("/backup/config", body);
}

/**
 * Mulai OAuth flow ke provider. Server return `authorizeUrl` — FE wajib
 * buka di tab baru / popup. Setelah user selesai, server menyimpan token
 * di server-side; FE refetch `/backup/config` untuk sync state.
 */
export function startProviderOAuth(
  provider: CloudProvider,
  redirectUri?: string,
): Promise<OAuthStartResponse> {
  return api().post<OAuthStartResponse>("/backup/oauth/start", {
    provider,
    redirectUri,
  });
}

/** Putus koneksi dengan provider — revoke refresh token di sisi server. */
export function disconnectProvider(
  provider: CloudProvider,
): Promise<BackupConnection> {
  return api().delete<BackupConnection>(
    `/backup/connections/${provider}`,
  );
}

/**
 * Trigger backup manual sekarang. Response = `BackupJob` dengan status
 * `queued`/`uploading`. FE polling `/backup/jobs/:id`.
 */
export function triggerBackupNow(provider: CloudProvider): Promise<BackupJob> {
  return api().post<BackupJob>("/backup/run", { provider });
}

export function fetchBackupJobs(): Promise<BackupJob[]> {
  return api().get<BackupJob[]>("/backup/jobs");
}

// ── Restore dari cloud (v1.7) ───────────────────────────────────────
/** Daftar file backup di cloud provider (terbaru dulu). */
export function listCloudFiles(provider: CloudProvider): Promise<CloudFileItem[]> {
  return api().get<CloudFileItem[]>("/backup/files", { params: { provider } });
}

/** Restore (atau preview `dry-run`) sebuah file backup cloud ke pembukuan tujuan. */
export function restoreFromCloud(args: {
  provider: CloudProvider;
  fileId: string;
  mode: "merge" | "dry-run";
  targetBookId?: ID;
  bookLabelPrefix?: string;
}): Promise<RestoreSummary> {
  return api().post<RestoreSummary>("/backup/restore-from-cloud", args);
}

export function fetchBackupJob(id: ID): Promise<BackupJob> {
  return api().get<BackupJob>(`/backup/jobs/${id}`);
}
