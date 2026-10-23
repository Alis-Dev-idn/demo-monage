import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@dep/ui/button";
import { Modal } from "@dep/ui/modal";
import { FormField, RadioGroup } from "@dep/ui/form";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { ModalShell } from "@/components/common/ModalShell";
import * as exportService from "@/services/export.service";
import { useBooks } from "@/hooks/useBooks";
import type { ExportFormat, ExportJob, ExportScope } from "@/types";

const ALL_SCOPES: { value: ExportScope; label: string }[] = [
  { value: "profile", label: "Profil & preferensi" },
  { value: "books", label: "Pembukuan" },
  { value: "accounts", label: "Dompet" },
  { value: "categories", label: "Kategori" },
  { value: "transactions", label: "Transaksi" },
  { value: "budgets", label: "Anggaran" },
  { value: "savings", label: "Tabungan" },
  { value: "savingMovements", label: "Riwayat setoran tabungan" },
];

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string }> = [
  { value: "json", label: "JSON (lengkap, untuk restore)" },
  { value: "xlsx", label: "Excel (.xlsx — laporan)" },
  { value: "csv", label: "CSV (transaksi saja)" },
];

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const { books, activeBook } = useBooks();
  const [format, setFormat] = useState<ExportFormat>("json");
  const [scope, setScope] = useState<ExportScope[]>(ALL_SCOPES.map((s) => s.value));
  const [bookScope, setBookScope] = useState<"all" | "active">("active");
  const [job, setJob] = useState<ExportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const toggleScope = (s: ExportScope) => {
    setScope((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const startExport = async () => {
    if (scope.length === 0) {
      notify.warning("Pilih minimal 1 kategori data");
      return;
    }
    setBusy(true);
    try {
      const newJob = await exportService.requestExport({
        format,
        scope,
        bookId: bookScope === "active" ? activeBook?._id : undefined,
      });
      setJob(newJob);
      if (newJob.status === "completed") {
        await triggerDownload(newJob);
      } else {
        startPolling(newJob.id);
      }
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal memulai ekspor.");
    } finally {
      setBusy(false);
    }
  };

  const startPolling = (jobId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const updated = await exportService.fetchExportJob(jobId);
        setJob(updated);
        if (updated.status === "completed") {
          window.clearInterval(pollRef.current ?? undefined);
          pollRef.current = null;
          await triggerDownload(updated);
        } else if (updated.status === "failed") {
          window.clearInterval(pollRef.current ?? undefined);
          pollRef.current = null;
          notify.error(updated.errorMessage ?? "Ekspor gagal.");
        }
      } catch {
        // Diam — coba lagi di interval berikutnya.
      }
    }, 1000);
  };

  /**
   * Authenticated download — fetches the file via axios so the access token
   * Bearer header is attached, then triggers the browser save with the right
   * MIME-driven extension. Anchor `href` downloads can't do this because the
   * browser navigation drops the in-memory access token.
   */
  const triggerDownload = async (j: ExportJob) => {
    try {
      await exportService.downloadExportFile(j);
      notify.success("File berhasil diunduh ✓");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Gagal mengunduh file.");
    }
  };

  const close = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setJob(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} size="md">
      <ModalShell
        icon={<Download size={20} className="text-emerald-500" />}
        title="Export Data"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Tutup
            </Button>
            <Button
              leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              onClick={() => void startExport()}
              isLoading={busy}
              disabled={busy || (job?.status === "processing")}
            >
              Mulai Export
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Server akan menyiapkan file berisi semua data sesuai pilihan. File besar
            bisa butuh beberapa detik — link download muncul otomatis saat selesai.
          </p>

          <FormField label="Format file">
            <RadioGroup
              name="export-format"
              value={format}
              onChange={(v) => setFormat(v as ExportFormat)}
              options={FORMAT_OPTIONS}
            />
          </FormField>

          <FormField label="Cakupan pembukuan">
            <RadioGroup
              name="export-book-scope"
              value={bookScope}
              onChange={(v) => setBookScope(v as "all" | "active")}
              options={[
                {
                  value: "active",
                  label: `Pembukuan aktif (${activeBook?.name ?? "—"})`,
                },
                {
                  value: "all",
                  label: `Semua pembukuan (${books.length})`,
                },
              ]}
            />
          </FormField>

          <FormField label="Data yang di-export">
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_SCOPES.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={scope.includes(s.value)}
                    onChange={() => toggleScope(s.value)}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">
              JSON menyimpan SEMUA pilihan secara strukturized. Excel/CSV biasanya
              dipakai untuk olah lanjutan di spreadsheet.
            </p>
          </FormField>

          {job && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                job.status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : job.status === "failed"
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {job.status === "completed" ? (
                  <FileText size={16} />
                ) : job.status === "failed" ? (
                  <FileText size={16} />
                ) : (
                  <Loader2 size={16} className="animate-spin" />
                )}
                <p className="font-medium">
                  {job.status === "completed"
                    ? `Selesai — ${(job.fileSizeBytes ?? 0).toLocaleString("id-ID")} bytes`
                    : job.status === "failed"
                      ? `Gagal: ${job.errorMessage ?? "unknown"}`
                      : "Sedang memproses…"}
                </p>
              </div>
              {job.status === "completed" && job.downloadUrl && (
                <button
                  type="button"
                  onClick={() => void triggerDownload(job)}
                  className="mt-1.5 text-xs underline hover:no-underline"
                >
                  Unduh lagi
                </button>
              )}
            </div>
          )}
        </div>
      </ModalShell>
    </Modal>
  );
}
