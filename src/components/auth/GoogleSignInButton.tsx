import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useAuth } from "@/hooks/useAuth";
import { GoogleAuthCancelled } from "@/services/auth.service";

/** Logo Google resmi (multi-warna). */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  /** Hanya memengaruhi label tombol. Backend tetap satu alur (auto-daftar). */
  mode?: "login" | "register";
}

/**
 * Tombol "Lanjut dengan Google". Memicu popup OAuth (lihat
 * `auth.service.loginWithGoogle`), lalu navigasi ke dashboard/onboarding sesuai
 * `onboardedAt` (user Google baru → onboarding).
 */
export function GoogleSignInButton({ mode = "login" }: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      notify.success(`Halo, ${user.name.split(" ")[0]} 👋`);
      navigate(user.onboardedAt ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err) {
      // User menutup popup → bukan error nyata, diamkan.
      if (err instanceof GoogleAuthCancelled) return;
      notify.error(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const label =
    mode === "register" ? "Daftar dengan Google" : "Lanjut dengan Google";

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleLogo />
      {loading ? "Menghubungkan…" : label}
    </button>
  );
}
