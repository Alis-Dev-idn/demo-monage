import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Mail, X } from "lucide-react";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as authService from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";

type Phase = "verifying" | "success" | "error" | "missing-token";

/**
 * Halaman verifikasi email — dibuka dari tautan email pendaftaran
 * (`/auth/verify-email?token=...`). Publik (tanpa GuestGuard) supaya tetap bisa
 * diakses meski user sudah login. Setelah sukses, refresh user agar
 * `emailVerifiedAt` ter-update di state.
 */
const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { isAuthenticated, user, refresh } = useAuth();
  const [phase, setPhase] = useState<Phase>(token ? "verifying" : "missing-token");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [resending, setResending] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    (async () => {
      try {
        await authService.verifyEmail(token);
        // Segarkan user (emailVerifiedAt) bila sedang login — abaikan errornya.
        if (isAuthenticated) await refresh().catch(() => {});
        setPhase("success");
        notify.success("Email berhasil diverifikasi ✓");
      } catch (err) {
        setErrorMessage(
          err instanceof ApiError
            ? err.message
            : "Gagal memverifikasi email. Tautan mungkin sudah kedaluwarsa.",
        );
        setPhase("error");
      }
    })();
  }, [token, isAuthenticated, refresh]);

  const handleResend = async () => {
    if (!user?.email) {
      navigate("/auth", { replace: false });
      return;
    }
    setResending(true);
    try {
      await authService.resendVerification(user.email);
      notify.success("Email verifikasi baru telah dikirim. Cek inbox Anda.");
    } catch (err) {
      notify.error(
        err instanceof ApiError ? err.message : "Gagal mengirim ulang.",
      );
    } finally {
      setResending(false);
    }
  };

  if (phase === "verifying") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <LoadingSpinner />
          <p className="text-sm text-neutral-500">Memverifikasi email Anda…</p>
        </div>
      </main>
    );
  }

  const isOk = phase === "success";

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            isOk ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {isOk ? <Check size={26} aria-hidden /> : <X size={26} aria-hidden />}
        </div>
        <header className="space-y-2">
          <h1 className="text-xl font-semibold text-neutral-900">
            {isOk ? "Email terverifikasi" : "Verifikasi gagal"}
          </h1>
          <p className="text-sm text-neutral-500">
            {isOk
              ? "Terima kasih! Email Anda sudah terverifikasi. Anda kini bisa mengklaim trial Premium 1 bulan gratis."
              : phase === "missing-token"
                ? "Token verifikasi tidak ditemukan di URL."
                : (errorMessage ?? "Tautan verifikasi tidak valid.")}
          </p>
        </header>

        <div className="flex flex-col gap-2">
          {isOk ? (
            <Button
              fullWidth
              rightIcon={<ArrowRight size={14} />}
              onClick={() =>
                navigate(isAuthenticated ? "/dashboard/beranda" : "/auth", {
                  replace: true,
                })
              }
            >
              {isAuthenticated ? "Ke Beranda" : "Masuk"}
            </Button>
          ) : (
            <>
              <Button
                fullWidth
                leftIcon={<Mail size={14} />}
                onClick={() => void handleResend()}
                isLoading={resending}
              >
                Kirim ulang verifikasi
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate("/auth", { replace: true })}
              >
                Kembali ke Masuk
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
