import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  Download,
  LogOut,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@dep/ui/button";
import { Section, InfoBox } from "@dep/ui/card";
import { Input, RadioGroup } from "@dep/ui/form";
import { confirm, prompt } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { useLookup } from "@/hooks/useLookup";
import { useSubscription } from "@/hooks/useSubscription";
import { Switch } from "@/components/common/Switch";
import { ExportDataModal } from "@/components/settings/ExportDataModal";
import { RestoreDataModal } from "@/components/settings/RestoreDataModal";
import { BackupSection } from "@/components/settings/BackupSection";
import * as authService from "@/services/auth.service";
import type { UserPreferences } from "@/types";

const DATE_FORMATS: Array<{ value: UserPreferences["dateFormat"]; label: string }> = [
  { value: "DD/MM/YYYY", label: "21/05/2026" },
  { value: "MM/DD/YYYY", label: "05/21/2026" },
  { value: "YYYY-MM-DD", label: "2026-05-21" },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { preferences, update } = usePreferences();
  const { accounts, categories } = useLookup();
  const { currentPlan } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const updatePref = async (patch: Partial<UserPreferences>) => {
    try {
      await update(patch);
      notify.success("Pengaturan disimpan ✓");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal menyimpan preferensi.");
    }
  };

  // ── Draft lokal untuk field numerik anggaran ──────────────────────────
  // Sebelumnya tiap keystroke langsung hit API → susah ketik "25" (ke-save di
  // angka "2" dulu). Sekarang user ketik bebas, simpan eksplisit lewat tombol.
  const [cycleDraft, setCycleDraft] = useState(preferences.budgetCycleStartDay ?? 1);
  const [warnDraft, setWarnDraft] = useState(preferences.budgetNotification.warnThreshold);
  const [overDraft, setOverDraft] = useState(preferences.budgetNotification.overThreshold);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCycleDraft(preferences.budgetCycleStartDay ?? 1);
  }, [preferences.budgetCycleStartDay]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWarnDraft(preferences.budgetNotification.warnThreshold);
    setOverDraft(preferences.budgetNotification.overThreshold);
  }, [preferences.budgetNotification.warnThreshold, preferences.budgetNotification.overThreshold]);

  const cycleDirty = cycleDraft !== (preferences.budgetCycleStartDay ?? 1);
  const thresholdDirty =
    warnDraft !== preferences.budgetNotification.warnThreshold ||
    overDraft !== preferences.budgetNotification.overThreshold;

  const saveCycle = () => {
    const clamped = Math.max(1, Math.min(28, cycleDraft || 1));
    void updatePref({ budgetCycleStartDay: clamped });
  };
  const saveThresholds = () => {
    void updatePref({
      budgetNotification: {
        ...preferences.budgetNotification,
        warnThreshold: Math.max(1, Math.min(200, warnDraft || 0)),
        overThreshold: Math.max(1, Math.min(300, overDraft || 0)),
      },
    });
  };

  // Quick FE-only export (fallback ringan jika API down) — sekarang utama via modal.
  const handleQuickExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      accounts,
      categories,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monage-quick-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Quick export berhasil ✓");
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Keluar dari Monage?",
      message: "Anda harus login lagi untuk mengakses data.",
      confirmLabel: "Keluar",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    await logout();
    navigate("/auth", { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const typed = await prompt({
      title: "Hapus akun permanen?",
      message: `Ketik email Anda (${user.email}) untuk konfirmasi. Tindakan ini tidak bisa dibatalkan.`,
      placeholder: user.email,
      confirmLabel: "Hapus Akun",
      cancelLabel: "Batal",
    });
    if (!typed || typed !== user.email) {
      if (typed) notify.warning("Email tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      await notify.promise(authService.deleteAccount(typed), {
        loading: "Menghapus akun…",
        success: "Akun dihapus ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menghapus."),
      });
      await logout();
      navigate("/auth", { replace: true });
    } catch {
      // surfaced via notify
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Pengaturan</h1>
        <p className="text-sm text-neutral-500">
          Sesuaikan tampilan, notifikasi, dan akun Anda.
        </p>
      </header>

      <Section title="Akun" icon={<UserIcon size={16} />}>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">{user?.name}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/settings/profile")}
            >
              Edit Profil
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Langganan" icon={<Sparkles size={16} />}>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">
                Paket {currentPlan?.name ?? "—"}
              </p>
              <p className="text-xs text-neutral-500">
                Atur paket, lihat penggunaan kuota, dan upgrade kapan saja.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/settings/subscription")}
            >
              Kelola
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Tampilan" icon={<Calendar size={16} />}>
        <div className="space-y-3 p-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Format Tanggal
            </p>
            <RadioGroup
              name="dateFormat"
              value={preferences.dateFormat}
              onChange={(v) =>
                void updatePref({ dateFormat: v as UserPreferences["dateFormat"] })
              }
              options={DATE_FORMATS}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3 text-sm">
            <span className="text-neutral-600">Mata Uang</span>
            <span className="font-medium text-neutral-800">Rupiah (IDR)</span>
          </div>
        </div>
      </Section>

      <Section title="Siklus Anggaran" icon={<Calendar size={16} />}>
        <div className="space-y-2 p-3">
          <p className="text-xs text-neutral-500">
            Tanggal mulai setiap siklus anggaran (1-28). Mis. tanggal 25 cocok
            untuk yang gajian tanggal 25 — anggaran reset di tanggal tsb.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="number"
              min={1}
              max={28}
              value={cycleDraft}
              onChange={(e) => setCycleDraft(Number(e.target.value) || 0)}
              className="max-w-[100px]"
            />
            <span className="text-sm text-neutral-600">
              setiap bulan (default: 1)
            </span>
            <Button
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={saveCycle}
              disabled={!cycleDirty}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Notifikasi Anggaran" icon={<Bell size={16} />}>
        <div className="space-y-3 p-3">
          <Switch
            checked={preferences.budgetNotification.enabled}
            onChange={(v) =>
              void updatePref({
                budgetNotification: { ...preferences.budgetNotification, enabled: v },
              })
            }
            label="Aktifkan peringatan anggaran"
            description="Dapat notifikasi saat pengeluaran kategori mendekati / melewati anggaran."
          />
          {preferences.budgetNotification.enabled && (
            <div className="space-y-3 rounded-lg bg-neutral-50 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Peringatan (%)</p>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={warnDraft}
                    onChange={(e) => setWarnDraft(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Bahaya (%)</p>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={overDraft}
                    onChange={(e) => setOverDraft(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  leftIcon={<Save size={14} />}
                  onClick={saveThresholds}
                  disabled={!thresholdDirty}
                >
                  Simpan Ambang
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <BackupSection />

      <Section title="Export & Restore Data" icon={<Download size={16} />}>
        <div className="space-y-2 p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              leftIcon={<Download size={14} />}
              onClick={() => setExportOpen(true)}
            >
              Export Detail
            </Button>
            <Button
              variant="outline"
              leftIcon={<Upload size={14} />}
              onClick={() => setRestoreOpen(true)}
            >
              Restore dari JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickExport}
            >
              Quick Export (profil + dompet)
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            <strong>Export Detail</strong> via API — pilih format (JSON / Excel /
            CSV) & data yang ingin disertakan (transaksi, anggaran, tabungan,
            laporan). <strong>Restore</strong> menerima file JSON hasil export
            atau backup cloud — membuat <em>pembukuan baru</em> tanpa menimpa data
            lama. <strong>Quick Export</strong> = backup ringan client-side.
          </p>
        </div>
      </Section>

      <Section title="Zona Berbahaya" icon={<Trash2 size={16} />}>
        <div className="space-y-3 p-3">
          <Button
            variant="outline"
            leftIcon={<LogOut size={14} />}
            onClick={() => void handleLogout()}
          >
            Keluar
          </Button>
          <InfoBox
            variant="error"
            title="Hapus Akun"
            description="Semua data Anda — dompet, kategori, transaksi, anggaran — akan dihapus permanen."
            action={{
              label: "Hapus Akun",
              onClick: () => void handleDeleteAccount(),
            }}
          />
          {busy && (
            <p className="text-xs text-neutral-500">Memproses penghapusan…</p>
          )}
        </div>
      </Section>

      <ExportDataModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <RestoreDataModal isOpen={restoreOpen} onClose={() => setRestoreOpen(false)} />
    </div>
  );
};

export default SettingsPage;
