import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthTemplate } from "@dep/templates/auth";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const BRAND = {
  name: "Monage",
  logo: <img src="/logo.png" alt="Monage" className="h-8 w-8 object-contain" />,
  headline: "Mulai kelola uangmu dengan cara yang sederhana.",
  description: "Daftar gratis, langsung bisa catat transaksi pertama dalam hitungan detik.",
  features: [
    "Setup awal di bawah 1 menit",
    "Kategori dan dompet bawaan siap pakai",
    "Aman: data Anda hanya untuk Anda",
  ],
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (data: {
    fullName: string;
    email: string;
    password: string;
    agree: boolean;
  }) => {
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const user = await register({
        name: data.fullName,
        email: data.email,
        password: data.password,
      });
      notify.success(`Akun ${user.name} berhasil dibuat 🎉`);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Gagal mendaftar. Coba lagi sebentar.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTemplate
      variant="minimal-card"
      mode="register"
      brand={BRAND}
      title="Buat akun Monage"
      subtitle="Gratis, tanpa kartu kredit."
      submitLabel="Daftar Sekarang"
      isLoading={isLoading}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onLogin={() => navigate("/auth")}
      socialSlot={<GoogleSignInButton mode="register" />}
    />
  );
}
