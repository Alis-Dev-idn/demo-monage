import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Banner global saat offline (Batch O1). Memberi tahu user bahwa data yang
 * tampil adalah salinan terakhir & perubahan akan disinkronkan saat online.
 * (Antrian tulis offline = batch O3.)
 */
export function OfflineIndicator() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[9000] flex items-center justify-center gap-2 bg-neutral-800 px-4 py-2 text-center text-xs font-medium text-white"
    >
      <WifiOff size={14} className="flex-shrink-0" />
      <span>
        Mode offline — menampilkan data terakhir. Perubahan akan disinkronkan saat
        kembali online.
      </span>
    </div>
  );
}
