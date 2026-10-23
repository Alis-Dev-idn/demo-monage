import { useRef, useState } from "react";
import { Upload, Loader2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { FormField } from "@dep/ui/form";
import { Select } from "@dep/ui/select";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import * as restoreService from "@/services/restore.service";
import { useBooks } from "@/hooks/useBooks";

interface RestoreDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Restore JSON bundle modal. Two-step flow:
 *  1) User picks a `.json` file (manual export or cloud backup download).
 *  2) FE calls `/restore?mode=dry-run` to get a preview of what would land,
 *     then `/restore?mode=merge` only after the user confirms.
 *
 * The BE never overwrites existing data — restored rows always land under a
 * brand-new "Restored: <name>" book — but a dry-run still keeps the user
 * confident about what's about to happen.
 */
export function RestoreDataModal({ isOpen, onClose }: RestoreDataModalProps) {
  const { books, activeBook, refetch: refetchBooks } = useBooks();
  const inputRef = useRef<HTMLInputElement>(null);
  const [bundle, setBundle] = useState<Record<string, unknown> | null>(null);
  const [filename, setFilename] = useState<string>("");
  // Restore ke pembukuan existing (default: pembukuan aktif).
  const [targetBookId, setTargetBookId] = useState<string>(activeBook?._id ?? "");
  const [preview, setPreview] = useState<restoreService.RestoreSummary | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const bookOptions = books.map((b) => ({ value: b._id, label: b.name }));
  const selectedBook = bookOptions.find((o) => o.value === targetBookId) ?? null;

  const close = () => {
    setBundle(null);
    setFilename("");
    setPreview(null);
    setBusy(false);
    onClose();
  };

  const onFile = async (file: File) => {
    setFilename(file.name);
    setPreview(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("File JSON tidak valid (harus objek root).");
      }
      setBundle(parsed as Record<string, unknown>);
    } catch (err) {
      setBundle(null);
      notify.error(
        err instanceof Error ? err.message : "Gagal baca file. Pastikan format JSON.",
      );
    }
  };

  const runPreview = async () => {
    if (!bundle) return;
    if (!targetBookId) {
      notify.warning("Pilih pembukuan tujuan dulu.");
      return;
    }
    setBusy(true);
    try {
      const summary = await restoreService.restoreBundle({
        bundle,
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
    if (!bundle || !targetBookId) return;
    setBusy(true);
    try {
      const summary = await restoreService.restoreBundle({
        bundle,
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
        icon={<Upload size={20} className="text-emerald-500" />}
        title="Restore Data"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Tutup
            </Button>
            {bundle && !preview && (
              <Button
                onClick={() => void runPreview()}
                isLoading={busy}
                leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              >
                Preview
              </Button>
            )}
            {preview && (
              <Button
                onClick={() => void runCommit()}
                isLoading={busy}
                leftIcon={<Upload size={14} />}
              >
                Restore Sekarang
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Pilih file <code className="rounded bg-neutral-100 px-1">.json</code>{" "}
            hasil <strong>Export Data</strong> (manual atau dari cloud backup),
            lalu pilih <strong>pembukuan tujuan</strong>. Data akan ditambahkan ke
            pembukuan yang Anda pilih (tidak menimpa data yang sudah ada).
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <FileText size={18} className="text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">
                {filename || "Belum ada file dipilih"}
              </p>
              <p className="text-xs text-neutral-500">
                Format: JSON dari /export atau backup cloud.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Pilih File
            </Button>
          </div>

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
            <p className="mt-1 text-[11px] text-neutral-500">
              Semua data dari file akan dimasukkan ke pembukuan ini.
            </p>
          </FormField>

          {preview && (
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-medium">
                Preview — yang akan diimpor jika Anda lanjutkan:
              </p>
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
                    {preview.warnings.length > 5 && (
                      <li>…{preview.warnings.length - 5} lainnya</li>
                    )}
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
