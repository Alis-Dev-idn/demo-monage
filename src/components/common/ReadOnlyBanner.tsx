import { Eye } from "lucide-react";
import { useBookPermission } from "@/hooks/useBookPermission";
import { useBooks } from "@/hooks/useBooks";

/**
 * Banner kecil yang muncul di atas halaman saat user adalah `viewer` pada
 * pembukuan aktif. Mengingatkan bahwa aksi tulis tidak tersedia.
 */
export function ReadOnlyBanner() {
  const { role } = useBookPermission();
  const { activeBook } = useBooks();

  if (role !== "viewer" || !activeBook) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Eye size={18} className="mt-0.5 flex-shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Mode baca pada pembukuan "{activeBook.name}"</p>
        <p className="text-xs text-amber-700/80">
          Anda diundang sebagai Pengamat. Tidak bisa menambah/mengubah/menghapus
          data. Hubungi pemilik pembukuan jika butuh akses edit.
        </p>
      </div>
    </div>
  );
}
