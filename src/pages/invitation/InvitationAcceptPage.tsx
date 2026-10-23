/* eslint-disable react-hooks/static-components -- ikon di-resolve dari registry (referensi stabil), bukan komponen baru tiap render */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveIcon } from "@/constants/iconRegistry";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@dep/ui/button";
import { LoadingSpinner } from "@dep/ui/loading";
import { InfoBox } from "@dep/ui/card";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as bookService from "@/services/book.service";
import type { InvitationPreview } from "@/services/book.service";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/hooks/useBookPermission";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";

const InvitationAcceptPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { refetch: refetchBooks, setActiveBook } = useBooks();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token undangan tidak ditemukan di URL.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await bookService.previewInvitation(token);
        if (!cancelled) setPreview(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat info undangan.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Simpan token + redirect ke login, lalu balik ke sini setelah login.
      sessionStorage.setItem("monage:pendingInvitation", token);
      navigate("/auth", { replace: false });
      return;
    }
    setBusy(true);
    try {
      const res = await notify.promise(bookService.acceptInvitation(token), {
        loading: "Bergabung…",
        success: "Selamat datang di pembukuan ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      await refetchBooks();
      setActiveBook(res.book._id);
      navigate("/dashboard/beranda", { replace: true });
    } catch {
      // surfaced
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      await notify.promise(bookService.declineInvitation(token), {
        loading: "Menolak…",
        success: "Undangan ditolak.",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal."),
      });
      navigate("/", { replace: true });
    } catch {
      // surfaced
    } finally {
      setBusy(false);
    }
  };

  if (isBootstrapping || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }

  if (error || !preview) {
    return (
      <main className="mx-auto max-w-md p-6">
        <InfoBox
          variant="error"
          title="Undangan tidak valid"
          description={error ?? "Tidak ada data."}
          action={{ label: "Ke Beranda", onClick: () => navigate("/") }}
        />
      </main>
    );
  }

  if (preview.status !== "pending") {
    const statusLabel =
      preview.status === "accepted"
        ? "Sudah diterima sebelumnya."
        : preview.status === "declined"
        ? "Undangan ini sudah ditolak."
        : preview.status === "expired"
        ? "Undangan sudah kadaluarsa."
        : "Undangan dicabut oleh pengundang.";
    return (
      <main className="mx-auto max-w-md p-6">
        <InfoBox
          variant="warning"
          title="Undangan tidak aktif"
          description={statusLabel}
          action={{ label: "Ke Beranda", onClick: () => navigate("/") }}
        />
      </main>
    );
  }

  const Icon = resolveIcon(preview.bookIcon, "Book");

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Icon size={26} aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Undangan Pembukuan
          </h1>
          <p className="text-sm text-neutral-500">
            <strong>{preview.invitedByName}</strong> mengundang Anda untuk gabung
            ke pembukuan <strong>"{preview.bookName}"</strong>.
          </p>
        </header>

        <div className="space-y-2 rounded-2xl bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Pembukuan</span>
            <span className="font-medium text-neutral-900">{preview.bookName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Role Anda</span>
            <span className="font-medium text-neutral-900">{ROLE_LABEL[preview.role]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Email tujuan</span>
            <span className="font-medium text-neutral-900">{preview.email}</span>
          </div>
        </div>

        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <strong>{ROLE_LABEL[preview.role]}</strong>: {ROLE_DESCRIPTION[preview.role]}
        </p>

        {!isAuthenticated && (
          <InfoBox
            variant="info"
            title="Login dulu untuk lanjut"
            description={`Belum punya akun? Daftar dengan email ${preview.email} dulu.`}
          />
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<X size={14} />}
            onClick={() => void handleDecline()}
            disabled={busy}
          >
            Tolak
          </Button>
          <Button
            fullWidth
            leftIcon={<Check size={14} />}
            rightIcon={<ArrowRight size={14} />}
            onClick={() => void handleAccept()}
            isLoading={busy}
          >
            {isAuthenticated ? "Terima Undangan" : "Login & Terima"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default InvitationAcceptPage;
