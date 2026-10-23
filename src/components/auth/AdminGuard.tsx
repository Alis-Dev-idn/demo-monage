import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@dep/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/types";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Gate halaman `/dashboard/admin/*`. User non-admin di-redirect ke
 * `/403`. Selama bootstrap (saat token sedang divalidasi) render
 * spinner agar tidak salah redirect.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isBootstrapping } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isBootstrapping) return;
    if (!user) {
      // Belum login (atau baru logout) → lempar ke login, BUKAN /403.
      // Tanpa cek ini, logout dari halaman admin terlihat seperti "akses
      // ditolak" padahal user memang sudah sengaja keluar.
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin(user)) {
      navigate("/403", { replace: true });
    }
  }, [user, isBootstrapping, navigate]);

  if (isBootstrapping) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!user || !isAdmin(user)) return null;
  return <>{children}</>;
}
