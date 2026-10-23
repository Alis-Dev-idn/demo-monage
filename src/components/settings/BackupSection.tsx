import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudOff,
  HardDriveUpload,
  Link2,
  Link2Off,
  Loader2,
  Lock,
  Sparkles,
  Unlink,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { Section, InfoBox } from "@dep/ui/card";
import { FormField, Input} from "@dep/ui/form";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as backupService from "@/services/backup.service";
import { CloudRestoreModal } from "@/components/settings/CloudRestoreModal";
import { useSubscription } from "@/hooks/useSubscription";
import type {
  BackupConfig,
  BackupJob,
  CloudProvider,
} from "@/types";

const PROVIDER_META: Record<
  CloudProvider,
  { label: string; iconColor: string }
> = {
  google_drive: { label: "Google Drive", iconColor: "text-yellow-600" },
  dropbox: { label: "Dropbox", iconColor: "text-blue-600" },
  onedrive: { label: "OneDrive", iconColor: "text-sky-600" },
};

export function BackupSection() {
  const navigate = useNavigate();
  const { currentPlan } = useSubscription();
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [restoreProvider, setRestoreProvider] = useState<CloudProvider | null>(null);
  const popupRef = useRef<Window | null>(null);

  const load = useCallback(async () => {
    try {
      const [cfg, hist] = await Promise.all([
        backupService.fetchBackupConfig(),
        backupService.fetchBackupJobs(),
      ]);
      setConfig(cfg);
      setJobs(hist);
    } catch (err) {
      if (err instanceof ApiError) notify.error(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const autoBackupEnabled = currentPlan?.autoBackupEnabled ?? false;

  const handleConnect = async (provider: CloudProvider) => {
    setBusy(provider);
    try {
      const { authorizeUrl } = await backupService.startProviderOAuth(provider);

      // Buka popup OAuth provider.
      popupRef.current = window.open(
        authorizeUrl,
        "monage-oauth",
        "width=520,height=640,scrollbars=yes",
      );

      // Listener untuk `postMessage` dari `/api/backup/oauth/callback`
      // (backend render HTML kecil yang `window.opener.postMessage(...)`).
      // Pattern ini kompat dengan provider real (Google/Dropbox/OneDrive)
      // yang popup-nya cross-origin — `window.closed` polling unreliable.
      let closeTimer: number | null = null;
      const cleanup = () => {
        window.removeEventListener("message", handler);
        if (closeTimer !== null) window.clearInterval(closeTimer);
      };

      const handler = (event: MessageEvent) => {
        // Backend pakai `targetOrigin = FRONTEND_URL` jadi sumber message
        // selalu sama-origin dengan FE (lewat Vite proxy di dev, reverse
        // proxy di prod). Filter origin untuk mencegah spoofing.
        if (event.origin !== window.location.origin) return;
        const data = event.data as
          | {
              type?: string;
              ok?: boolean;
              provider?: CloudProvider;
              error?: string;
            }
          | undefined;
        if (!data || data.type !== "monage:oauth-backup") return;
        cleanup();
        try {
          popupRef.current?.close();
        } catch {
          /* popup may already be closed */
        }
        popupRef.current = null;
        if (data.ok) {
          notify.success(`${PROVIDER_META[provider].label} terhubung ✓`);
          void load();
        } else {
          notify.error(data.error ?? "OAuth gagal.");
        }
      };

      // Fallback: kalau user menutup popup tanpa selesai (cancel di
      // consent screen), bersihkan listener supaya tidak bocor.
      closeTimer = window.setInterval(() => {
        if (popupRef.current?.closed) {
          cleanup();
          popupRef.current = null;
        }
      }, 1000);

      window.addEventListener("message", handler);
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal connect.");
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async (provider: CloudProvider) => {
    const ok = await confirm({
      title: `Putus ${PROVIDER_META[provider].label}?`,
      message: "Backup otomatis akan berhenti. File lama di cloud tidak dihapus.",
      confirmLabel: "Putus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    setBusy(provider);
    try {
      await notify.promise(backupService.disconnectProvider(provider), {
        loading: "Memutus koneksi…",
        success: "Terputus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      await load();
    } catch {
      // surfaced
    } finally {
      setBusy(null);
    }
  };

  const handleBackupNow = async (provider: CloudProvider) => {
    setBusy(`run-${provider}`);
    try {
      const job = await backupService.triggerBackupNow(provider);
      notify.success("Backup dimulai…");
      // Polling sampai selesai
      const poll = window.setInterval(async () => {
        try {
          const updated = await backupService.fetchBackupJob(job._id);
          setJobs((prev) => {
            const others = prev.filter((j) => j._id !== updated._id);
            return [updated, ...others];
          });
          if (updated.status === "completed") {
            window.clearInterval(poll);
            notify.success(`Backup tersimpan di ${PROVIDER_META[provider].label} ✓`);
          } else if (updated.status === "failed") {
            window.clearInterval(poll);
            notify.error(updated.errorMessage ?? "Backup gagal.");
          }
        } catch {
          // try again
        }
      }, 1000);
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal backup.");
    } finally {
      setBusy(null);
    }
  };

  const updateConfig = async (patch: Partial<BackupConfig>) => {
    try {
      const updated = await backupService.updateBackupConfig(patch);
      setConfig(updated);
      notify.success("Pengaturan backup disimpan ✓");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal simpan.");
    }
  };

  if (!config) {
    return (
      <Section title="Backup ke Cloud" icon={<Cloud size={16} />}>
        <p className="p-4 text-sm text-neutral-500">Memuat…</p>
      </Section>
    );
  }

  const connectedProviders = config.connections.filter((c) => c.connectedAt);

  // Hanya tampilkan provider yang OAuth-nya benar-benar dikonfigurasi di server
  // (punya client id/secret via env → `isStub: false`). Provider tanpa API key
  // disembunyikan supaya user tidak ketemu flow "akun palsu". Lihat #17.
  const allProviders: CloudProvider[] = ["google_drive", "dropbox", "onedrive"];
  const availableProviders = allProviders.filter(
    (p) => config.providerStatus?.[p] && !config.providerStatus[p].isStub,
  );

  return (
    <Section title="Backup ke Cloud" icon={<Cloud size={16} />}>
      <div className="space-y-4 p-3">
        <p className="text-xs text-neutral-500">
          Simpan salinan otomatis ke layanan cloud Anda. Frequency otomatis butuh
          paket minimal <strong>Personal</strong>; backup manual tersedia untuk
          semua paket.
        </p>

        {availableProviders.length === 0 && (
          <InfoBox
            variant="warning"
            title="Belum ada layanan cloud yang dikonfigurasi"
            description="Server belum punya OAuth credentials. Isi env provider di backend (mis. GOOGLE_DRIVE_CLIENT_ID / _SECRET / _REDIRECT_URI) untuk mengaktifkan backup cloud — lihat docs/integration/CLOUD-BACKUP-OAUTH.md."
          />
        )}

        {/* Provider connections — hanya yang terkonfigurasi di server */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Layanan Tersedia
          </p>
          {availableProviders.map((p) => {
            const conn = config.connections.find((c) => c.provider === p);
            const meta = PROVIDER_META[p];
            const isConnected = !!conn?.connectedAt;
            return (
              <div
                key={p}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2"
              >
                <Cloud size={20} className={meta.iconColor} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{meta.label}</p>
                  {isConnected ? (
                    <p className="text-xs text-neutral-500">
                      Terhubung sebagai <code className="rounded bg-neutral-100 px-1">{conn.accountEmail}</code>
                      {" · folder "} <code className="rounded bg-neutral-100 px-1">{conn.folderPath}</code>
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500">Belum terhubung.</p>
                  )}
                </div>
                {isConnected ? (
                  <>
                    <Button
                      size="sm"
                      leftIcon={<HardDriveUpload size={12} />}
                      onClick={() => void handleBackupNow(p)}
                      isLoading={busy === `run-${p}`}
                    >
                      Backup Sekarang
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<CloudDownload size={12} />}
                      onClick={() => setRestoreProvider(p)}
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Unlink size={12} />}
                      onClick={() => void handleDisconnect(p)}
                      isLoading={busy === p}
                    >
                      Putus
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    leftIcon={<Link2 size={12} />}
                    onClick={() => void handleConnect(p)}
                    isLoading={busy === p}
                  >
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Auto-backup config */}
        {connectedProviders.length > 0 && (
          <div className="space-y-3 rounded-xl border border-neutral-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-neutral-800">
                Backup Otomatis Harian
              </p>
              {!autoBackupEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <Lock size={10} /> Butuh paket Personal+
                </span>
              )}
            </div>

            {!autoBackupEnabled ? (
              <InfoBox
                variant="warning"
                title="Paket Anda hanya support backup manual"
                description="Upgrade ke Personal atau Premium untuk mengaktifkan backup otomatis harian."
                action={{
                  label: "Lihat Paket",
                  onClick: () => navigate("/dashboard/settings/subscription"),
                }}
              />
            ) : (
              <>
                {/* Toggle on/off — satu-satunya kontrol jadwal */}
                <label className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2">
                  <span className="text-sm text-neutral-700">
                    Aktifkan backup otomatis setiap hari
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={config.autoBackup === "daily"}
                    onChange={(e) =>
                      void updateConfig({
                        autoBackup: e.target.checked ? "daily" : "off",
                      })
                    }
                  />
                </label>

                {config.autoBackup === "daily" && (
                  <div className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                    <Zap size={14} className="mt-0.5 flex-shrink-0" />
                    <p>
                      Backup berjalan otomatis tiap malam pada jam acak antara{" "}
                      <strong>{config.windowLabel}</strong> (waktu server)
                      {config.scheduledTimeLabel
                        ? <>. Jadwal Anda: sekitar <strong>{config.scheduledTimeLabel}</strong>.</>
                        : "."}{" "}
                      Jam dipilih otomatis untuk meratakan beban — tidak dapat
                      diubah manual.
                    </p>
                  </div>
                )}

                <FormField label="Simpan N backup terakhir">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={config.retentionCount}
                    onChange={(e) =>
                      void updateConfig({
                        retentionCount: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                      })
                    }
                  />
                </FormField>
                <p className="text-xs text-neutral-500">
                  Provider default untuk auto-backup:{" "}
                  <strong>
                    {config.defaultProvider
                      ? PROVIDER_META[config.defaultProvider].label
                      : "—"}
                  </strong>
                </p>
              </>
            )}
          </div>
        )}

        {/* Backup history */}
        {jobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Riwayat Backup
            </p>
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
              {jobs.slice(0, 8).map((job) => (
                <li key={job._id} className="flex items-center gap-3 px-3 py-2">
                  {job.status === "completed" ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : job.status === "failed" ? (
                    <CloudOff size={16} className="text-rose-600" />
                  ) : (
                    <Loader2 size={16} className="animate-spin text-amber-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-800">
                      {PROVIDER_META[job.provider].label}
                      {" · "}
                      <span className="text-xs text-neutral-500">{job.trigger === "manual" ? "manual" : "terjadwal"}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {new Date(job.startedAt).toLocaleString("id-ID")}
                      {job.fileSizeBytes !== null &&
                        ` · ${(job.fileSizeBytes / 1024).toFixed(1)} KB`}
                      {job.cloudPath && ` · ${job.cloudPath}`}
                    </p>
                  </div>
                  {job.status === "failed" && (
                    <span className="text-xs text-rose-600">{job.errorMessage}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {connectedProviders.length === 0 && (
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
            <Sparkles size={18} className="text-emerald-600" />
            <p>
              Hubungkan setidaknya satu layanan cloud untuk mulai backup &amp; restore.
              Token tersimpan aman di server Monage; Anda bisa putus kapan saja.
            </p>
          </div>
        )}
      </div>

      {restoreProvider && (
        <CloudRestoreModal
          isOpen={!!restoreProvider}
          provider={restoreProvider}
          providerLabel={PROVIDER_META[restoreProvider].label}
          onClose={() => setRestoreProvider(null)}
        />
      )}
    </Section>
  );
}

// Re-export biar tidak unused-imports
export type { BackupConfig };
export { Zap, Link2Off };
