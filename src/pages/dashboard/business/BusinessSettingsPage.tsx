import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, ImagePlus, KeyRound, Store, Trash2, UserPlus, X } from "lucide-react";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { confirm } from "@dep/ui/confirm";
import { Button } from "@dep/ui/button";
import { FormField, Input, Textarea } from "@dep/ui/form";
import { Switch } from "@/components/common/Switch";
import { AccountSelect } from "@/components/accounts/AccountSelect";
import {
  createCashier,
  deleteBusinessLogo,
  deleteCashier,
  fetchBusinessSettings,
  fetchCashiers,
  resetCashierPin,
  updateBusinessSettings,
  uploadBusinessLogo,
  type Cashier,
} from "@/services/business.service";
import type { BusinessSettings, ID } from "@/types";

const BusinessSettingsPage = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [tax, setTax] = useState("0");
  const [savingMeta, setSavingMeta] = useState(false);

  // Storefront mandiri (#C2)
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [storeAccountId, setStoreAccountId] = useState<ID | null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Kasir
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [cName, setCName] = useState("");
  const [cUser, setCUser] = useState("");
  const [cPin, setCPin] = useState("");
  const [savingCashier, setSavingCashier] = useState(false);

  const loadCashiers = useCallback(async () => {
    try {
      setCashiers(await fetchCashiers());
    } catch {
      /* abaikan — non-kritis */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const s = await fetchBusinessSettings();
      setSettings(s);
      setHeader(s.receiptHeader ?? "");
      setFooter(s.receiptFooter ?? "");
      setTax(String(s.taxPercent));
      setStoreEnabled(s.storefrontEnabled);
      setStoreAccountId((s.storefrontAccountId as ID) ?? null);
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal memuat pengaturan.");
    }
  }, []);

  useEffect(() => {
    void load();
    void loadCashiers();
  }, [load, loadCashiers]);

  const addCashier = async () => {
    if (!cName.trim() || !cUser.trim() || !cPin.trim()) {
      return notify.warning("Nama, username, dan PIN wajib diisi.");
    }
    if (!/^\d{4,12}$/.test(cPin)) return notify.warning("PIN harus 4–12 digit angka.");
    setSavingCashier(true);
    try {
      await createCashier({ name: cName.trim(), username: cUser.trim(), pin: cPin });
      notify.success("Kasir dibuat.");
      setCName("");
      setCUser("");
      setCPin("");
      void loadCashiers();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal membuat kasir.");
    } finally {
      setSavingCashier(false);
    }
  };
  const removeCashier = async (c: Cashier) => {
    const ok = await confirm({
      title: `Hapus kasir "${c.name}"?`,
      message: "Akun kasir tidak bisa login lagi.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    try {
      await deleteCashier(c.userId);
      notify.success("Kasir dihapus.");
      void loadCashiers();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    }
  };
  const changePin = async (c: Cashier) => {
    const pin = window.prompt(`PIN baru untuk ${c.name} (4–12 digit):`);
    if (!pin) return;
    if (!/^\d{4,12}$/.test(pin)) return notify.error("PIN harus 4–12 digit angka.");
    try {
      await resetCashierPin(c.userId, pin);
      notify.success("PIN diperbarui.");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    }
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      await updateBusinessSettings({
        receiptHeader: header.trim() || null,
        receiptFooter: footer.trim() || null,
        taxPercent: Number(tax) || 0,
      });
      notify.success("Pengaturan disimpan.");
      void load();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setSavingMeta(false);
    }
  };

  const saveStorefront = async () => {
    if (storeEnabled && !storeAccountId) {
      return notify.warning("Pilih dompet tujuan untuk order mandiri.");
    }
    setSavingStore(true);
    try {
      await updateBusinessSettings({
        storefrontEnabled: storeEnabled,
        storefrontAccountId: storeAccountId,
      });
      notify.success("Pengaturan toko mandiri disimpan.");
      void load();
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setSavingStore(false);
    }
  };

  const onPickLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      return notify.error("Format logo harus JPEG, PNG, atau WebP.");
    }
    setUploadingLogo(true);
    try {
      const s = await uploadBusinessLogo(file);
      setSettings(s);
      notify.success("Logo bisnis disimpan.");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal mengunggah logo.");
    } finally {
      setUploadingLogo(false);
    }
  };
  const onRemoveLogo = async () => {
    setUploadingLogo(true);
    try {
      const s = await deleteBusinessLogo();
      setSettings(s);
      notify.success("Logo dihapus.");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const storeUrl = settings ? `${location.origin}/store/${settings.bookId}` : "";
  const copyStoreUrl = () => {
    void navigator.clipboard?.writeText(storeUrl);
    notify.success("Link toko disalin.");
  };

  return (
    <div className="max-w-2xl space-y-6 p-4 pb-20 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Pengaturan Bisnis</h1>
        <p className="text-sm text-neutral-500">Struk, pajak, toko mandiri, dan kasir.</p>
      </header>

      {/* Logo bisnis (#I) — tampil di struk & storefront. */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Logo Bisnis</h2>
        <p className="text-xs text-neutral-500">Tampil di struk dan halaman toko mandiri.</p>
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <div className="relative">
              <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg border border-neutral-200 object-contain" />
              <button
                type="button"
                onClick={() => void onRemoveLogo()}
                aria-label="Hapus logo"
                disabled={uploadingLogo}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-300">
              <Store size={22} />
            </span>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            <ImagePlus size={14} />
            {uploadingLogo ? "Mengunggah…" : settings?.logoUrl ? "Ganti" : "Pilih logo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploadingLogo}
              onChange={(e) => void onPickLogo(e.target.files?.[0])}
            />
          </label>
        </div>
      </section>

      {/* Kasir (#1/#2) — akun POS dibuat admin, login username + PIN. */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Kasir</h2>
        <p className="text-xs text-neutral-500">
          Buat akun kasir (username + PIN). Kasir login lewat menu "Masuk sebagai
          Kasir" dan hanya bisa transaksi (POS) + lihat produk.
        </p>
        {cashiers.length > 0 && (
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {cashiers.map((c) => (
              <div key={c.userId} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-neutral-900">{c.name}</div>
                  <div className="text-xs text-neutral-500">@{c.username}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" leftIcon={<KeyRound size={12} />} onClick={() => void changePin(c)}>
                    PIN
                  </Button>
                  <button
                    type="button"
                    aria-label="Hapus kasir"
                    onClick={() => void removeCashier(c)}
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="Nama kasir" value={cName} onChange={(e) => setCName(e.target.value)} />
          <Input placeholder="username" value={cUser} onChange={(e) => setCUser(e.target.value)} />
          <Input placeholder="PIN (4–12 digit)" value={cPin} onChange={(e) => setCPin(e.target.value)} inputMode="numeric" />
        </div>
        <Button leftIcon={<UserPlus size={14} />} isLoading={savingCashier} onClick={() => void addCashier()}>
          Tambah Kasir
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Struk & Pajak</h2>
        <FormField label="Header struk">
          <Textarea rows={2} value={header} onChange={(e) => setHeader(e.target.value)} />
        </FormField>
        <FormField label="Footer struk">
          <Textarea rows={2} value={footer} onChange={(e) => setFooter(e.target.value)} />
        </FormField>
        <FormField label="Pajak (%)">
          <Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} />
        </FormField>
        <Button isLoading={savingMeta} onClick={() => void saveMeta()}>
          Simpan
        </Button>
      </section>

      {/* Storefront mandiri (#C2) */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Toko Mandiri (Beli Sendiri)</h2>
        <p className="text-xs text-neutral-500">
          Aktifkan halaman publik agar pelanggan memesan sendiri lewat link/QR.
          Pembayaran diselesaikan di kasir. Stok tidak ditampilkan ke pelanggan.
        </p>
        <Switch
          checked={storeEnabled}
          onChange={setStoreEnabled}
          label="Aktifkan toko mandiri"
        />
        {storeEnabled && (
          <FormField label="Dompet tujuan dana order mandiri">
            <AccountSelect
              value={storeAccountId}
              onChange={(id) => setStoreAccountId(id as ID)}
              placeholder="Pilih dompet"
            />
          </FormField>
        )}
        <Button isLoading={savingStore} onClick={() => void saveStorefront()}>
          Simpan
        </Button>

        {settings?.storefrontEnabled && storeUrl && (
          <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-600">Link toko Anda</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700">
                {storeUrl}
              </code>
              <Button size="sm" variant="outline" leftIcon={<Copy size={12} />} onClick={copyStoreUrl}>
                Salin
              </Button>
              <a href={storeUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" leftIcon={<ExternalLink size={12} />}>
                  Buka
                </Button>
              </a>
            </div>
            <div className="flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(storeUrl)}`}
                alt="QR toko"
                className="h-44 w-44 rounded-lg border border-neutral-200 bg-white p-2"
              />
            </div>
            <p className="text-center text-[11px] text-neutral-400">
              Cetak QR ini untuk pelanggan scan & pesan mandiri.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BusinessSettingsPage;
