import { useState } from "react";
import { InfoBox } from "@dep/ui/card";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useAuth } from "@/hooks/useAuth";
import { resendVerification } from "@/services/auth.service";

/**
 * Banner pengingat verifikasi email. Tampil hanya bila user login tapi
 * `emailVerifiedAt` masih kosong. Verifikasi wajib untuk klaim trial Premium.
 *
 * Disembunyikan untuk sesi demo (`user.isDemo`) — email demo
 * (`demo-<uuid>@monage.local`) tidak pernah bisa diverifikasi sungguhan.
 */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerifiedAt || user.isDemo) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification(user.email);
      notify.success("Email verifikasi dikirim ulang. Cek inbox Anda.");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : "Gagal mengirim ulang.");
    } finally {
      setSending(false);
    }
  };

  return (
    <InfoBox
      variant="warning"
      title="Email belum diverifikasi"
      description="Verifikasi email Anda untuk mengamankan akun dan membuka klaim trial Premium 1 bulan gratis."
      action={{
        label: sending ? "Mengirim…" : "Kirim ulang verifikasi",
        onClick: () => void handleResend(),
      }}
    />
  );
}
