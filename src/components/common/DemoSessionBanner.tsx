import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Muncul di atas konten dashboard selama sesi demo ephemeral aktif
 * (`user.isDemo`). Data sesi ini dihapus otomatis oleh backend dalam
 * beberapa jam — banner ini mengingatkan supaya user tidak kaget saat
 * datanya hilang, dan menawarkan jalan untuk menyimpannya permanen.
 */
export function DemoSessionBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.isDemo) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <span className="flex items-center gap-2">
        <Sparkles size={16} className="shrink-0" />
        Ini sesi demo — data akan terhapus otomatis dalam beberapa jam.
      </span>
      <button
        type="button"
        onClick={() => navigate("/auth/register")}
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        Buat Akun Asli
      </button>
    </div>
  );
}
