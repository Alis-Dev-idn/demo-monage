import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CloudDownload, FileText, Loader2 } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { FormField } from "@dep/ui/form";
import { Select } from "@dep/ui/select";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import * as backupService from "@/services/backup.service";
import type { RestoreSummary } from "@/services/restore.service";
import { useBooks } from "@/hooks/useBooks";
import type { CloudFileItem, CloudProvider } from "@/types";

interface CloudRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: CloudProvider;
  providerLabel: string;
}

/**
 * Restore dari backup cloud (Google Drive dst) — paritas dengan mobile
 * (`restore-data-sheet`). Pilih file backup → preview (dry-run) → restore (merge)
 * ke pembukuan tujuan. Tidak menimpa data existing. (v1.7)
 */
export function CloudRestoreModal({
  isOpen,
  onClose,
  provider,
  providerLabel,
}: CloudRestoreModalProps) {
  const { books, activeBook, refetch: refetchBooks } = useBooks();
  const [files, setFiles] = useState<CloudFileItem[] | null>(null);
  const [fileId, setFileId] = useState<string>("");
  const [targetBookId, setTargetBookId] = useState<string>(activeBook?._id ?? "");
  const [preview, setPreview] = useState<RestoreSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const bookOptions = books.map((b) => ({ value: b._id, label: b.name }));
  const selectedBook = bookOptions.find((o) => o.value === targetBookId) ?? null;

  const loadFiles = useCallback(async () => {
    setFiles(null);
    try {
      const list = await backupService.listCloudFiles(provider);
      setFiles(list);
      // Pra-pilih backup terbaru (API mengurut desc) agar user tinggal preview.
      setFileId(list[0]?.fileId ?? "");
    } catch (err) {
      setFiles([]);
      notify.error(err instanceof ApiError ? err.message : "Gagal memuat daftar backup.");
    }
  }, [provider]);

  useEffect(() => {
    if (isOpen) void loadFiles();
  }, [isOpen, loadFiles]);

  const close = () => {
    setFiles(null);
    setFileId("");
    setPreview(null);
    setBusy(false);
    onClose();
  };

  const runPreview = async () => {
    if (!fileId) return notify.warning("Pilih file backup dulu.");
    if (!targetBookId) return notify.warning("Pilih pembukuan tujuan dulu.");
    setBusy(true);
    try {
      const summary = await backupService.restoreFromCloud({
        provider,
        fileId,
        mode: "dry-run",
        targetBookId,
      });
      setPreview(summary);
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal memuat preview.");
    } finally {
      setBusy(false);
    }
  };

  const runCommit = async () => {
    if (!fileId || !targetBookId) return;
    setBusy(true);
    try {
      const summary = await backupService.restoreFromCloud({
        provider,
        fileId,
        mode: "merge",
        targetBookId,
      });
      notify.success(
        `Restore selesai ✓ ${summary.transactions} transaksi masuk ke "${
          selectedBook?.label ?? "pembukuan"
        }".`,
      );
      await refetchBooks();
      close();
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal restore data.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} size="md">
      <ModalShell
        icon={<CloudDownload size={20} className="text-emerald-500" />}
        title={`Restore dari ${providerLabel}`}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Tutup
            </Button>
            {!preview ? (
              <Button
                onClick={() => void runPreview()}
                isLoading={busy}
                disabled={!fileId}
                leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              >
                Preview
              </Button>
            ) : (
              <Button onClick={() => void runCommit()} isLoading={busy} leftIcon={<CloudDownload size={14} />}>
                Restore Sekarang
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Pilih salinan backup dari <strong>{providerLabel}</strong>, lalu pembukuan
            tujuan. Data ditambahkan ke pembukuan yang dipilih (tidak menimpa data
            yang sudah ada).
          </p>

          <FormField label="File backup" required>
            {files === null ? (
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-3 text-sm text-neutral-500">
                <Loader2 size={14} className="animate-spin" /> Memuat daftar backup…
              </div>
            ) : files.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500">
                Belum ada file backup di {providerLabel}. Buat backup dulu.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-1">
                {files.map((f) => {
                  const active = f.fileId === fileId;
                  return (
                    <li key={f.fileId}>
                      <button
                        type="button"
                        onClick={() => {
                          setFileId(f.fileId);
                          setPreview(null);
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                          active ? "bg-emerald-50 text-emerald-800" : "hover:bg-neutral-50"
                        }`}
                      >
                        <FileText size={14} className={active ? "text-emerald-600" : "text-neutral-400"} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{f.name}</span>
                          <span className="block text-[11px] text-neutral-500">
                            {new Date(f.createdAt).toLocaleString("id-ID")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </FormField>

          <FormField label="Pembukuan tujuan" required>
            <Select
              value={selectedBook}
              options={bookOptions}
              onChange={(opt) => {
                setTargetBookId(opt ? (opt.value as string) : "");
                setPreview(null);
              }}
              isClearable={false}
              placeholder="Pilih pembukuan…"
            />
          </FormField>

          {preview && (
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-medium">Preview — yang akan diimpor jika dilanjutkan:</p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <li>Pembukuan: <strong>{preview.books}</strong></li>
                <li>Dompet: <strong>{preview.accounts}</strong></li>
                <li>Kategori: <strong>{preview.categories}</strong></li>
                <li>Transaksi: <strong>{preview.transactions}</strong></li>
                <li>Anggaran: <strong>{preview.budgets}</strong></li>
                <li>Tabungan: <strong>{preview.savings}</strong></li>
                <li>Setoran Tabungan: <strong>{preview.savingMovements}</strong></li>
                <li>Produk: <strong>{preview.products}</strong></li>
                <li>Penjualan: <strong>{preview.sales}</strong></li>
                <li>Pergerakan Stok: <strong>{preview.stockMovements}</strong></li>
                <li>Pengaturan Bisnis: <strong>{preview.businessSettings}</strong></li>
                <li>Transfer Antar-Buku: <strong>{preview.bookTransfers}</strong></li>
                <li>Rencana Bulanan: <strong>{preview.monthlyPlans}</strong></li>
              </ul>
              {preview.warnings.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                  <div className="mb-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {preview.warnings.length} peringatan
                  </div>
                  <ul className="ml-3 list-disc">
                    {preview.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {preview.warnings.length > 5 && <li>…{preview.warnings.length - 5} lainnya</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalShell>
    </Modal>
  );
}
