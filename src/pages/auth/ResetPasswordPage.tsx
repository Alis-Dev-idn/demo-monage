import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthTemplate } from "@dep/templates/auth";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import * as authService from "@/services/auth.service";

const BRAND = {
  name: "Monage",
  headline: "Buat kata sandi baru.",
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (data: { password: string }) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      await authService.resetPassword(token, data.password);
      setSuccess(true);
      notify.success("Kata sandi berhasil diubah ✓");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Gagal mengubah kata sandi. Coba lagi sebentar.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTemplate
      variant="minimal-card"
      mode="reset"
      brand={BRAND}
      title="Reset kata sandi"
      subtitle="Masukkan kata sandi baru Anda."
      submitLabel="Simpan Kata Sandi"
      isLoading={isLoading}
      isSuccess={isSuccess}
      isTokenValid={!!token}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onBackToLogin={() => navigate("/auth")}
    />
  );
}
