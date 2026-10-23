import { AlertTriangle } from "lucide-react";
import type { DemoPersonaId } from "@/mocks/storage/reset";

interface ResetWarningBlockProps {
  selectedPersona: DemoPersonaId;
  onSelectPersona: (persona: DemoPersonaId) => void;
}

export function ResetWarningBlock({
  selectedPersona,
  onSelectPersona,
}: ResetWarningBlockProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-800">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <span>PERINGATAN AKSI DESTRUKTIF:</span>
        </div>
        <p className="mt-1 leading-relaxed font-medium">
          Semua transaksi baru, produk tambahan, perubahan kategori, dan anggaran yang Anda ubah di peramban ini akan DIHAPUS PERMANEN.
        </p>
        <div className="mt-2 text-neutral-600">
          <p className="font-medium text-neutral-700">Aplikasi akan kembali ke data simulasi bawaan:</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            <li>Akun Budi Santoso (15+ transaksi, 3 dompet, 2 tabungan)</li>
            <li>Toko Warung Berkah (12 produk, riwayat POS, kasir)</li>
            <li>Akun Baru (onboarding bersih tanpa data transaksi)</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5">
        <label className="block text-xs font-semibold text-neutral-800 mb-2">
          Pilihan persona aktif setelah reset:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSelectPersona("personal")}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
              selectedPersona === "personal"
                ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                selectedPersona === "personal" ? "bg-emerald-600" : "bg-neutral-300"
              }`}
            />
            <span>Personal (Budi)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPersona("business")}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
              selectedPersona === "business"
                ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                selectedPersona === "business" ? "bg-indigo-600" : "bg-neutral-300"
              }`}
            />
            <span>Bisnis (Siti)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPersona("fresh")}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
              selectedPersona === "fresh"
                ? "border-sky-500 bg-sky-50 text-sky-900 font-semibold"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                selectedPersona === "fresh" ? "bg-sky-600" : "bg-neutral-300"
              }`}
            />
            <span>Akun Baru (Fresh)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
