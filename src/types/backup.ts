import type { ID, ISODate } from "./common";

/** Provider cloud storage yang didukung. */
export type CloudProvider = "google_drive" | "dropbox" | "onedrive";

/**
 * Mode backup otomatis (v1.0). User hanya bisa on/off — jadwal (jam) ditetapkan
 * server secara acak dalam window 00:00–05:00 untuk meratakan beban.
 */
export type AutoBackupMode = "off" | "daily";

export type BackupJobStatus =
  | "queued"
  | "uploading"
  | "completed"
  | "failed";

/**
 * Status koneksi user ke satu provider. Saat connected, server menyimpan
 * refresh token. Frontend TIDAK pernah pegang token Google langsung —
 * semua OAuth callback flow di-handle backend.
 */
export interface BackupConnection {
  provider: CloudProvider;
  /** Akun email yang ter-link (denormalized agar UI cepat). */
  accountEmail: string | null;
  /** Path/folder tujuan di cloud (mis. "Monage/Backups"). */
  folderPath: string | null;
  /** ISO datetime user pertama connect. null = belum connect. */
  connectedAt: ISODate | null;
  /** True jika token sudah expired & butuh re-auth. */
  needsReauth: boolean;
}

/**
 * Konfigurasi backup user. Hanya 1 config per user (tidak per pembukuan
 * — backup selalu mencakup semua data). Auto-backup butuh plan minimal
 * `personal` (lihat `SubscriptionPlan.autoBackupEnabled`).
 */
export interface BackupConfig {
  /** Provider yang dipilih sebagai destinasi default. null = belum dipilih. */
  defaultProvider: CloudProvider | null;
  /** Daftar provider yang terhubung. */
  connections: BackupConnection[];
  /** Kontrol backup otomatis (on/off). `off` saat plan tidak support / dimatikan. */
  autoBackup: AutoBackupMode;
  /**
   * Slot menit dalam window 00:00–05:00 (0..299) yang ditetapkan server, atau
   * null bila auto-backup belum pernah diaktifkan. Read-only bagi FE.
   */
  scheduleSlot: number | null;
  /** Derivasi siap-tampil dari slot, mis. "01:23" (waktu lokal server), atau null. */
  scheduledTimeLabel: string | null;
  /** Label window untuk teks UI, mis. "00:00–05:00". */
  windowLabel: string;
  /** Berapa banyak backup terakhir disimpan; selebihnya di-prune otomatis. */
  retentionCount: number;
  /** Email user saat notifikasi backup berhasil/gagal. */
  notifyEmail: boolean;
  /**
   * Per-provider integration status. `isStub: true` artinya server belum
   * dikonfigurasi dengan OAuth credentials asli — Connect cuma akan
   * mengaitkan akun dummy `stub-…@example.com`. FE menampilkan banner
   * peringatan dan tetap mengizinkan flow demo.
   */
  providerStatus?: Record<CloudProvider, { isStub: boolean }>;
}

/**
 * Satu eksekusi backup (manual atau auto). FE polling `/backup/jobs/:id`
 * sampai status final.
 */
export interface BackupJob {
  _id: ID;
  provider: CloudProvider;
  trigger: "manual" | "scheduled";
  status: BackupJobStatus;
  startedAt: ISODate;
  completedAt: ISODate | null;
  /** URL file di cloud user (untuk pemilik file, butuh auth provider). */
  cloudFileUrl: string | null;
  /** Path lengkap di provider (mis. "Monage/Backups/2026-05-22T02-00-00.json"). */
  cloudPath: string | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
}

/**
 * Hasil mulai OAuth flow. Frontend buka `authorizeUrl` di tab/window baru;
 * backend handle callback dan emit event saat selesai (atau frontend polling
 * `/backup/connections` setelah window close).
 */
export interface OAuthStartResponse {
  provider: CloudProvider;
  /** URL untuk redirect user ke consent screen provider. */
  authorizeUrl: string;
  /** State token (CSRF). Backend verify di callback. */
  state: string;
}

/** Satu file backup di cloud (untuk restore-from-cloud). */
export interface CloudFileItem {
  fileId: string;
  name: string;
  createdAt: string;
}
