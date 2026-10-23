import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthTemplate } from "@dep/templates/auth";
import { ApiError } from "@dep/axios";
import * as authService from "@/services/auth.service";

const BRAND = {
  name: "Monage",
  logo: <img src="/logo.png" alt="Monage" className="h-8 w-8 object-contain" />,
  headline: "Lupa kata sandi? Tenang, bisa diatur ulang.",
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (data: { email: string }) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      await authService.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Gagal mengirim email reset. Coba lagi sebentar.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTemplate
      variant="minimal-card"
      mode="forgot"
      brand={BRAND}
      title="Reset kata sandi"
      subtitle="Kami kirim tautan reset ke email Anda."
      submitLabel="Kirim Tautan Reset"
      isLoading={isLoading}
      isSuccess={isSuccess}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onBackToLogin={() => navigate("/auth")}
    />
  );
}
